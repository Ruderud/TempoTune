import type { TunerNote, TuningPreset, TuningString } from '@tempo-tune/shared/types';
import { DEFAULT_FFT_SIZE } from '@tempo-tune/shared/constants';
import { frequencyToNote } from '@tempo-tune/shared/utils';
import { TunerEngine, type YinConfig } from '@tempo-tune/audio/tuner';
import { getAudioContext, resumeAudioContext } from './audio-context.service';

const ANALYSIS_FFT_SIZE = Math.max(1024, DEFAULT_FFT_SIZE / 2);
const LATENCY_LOG_THROTTLE_MS = 120;
const DEFAULT_PITCH_DETECTION_CONFIG: Partial<YinConfig> = {
  minFrequency: 55,
  maxFrequency: 1400,
  probabilityThreshold: 0.2,
  rmsThreshold: 0.008,
  smoothingAlpha: 0.2,
  medianWindowSize: 5,
  maxJumpCents: 80,
};

function isLatencyDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (window.localStorage.getItem('tempo_tuner_latency_debug') === '1') return true;
  } catch {
    // ignore storage errors
  }

  try {
    return new URLSearchParams(window.location.search).get('tunerDebug') === '1';
  } catch {
    return false;
  }
}

export class TunerAudioService {
  private engine: TunerEngine;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private timeDomainBuffer: Float32Array<ArrayBuffer> | null = null;
  private animationFrameId: number | null = null;
  private isListening = false;
  private lastLatencyLogAt = 0;
  private noteCallbacks: Set<(note: TunerNote | null) => void> = new Set();
  private pitchDetectionConfig: Partial<YinConfig> = DEFAULT_PITCH_DETECTION_CONFIG;

  constructor() {
    this.engine = new TunerEngine({ bufferSize: ANALYSIS_FFT_SIZE });
    this.engine.setPitchDetectionConfig(this.pitchDetectionConfig);
  }

  async start(): Promise<void> {
    if (this.isListening) return;

    await resumeAudioContext();
    const ctx = getAudioContext();

    const audioConstraints: MediaTrackConstraints & { latency?: number } = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      latency: 0,
      channelCount: 1,
    };

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
    });

    this.sourceNode = ctx.createMediaStreamSource(this.mediaStream);
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = ANALYSIS_FFT_SIZE;
    this.analyserNode.smoothingTimeConstant = 0;
    this.engine.setAudioConfig({
      sampleRate: ctx.sampleRate,
      bufferSize: this.analyserNode.fftSize,
    });
    this.engine.setPitchDetectionConfig(this.pitchDetectionConfig);
    this.timeDomainBuffer = new Float32Array(this.analyserNode.fftSize) as Float32Array<ArrayBuffer>;

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
    this.timeDomainBuffer = null;
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

  setPitchDetectionConfig(config: Partial<YinConfig>): void {
    this.pitchDetectionConfig = {
      ...this.pitchDetectionConfig,
      ...config,
    };
    this.engine.setPitchDetectionConfig(this.pitchDetectionConfig);
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

    const frameStartMs = performance.now();
    const bufferLength = this.analyserNode.fftSize;
    if (!this.timeDomainBuffer || this.timeDomainBuffer.length !== bufferLength) {
      this.timeDomainBuffer = new Float32Array(bufferLength) as Float32Array<ArrayBuffer>;
    }
    const dataArray = this.timeDomainBuffer;
    this.analyserNode.getFloatTimeDomainData(dataArray);

    const pitch = this.engine.detectPitch(dataArray);
    const noteWithDebug = pitch
      ? {
          ...frequencyToNote(pitch.frequency, this.engine.getReferenceFrequency()),
          confidence: pitch.confidence,
          rms: pitch.rms,
          detectedAtMs: Date.now(),
          debugSource: 'web' as const,
        }
      : null;

    if (isLatencyDebugEnabled()) {
      const now = performance.now();
      if (noteWithDebug || now - this.lastLatencyLogAt >= LATENCY_LOG_THROTTLE_MS) {
        const processMs = now - frameStartMs;
        const noteLabel = noteWithDebug ? `${noteWithDebug.name}${noteWithDebug.octave}` : '-';
        const confidenceLabel = noteWithDebug?.confidence ? `${(noteWithDebug.confidence * 100).toFixed(0)}%` : '-';
        console.info(
          `[tuner-latency:web] process=${processMs.toFixed(2)}ms fft=${bufferLength} note=${noteLabel} conf=${confidenceLabel}`,
        );
        this.lastLatencyLogAt = now;
      }
    }

    for (const callback of this.noteCallbacks) {
      callback(noteWithDebug);
    }

    this.animationFrameId = requestAnimationFrame(() => this.processAudio());
  }
}
