import type {
  AudioPermissionStatus,
  AudioInputDevice,
  AudioCaptureConfig,
  AudioSessionState,
  PitchDetectionEvent,
  RhythmHitEvent,
} from '@tempo-tune/shared/types';
import type { AudioFrameConsumer, AudioAnalyzerConfig } from './audio-frame.types';

/**
 * Public facade API for audio input.
 * Apps interact with audio input exclusively through this interface.
 * Hooks should never call platform APIs directly.
 */
export type AudioInputBridge = {
  requestPermission(): Promise<AudioPermissionStatus>;
  getPermissionStatus(): Promise<AudioPermissionStatus>;
  listInputDevices(): Promise<AudioInputDevice[]>;
  getSelectedInputDevice(): Promise<AudioInputDevice | null>;
  selectInputDevice(deviceId: string): Promise<void>;
  startCapture(config: AudioCaptureConfig): Promise<void>;
  stopCapture(): Promise<void>;
  configureAnalyzers(config: AudioAnalyzerConfig): Promise<void>;
  addFrameConsumer?(consumer: AudioFrameConsumer): () => void;
  onSessionStateChanged(callback: (state: AudioSessionState) => void): () => void;
  onPitchDetected(callback: (event: PitchDetectionEvent) => void): () => void;
  onRhythmHitDetected(callback: (event: RhythmHitEvent) => void): () => void;
  onRouteChanged(callback: (devices: AudioInputDevice[]) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  dispose(): void;
};
