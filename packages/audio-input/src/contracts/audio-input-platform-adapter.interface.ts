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
 * Platform-specific adapter contract.
 * Each platform (web, iOS, Android) implements this interface.
 * The facade delegates all platform operations through this adapter.
 */
export type AudioInputPlatformAdapter = {
  requestPermission(): Promise<AudioPermissionStatus>;
  getPermissionStatus(): Promise<AudioPermissionStatus>;
  listInputDevices(): Promise<AudioInputDevice[]>;
  getSelectedInputDevice(): Promise<AudioInputDevice | null>;
  selectInputDevice(deviceId: string): Promise<void>;
  startCapture(config: AudioCaptureConfig): Promise<void>;
  stopCapture(): Promise<void>;
  setAnalyzerConfig(config: AudioAnalyzerConfig): Promise<void>;
  addFrameConsumer?(consumer: AudioFrameConsumer): () => void;
  onSessionStateChanged(callback: (state: AudioSessionState) => void): () => void;
  onPitchDetected(callback: (event: PitchDetectionEvent) => void): () => void;
  onRhythmHitDetected(callback: (event: RhythmHitEvent) => void): () => void;
  onRouteChanged(callback: (devices: AudioInputDevice[]) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  dispose(): void;
};
