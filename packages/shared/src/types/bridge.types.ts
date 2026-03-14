export type BridgeMessageType =
  | 'REQUEST_MIC_PERMISSION'
  | 'MIC_PERMISSION_RESPONSE'
  /** @deprecated Use START_AUDIO_CAPTURE / STOP_AUDIO_CAPTURE instead */
  | 'START_LISTENING'
  /** @deprecated Use START_AUDIO_CAPTURE / STOP_AUDIO_CAPTURE instead */
  | 'STOP_LISTENING'
  | 'PITCH_DETECTED'
  | 'PLAY_CLICK'
  | 'VIBRATE'
  | 'ERROR'
  | 'START_NATIVE_METRONOME'
  | 'STOP_NATIVE_METRONOME'
  | 'SET_METRONOME_BPM'
  | 'SET_METRONOME_TIME_SIG'
  | 'NATIVE_METRONOME_TICK'
  | 'NATIVE_METRONOME_STATE'
  // Audio input infrastructure
  | 'LIST_AUDIO_INPUT_DEVICES'
  | 'AUDIO_INPUT_DEVICES_RESPONSE'
  | 'SELECT_AUDIO_INPUT_DEVICE'
  | 'GET_SELECTED_AUDIO_INPUT_DEVICE'
  | 'SELECTED_AUDIO_INPUT_DEVICE_RESPONSE'
  | 'START_AUDIO_CAPTURE'
  | 'STOP_AUDIO_CAPTURE'
  | 'AUDIO_INPUT_STATE_CHANGED'
  | 'AUDIO_INPUT_ROUTE_CHANGED'
  | 'RHYTHM_HIT_DETECTED'
  | 'CONFIGURE_AUDIO_ANALYZERS'
  | 'SET_QA_AUDIO_SAMPLE_SOURCE'
  | 'CLEAR_QA_AUDIO_SAMPLE_SOURCE';

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

/**
 * Explicit request → response type pairs for the bridge protocol.
 * Mobile sends a BridgeResponseEnvelope to the WebView; web listeners match on `type`.
 */
export type BridgeResponseEnvelope<T = unknown> = {
  type: BridgeMessageType;
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
};

/** Payload carried in the MIC_PERMISSION_RESPONSE envelope */
export type MicPermissionResponseData = {
  status: string;
};
