import type { AudioPermissionStatus } from '../types';

export type AudioBridgeEventType =
  | 'permissionChanged'
  | 'pitchDetected'
  | 'listeningStarted'
  | 'listeningStopped'
  | 'error'
  // Audio input infrastructure events
  | 'sessionStateChanged'
  | 'rhythmHitDetected'
  | 'routeChanged';

export type AudioBridgeRequest = {
  action:
    | 'requestPermission'
    | 'startListening'
    | 'stopListening'
    | 'getPermissionStatus'
    // Audio input infrastructure actions
    | 'listInputDevices'
    | 'getSelectedInputDevice'
    | 'selectInputDevice'
    | 'startCapture'
    | 'stopCapture'
    | 'configureAnalyzers';
};

export type AudioBridgeResponse = {
  permissionStatus?: AudioPermissionStatus;
  frequency?: number;
  error?: string;
};
