export type AudioPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'error';

export type AudioContextState = 'running' | 'suspended' | 'closed';

export type AudioConfig = {
  sampleRate: number;
  fftSize: number;
  bufferSize: number;
};
