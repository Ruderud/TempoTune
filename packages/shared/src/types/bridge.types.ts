import type { AudioPermissionStatus } from './audio.types';
import type {
  AudioCaptureConfig,
  AudioInputDevice,
  AudioSessionState,
  PitchDetectionEvent,
} from './audio-input.types';
import type { RhythmHitEvent } from './rhythm.types';

export type NativeMetronomeTickData = {
  beatIndex: number;
  isAccent: boolean;
  timestamp: number;
};

export type NativeMetronomeStateData = {
  isPlaying: boolean;
  bpm: number;
  beatsPerMeasure?: number;
};

export type StartNativeMetronomeData = {
  bpm: number;
  beatsPerMeasure: number;
  accentFirst: boolean;
};

export type BridgeAnalyzerConfig = {
  enablePitch: boolean;
  enableRhythm: boolean;
};

export type QaAudioSampleSource = {
  url: string;
  loop?: boolean;
};

/** Legacy tuner payload, whose timestamps use wall-clock milliseconds. */
export type TunerPitchBridgeData = {
  frequency: number;
  name: string;
  octave: number;
  cents: number;
  confidence?: number;
  detectedAtMs?: number;
  bridgeSentAtMs?: number;
  webReceivedAtMs?: number;
  debugSource?: 'native' | 'web';
  debugSeq?: number;
};

export type BridgeCommandPayloadMap = {
  REQUEST_MIC_PERMISSION: undefined;
  /** @deprecated Use START_AUDIO_CAPTURE / STOP_AUDIO_CAPTURE instead. */
  START_LISTENING: undefined;
  /** @deprecated Use START_AUDIO_CAPTURE / STOP_AUDIO_CAPTURE instead. */
  STOP_LISTENING: undefined;
  PLAY_CLICK: { isAccent: boolean };
  VIBRATE: { duration?: number };
  START_NATIVE_METRONOME: StartNativeMetronomeData;
  STOP_NATIVE_METRONOME: undefined;
  SET_METRONOME_BPM: { bpm: number };
  SET_METRONOME_TIME_SIG: { beatsPerMeasure: number };
  LIST_AUDIO_INPUT_DEVICES: undefined;
  SELECT_AUDIO_INPUT_DEVICE: { deviceId: string };
  GET_SELECTED_AUDIO_INPUT_DEVICE: undefined;
  START_AUDIO_CAPTURE: AudioCaptureConfig;
  STOP_AUDIO_CAPTURE: undefined;
  CONFIGURE_AUDIO_ANALYZERS: BridgeAnalyzerConfig;
  SET_QA_AUDIO_SAMPLE_SOURCE: QaAudioSampleSource;
  CLEAR_QA_AUDIO_SAMPLE_SOURCE: undefined;
};

export type BridgeEventPayloadMap = {
  MIC_PERMISSION_RESPONSE: MicPermissionResponseData;
  PITCH_DETECTED: PitchDetectionEvent | TunerPitchBridgeData;
  NATIVE_METRONOME_TICK: NativeMetronomeTickData;
  NATIVE_METRONOME_STATE: NativeMetronomeStateData;
  AUDIO_INPUT_DEVICES_RESPONSE: { devices: AudioInputDevice[] };
  SELECTED_AUDIO_INPUT_DEVICE_RESPONSE: { device: AudioInputDevice | null };
  AUDIO_INPUT_STATE_CHANGED: AudioSessionState;
  AUDIO_INPUT_ROUTE_CHANGED: { devices: AudioInputDevice[] };
  RHYTHM_HIT_DETECTED: RhythmHitEvent;
};

export type BridgeCommandType = keyof BridgeCommandPayloadMap;
export type BridgeEventType = keyof BridgeEventPayloadMap;
export type BridgeMessageType = BridgeCommandType | BridgeEventType | 'ERROR';

type MessageFor<K extends string, P> = P extends undefined
  ? { type: K; data?: never; requestId?: string }
  : { type: K; data: P; requestId?: string };

export type BridgeCommand<K extends BridgeCommandType = BridgeCommandType> =
  K extends BridgeCommandType
    ? MessageFor<K, BridgeCommandPayloadMap[K]>
    : never;

export type BridgeEvent<K extends BridgeEventType = BridgeEventType> =
  K extends BridgeEventType ? MessageFor<K, BridgeEventPayloadMap[K]> : never;

export type BridgeCommandPayload<K extends BridgeCommandType> =
  BridgeCommandPayloadMap[K];

export type BridgeErrorMessage = {
  type: 'ERROR';
  error: string;
  requestId?: string;
};

/**
 * Backward-compatible generic envelope for code that consumes untrusted bridge input.
 * Producers should use BridgeCommand or BridgeEvent so type and payload stay coupled.
 */
export type BridgeMessage<T = unknown> = {
  type: BridgeMessageType;
  data?: T;
  requestId?: string;
};

export type BridgeResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
};

/** Mobile response envelope; web listeners match on type and requestId. */
export type BridgeResponseEnvelope<T = unknown> = {
  type: BridgeMessageType;
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
};

export type BridgeNativeToWebMessage =
  BridgeEvent | BridgeErrorMessage | BridgeResponseEnvelope;

export type MicPermissionResponseData = {
  status: AudioPermissionStatus;
};
