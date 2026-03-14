import type { AudioPermissionStatus } from '../types';
import type { TunerNote } from '../types';
import type { AudioInputDevice, AudioCaptureConfig, AudioSessionState } from '../types/audio-input.types';
import type { RhythmHitEvent } from '../types/rhythm.types';

export type AudioBridgeInterface = {
  // --- Permission (unchanged) ---
  requestPermission(): Promise<AudioPermissionStatus>;
  getPermissionStatus(): Promise<AudioPermissionStatus>;

  // --- Legacy (deprecated — thin compat layer over new capture API) ---
  /** @deprecated Use startCapture / stopCapture instead */
  startListening(): Promise<void>;
  /** @deprecated Use startCapture / stopCapture instead */
  stopListening(): Promise<void>;

  // --- Input device management ---
  listInputDevices(): Promise<AudioInputDevice[]>;
  getSelectedInputDevice(): Promise<AudioInputDevice | null>;
  selectInputDevice(deviceId: string): Promise<void>;

  // --- Capture session ---
  startCapture(config: AudioCaptureConfig): Promise<void>;
  stopCapture(): Promise<void>;

  // --- Event subscriptions ---
  onSessionStateChanged(callback: (state: AudioSessionState) => void): () => void;
  onPitchDetected(callback: (note: TunerNote) => void): () => void;
  onRhythmHitDetected(callback: (event: RhythmHitEvent) => void): () => void;
  onRouteChanged(callback: (devices: AudioInputDevice[]) => void): () => void;
  onError(callback: (error: Error) => void): () => void;

  dispose(): void;
};
