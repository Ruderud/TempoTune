import type {
  AudioInputPlatformAdapter,
  AudioFrameConsumer,
  AudioAnalyzerConfig,
} from '@tempo-tune/audio-input';
import type {
  AudioPermissionStatus,
  AudioInputDevice,
  AudioCaptureConfig,
  AudioSessionState,
  PitchDetectionEvent,
  RhythmHitEvent,
} from '@tempo-tune/shared/types';
import { postMessageToNative, addNativeMessageListener } from '../bridge/bridge-adapter';

/**
 * Web-side adapter for native bridge communication.
 * Used when the web app runs inside a React Native WebView.
 * Sends commands via postMessage and receives events via native message listener.
 */
export function createNativeBridgeAudioInputAdapter(): AudioInputPlatformAdapter {
  const sessionStateCallbacks = new Set<(state: AudioSessionState) => void>();
  const pitchCallbacks = new Set<(event: PitchDetectionEvent) => void>();
  const rhythmCallbacks = new Set<(event: RhythmHitEvent) => void>();
  const routeCallbacks = new Set<(devices: AudioInputDevice[]) => void>();
  const errorCallbacks = new Set<(error: Error) => void>();

  // Listen for native events
  const removeListener = addNativeMessageListener((data) => {
    const msg = data as { type: string; data?: unknown; error?: string };

    if (msg.type === 'AUDIO_INPUT_STATE_CHANGED' && msg.data) {
      for (const cb of sessionStateCallbacks) cb(msg.data as AudioSessionState);
    }
    if (msg.type === 'PITCH_DETECTED' && msg.data) {
      for (const cb of pitchCallbacks) cb(msg.data as PitchDetectionEvent);
    }
    if (msg.type === 'RHYTHM_HIT_DETECTED' && msg.data) {
      for (const cb of rhythmCallbacks) cb(msg.data as RhythmHitEvent);
    }
    if (msg.type === 'AUDIO_INPUT_ROUTE_CHANGED' && msg.data) {
      const payload = msg.data as { devices: AudioInputDevice[] };
      for (const cb of routeCallbacks) cb(payload.devices);
    }
    if (msg.type === 'ERROR' && msg.error) {
      for (const cb of errorCallbacks) cb(new Error(msg.error));
    }
  });

  const adapter: AudioInputPlatformAdapter = {
    async requestPermission(): Promise<AudioPermissionStatus> {
      return new Promise((resolve, reject) => {
        postMessageToNative({ type: 'REQUEST_MIC_PERMISSION' });
        const cleanup = addNativeMessageListener((data) => {
          const msg = data as { type: string; success: boolean; data?: { status: AudioPermissionStatus }; error?: string };
          if (msg.type === 'MIC_PERMISSION_RESPONSE') {
            cleanup();
            if (!msg.success) {
              reject(new Error(msg.error ?? 'Permission request failed'));
            } else {
              resolve(msg.data?.status ?? 'denied');
            }
          }
        });
      });
    },

    async getPermissionStatus(): Promise<AudioPermissionStatus> {
      return 'undetermined';
    },

    async listInputDevices(): Promise<AudioInputDevice[]> {
      return new Promise((resolve) => {
        postMessageToNative({ type: 'LIST_AUDIO_INPUT_DEVICES' });
        const cleanup = addNativeMessageListener((data) => {
          const msg = data as { type: string; data?: { devices: AudioInputDevice[] } };
          if (msg.type === 'AUDIO_INPUT_DEVICES_RESPONSE') {
            cleanup();
            resolve(msg.data?.devices ?? []);
          }
        });
      });
    },

    async getSelectedInputDevice(): Promise<AudioInputDevice | null> {
      return new Promise((resolve) => {
        postMessageToNative({ type: 'GET_SELECTED_AUDIO_INPUT_DEVICE' });
        const cleanup = addNativeMessageListener((data) => {
          const msg = data as { type: string; data?: { device: AudioInputDevice | null } };
          if (msg.type === 'SELECTED_AUDIO_INPUT_DEVICE_RESPONSE') {
            cleanup();
            resolve(msg.data?.device ?? null);
          }
        });
      });
    },

    async selectInputDevice(deviceId: string): Promise<void> {
      postMessageToNative({ type: 'SELECT_AUDIO_INPUT_DEVICE', data: { deviceId } });
    },

    async startCapture(config: AudioCaptureConfig): Promise<void> {
      postMessageToNative({ type: 'START_AUDIO_CAPTURE', data: config });
    },

    async stopCapture(): Promise<void> {
      postMessageToNative({ type: 'STOP_AUDIO_CAPTURE' });
    },

    async setAnalyzerConfig(config: AudioAnalyzerConfig): Promise<void> {
      postMessageToNative({ type: 'CONFIGURE_AUDIO_ANALYZERS', data: config });
    },

    // No frame consumer — analysis happens natively

    onSessionStateChanged(callback: (state: AudioSessionState) => void): () => void {
      sessionStateCallbacks.add(callback);
      return () => { sessionStateCallbacks.delete(callback); };
    },

    onPitchDetected(callback: (event: PitchDetectionEvent) => void): () => void {
      pitchCallbacks.add(callback);
      return () => { pitchCallbacks.delete(callback); };
    },

    onRhythmHitDetected(callback: (event: RhythmHitEvent) => void): () => void {
      rhythmCallbacks.add(callback);
      return () => { rhythmCallbacks.delete(callback); };
    },

    onRouteChanged(callback: (devices: AudioInputDevice[]) => void): () => void {
      routeCallbacks.add(callback);
      return () => { routeCallbacks.delete(callback); };
    },

    onError(callback: (error: Error) => void): () => void {
      errorCallbacks.add(callback);
      return () => { errorCallbacks.delete(callback); };
    },

    dispose(): void {
      removeListener();
      sessionStateCallbacks.clear();
      pitchCallbacks.clear();
      rhythmCallbacks.clear();
      routeCallbacks.clear();
      errorCallbacks.clear();
    },
  };

  return adapter;
}
