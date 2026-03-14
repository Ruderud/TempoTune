export type AudioInputTransport =
  | 'built-in'
  | 'usb'
  | 'wired'
  | 'bluetooth'
  | 'unknown';

export type AudioInputDevice = {
  id: string;
  label: string;
  transport: AudioInputTransport;
  platformKind: string;
  channelCount: number;
  sampleRates: number[];
  isDefault: boolean;
  isAvailable: boolean;
};

export type AudioCaptureConfig = {
  deviceId: string;
  channelIndex: number;
  preferredSampleRate?: number;
  bufferSize?: number;
  latencyOffsetMs?: number;
  enablePitch: boolean;
  enableRhythm: boolean;
};

export type AudioSessionStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error';

export type AudioSessionState = {
  status: AudioSessionStatus;
  deviceId?: string;
  sampleRate?: number;
  channelCount?: number;
  timestampSource: 'monotonic';
  startedAtMonotonicMs?: number;
  errorMessage?: string;
};

export type PitchDetectionEvent = {
  frequency: number;
  confidence: number;
  name: string;
  octave: number;
  cents: number;
  detectedAtMonotonicMs: number;
  debugSeq?: number;
  debugSource: 'web' | 'native';
};
