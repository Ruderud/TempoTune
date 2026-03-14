import type { AudioCaptureConfig, AudioSessionState, AudioSessionStatus } from '@tempo-tune/shared/types';
import { getAudioContext, resumeAudioContext } from './audio-context.service';

export type AudioFrameConsumer = (timeDomainData: Float32Array<ArrayBuffer>, sampleRate: number) => void;

/**
 * Owns the single web audio input session (getUserMedia + AnalyserNode).
 * Multiple analyzers subscribe as frame consumers.
 * Only one capture session is active at a time.
 */
export class LiveInputAudioService {
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private timeDomainBuffer: Float32Array<ArrayBuffer> | null = null;
  private animationFrameId: number | null = null;
  private isCapturing = false;
  private consumers: Set<AudioFrameConsumer> = new Set();
  private stateCallbacks: Set<(state: AudioSessionState) => void> = new Set();
  private currentState: AudioSessionState = {
    status: 'idle',
    timestampSource: 'monotonic',
  };

  /**
   * Start capturing audio from the specified device (or default).
   */
  async startCapture(config: AudioCaptureConfig): Promise<void> {
    if (this.isCapturing) return;

    this.emitState('starting');

    try {
      await resumeAudioContext();
      const ctx = getAudioContext();

      const constraints: MediaTrackConstraints & { latency?: number } = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        latency: 0,
        channelCount: 1,
      };

      if (config.deviceId && config.deviceId !== 'default') {
        constraints.deviceId = { exact: config.deviceId };
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: constraints,
      });

      this.sourceNode = ctx.createMediaStreamSource(this.mediaStream);

      const fftSize = config.bufferSize ?? 1024;
      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = fftSize;
      this.analyserNode.smoothingTimeConstant = 0;
      this.timeDomainBuffer = new Float32Array(fftSize) as Float32Array<ArrayBuffer>;

      this.sourceNode.connect(this.analyserNode);
      this.isCapturing = true;

      this.emitState('running', {
        deviceId: config.deviceId,
        sampleRate: ctx.sampleRate,
        channelCount: 1,
        startedAtMonotonicMs: performance.now(),
      });

      this.processFrames();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.emitState('error', { errorMessage: message });
      throw err;
    }
  }

  /**
   * Stop the current capture session.
   */
  stopCapture(): void {
    if (!this.isCapturing) return;
    this.isCapturing = false;

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

    this.emitState('idle');
  }

  /**
   * Subscribe to audio frames. Returns unsubscribe function.
   */
  addConsumer(consumer: AudioFrameConsumer): () => void {
    this.consumers.add(consumer);
    return () => {
      this.consumers.delete(consumer);
    };
  }

  /**
   * Subscribe to session state changes.
   */
  onStateChanged(callback: (state: AudioSessionState) => void): () => void {
    this.stateCallbacks.add(callback);
    return () => {
      this.stateCallbacks.delete(callback);
    };
  }

  getState(): AudioSessionState {
    return this.currentState;
  }

  getIsCapturing(): boolean {
    return this.isCapturing;
  }

  dispose(): void {
    this.stopCapture();
    this.consumers.clear();
    this.stateCallbacks.clear();
  }

  private processFrames(): void {
    if (!this.isCapturing || !this.analyserNode || !this.timeDomainBuffer) return;

    this.analyserNode.getFloatTimeDomainData(this.timeDomainBuffer);
    const ctx = getAudioContext();

    for (const consumer of this.consumers) {
      consumer(this.timeDomainBuffer, ctx.sampleRate);
    }

    this.animationFrameId = requestAnimationFrame(() => this.processFrames());
  }

  private emitState(status: AudioSessionStatus, extra?: Partial<AudioSessionState>): void {
    this.currentState = {
      ...this.currentState,
      status,
      timestampSource: 'monotonic',
      ...extra,
    };
    for (const cb of this.stateCallbacks) {
      cb(this.currentState);
    }
  }
}
