import type { AudioPermissionStatus } from '../types';
import type { TunerNote } from '../types';

export type AudioBridgeInterface = {
  requestPermission(): Promise<AudioPermissionStatus>;
  getPermissionStatus(): Promise<AudioPermissionStatus>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  onPitchDetected(callback: (note: TunerNote) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  dispose(): void;
};
