import type { AudioInputBridge } from '../contracts/audio-input-bridge.interface';
import type { AudioInputPlatformAdapter } from '../contracts/audio-input-platform-adapter.interface';
import type { AudioFrameConsumer, AudioAnalyzerConfig } from '../contracts/audio-frame.types';
import type {
  AudioPermissionStatus,
  AudioInputDevice,
  AudioCaptureConfig,
  AudioSessionState,
  PitchDetectionEvent,
  RhythmHitEvent,
} from '@tempo-tune/shared/types';
import { AudioInputEventBus } from '../state/audio-input-events';
import { AudioInputSessionStore } from '../state/audio-input-session.store';

/**
 * Platform-agnostic audio input facade.
 * Owns the singleton capture session and delegates to a platform adapter.
 * All event fan-out goes through the internal event bus.
 */
export class AudioInputBridgeImpl implements AudioInputBridge {
  private adapter: AudioInputPlatformAdapter;
  private events = new AudioInputEventBus();
  private session = new AudioInputSessionStore();
  private adapterCleanups: (() => void)[] = [];

  constructor(adapter: AudioInputPlatformAdapter) {
    this.adapter = adapter;
    this.wireAdapterEvents();
  }

  async requestPermission(): Promise<AudioPermissionStatus> {
    return this.adapter.requestPermission();
  }

  async getPermissionStatus(): Promise<AudioPermissionStatus> {
    return this.adapter.getPermissionStatus();
  }

  async listInputDevices(): Promise<AudioInputDevice[]> {
    return this.adapter.listInputDevices();
  }

  async getSelectedInputDevice(): Promise<AudioInputDevice | null> {
    return this.adapter.getSelectedInputDevice();
  }

  async selectInputDevice(deviceId: string): Promise<void> {
    return this.adapter.selectInputDevice(deviceId);
  }

  async startCapture(config: AudioCaptureConfig): Promise<void> {
    if (this.session.isCapturing() || this.session.getStatus() === 'starting') return;
    this.session.update({ status: 'starting' });
    try {
      await this.adapter.startCapture(config);
    } catch (err) {
      this.session.update({
        status: 'error',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async stopCapture(): Promise<void> {
    if (!this.session.isCapturing() && this.session.getStatus() !== 'starting') return;
    await this.adapter.stopCapture();
  }

  async configureAnalyzers(config: AudioAnalyzerConfig): Promise<void> {
    return this.adapter.setAnalyzerConfig(config);
  }

  addFrameConsumer?(consumer: AudioFrameConsumer): () => void;

  onSessionStateChanged(callback: (state: AudioSessionState) => void): () => void {
    return this.events.onSessionStateChanged(callback);
  }

  onPitchDetected(callback: (event: PitchDetectionEvent) => void): () => void {
    return this.events.onPitchDetected(callback);
  }

  onRhythmHitDetected(callback: (event: RhythmHitEvent) => void): () => void {
    return this.events.onRhythmHitDetected(callback);
  }

  onRouteChanged(callback: (devices: AudioInputDevice[]) => void): () => void {
    return this.events.onRouteChanged(callback);
  }

  onError(callback: (error: Error) => void): () => void {
    return this.events.onError(callback);
  }

  dispose(): void {
    for (const cleanup of this.adapterCleanups) cleanup();
    this.adapterCleanups = [];
    this.events.dispose();
    this.session.dispose();
    this.adapter.dispose();
  }

  private wireAdapterEvents(): void {
    this.adapterCleanups.push(
      this.adapter.onSessionStateChanged((state) => {
        this.session.update(state);
        this.events.emitSessionState(state);
      }),
      this.adapter.onPitchDetected((event) => {
        this.events.emitPitch(event);
      }),
      this.adapter.onRhythmHitDetected((event) => {
        this.events.emitRhythmHit(event);
      }),
      this.adapter.onRouteChanged((devices) => {
        this.events.emitRouteChanged(devices);
      }),
      this.adapter.onError((error) => {
        this.events.emitError(error);
      }),
    );

    // Wire frame consumer passthrough if adapter supports it
    if (this.adapter.addFrameConsumer) {
      const adapterAddConsumer = this.adapter.addFrameConsumer.bind(this.adapter);
      this.addFrameConsumer = (consumer: AudioFrameConsumer) => {
        return adapterAddConsumer(consumer);
      };
    }
  }
}
