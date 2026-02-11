export type BridgeMessageType =
  | 'REQUEST_MIC_PERMISSION'
  | 'MIC_PERMISSION_RESPONSE'
  | 'START_LISTENING'
  | 'STOP_LISTENING'
  | 'PITCH_DETECTED'
  | 'PLAY_CLICK'
  | 'VIBRATE'
  | 'ERROR';

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
