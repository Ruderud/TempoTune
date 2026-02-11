import type { AudioPermissionStatus } from '../types';

export type AudioBridgeEventType =
  | 'permissionChanged'
  | 'pitchDetected'
  | 'listeningStarted'
  | 'listeningStopped'
  | 'error';

export type AudioBridgeRequest = {
  action: 'requestPermission' | 'startListening' | 'stopListening' | 'getPermissionStatus';
};

export type AudioBridgeResponse = {
  permissionStatus?: AudioPermissionStatus;
  frequency?: number;
  error?: string;
};
