import type { TunerNote, TuningPreset, TuningString } from '@tempo-tune/shared/types';
import { DEFAULT_FFT_SIZE, DEFAULT_BUFFER_SIZE } from '@tempo-tune/shared/constants';
import { TunerEngine } from '@tempo-tune/audio/tuner';
import { getAudioContext, resumeAudioContext } from './audio-context.service';

export class TunerAudioService {
  private engine: TunerEngine;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private isListening = false;
  private noteCallbacks: Set<(note: TunerNote | null) => void> = new Set();

  constructor() {
    this.engine = new TunerEngine();
  }

  async start(): Promise<void> {
    if (this.isListening) return;

    await resumeAudioContext();
    const ctx = getAudioContext();

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.sourceNode = ctx.createMediaStreamSource(this.mediaStream);
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = DEFAULT_FFT_SIZE;

    this.sourceNode.connect(this.analyserNode);
    this.isListening = true;
    this.processAudio();
  }

  stop(): void {
    if (!this.isListening) return;
    this.isListening = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.analyserNode = null;
  }

  onNoteDetected(callback: (note: TunerNote | null) => void): () => void {
    this.noteCallbacks.add(callback);
    return () => { this.noteCallbacks.delete(callback); };
  }

  setPreset(preset: TuningPreset): void {
    this.engine.setPreset(preset);
  }

  setReferenceFrequency(frequency: number): void {
    this.engine.setReferenceFrequency(frequency);
  }

  findClosestString(frequency: number): TuningString | null {
    return this.engine.findClosestString(frequency);
  }

  getCentsFromTarget(frequency: number, target: TuningString): number {
    return this.engine.getCentsFromTarget(frequency, target);
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  dispose(): void {
    this.stop();
    this.noteCallbacks.clear();
    this.engine.dispose();
  }

  private processAudio(): void {
    if (!this.isListening || !this.analyserNode) return;

    const bufferLength = DEFAULT_BUFFER_SIZE;
    const dataArray = new Float32Array(bufferLength);
    this.analyserNode.getFloatTimeDomainData(dataArray);

    const note = this.engine.processAudioData(dataArray);
    for (const callback of this.noteCallbacks) {
      callback(note);
    }

    this.animationFrameId = requestAnimationFrame(() => this.processAudio());
  }
}
