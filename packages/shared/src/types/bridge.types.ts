export type BridgeMessageType =
  | 'REQUEST_MIC_PERMISSION'
  | 'MIC_PERMISSION_RESPONSE'
  | 'START_LISTENING'
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
  | 'NATIVE_METRONOME_STATE';

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
