import type {
  AudioInputPlatformAdapter,
  AudioAnalyzerConfig,
} from '@tempo-tune/audio-input';
import type {
  AudioInputDevice,
  AudioCaptureConfig,
  AudioSessionState,
  PitchDetectionEvent,
  RhythmHitEvent,
  AudioPermissionStatus,
} from '@tempo-tune/shared/types';
import {nativeAudioInputService} from '../native-audio-input.service';
import {
  requestMicPermission,
  getMicPermissionStatus,
} from '../permission.service';

export function createNativeAudioInputAdapter(): AudioInputPlatformAdapter {
  const unsubscribers: Array<() => void> = [];

  return {
    requestPermission(): Promise<AudioPermissionStatus> {
      return requestMicPermission();
    },

    getPermissionStatus(): Promise<AudioPermissionStatus> {
      return getMicPermissionStatus();
    },

    listInputDevices(): Promise<AudioInputDevice[]> {
      return nativeAudioInputService.listInputDevices();
    },

    getSelectedInputDevice(): Promise<AudioInputDevice | null> {
      return nativeAudioInputService.getSelectedInputDevice();
    },

    async selectInputDevice(deviceId: string): Promise<void> {
      nativeAudioInputService.selectInputDevice(deviceId);
    },

    async startCapture(config: AudioCaptureConfig): Promise<void> {
      nativeAudioInputService.startCapture(config);
    },

    async stopCapture(): Promise<void> {
      nativeAudioInputService.stopCapture();
    },

    async setAnalyzerConfig(_config: AudioAnalyzerConfig): Promise<void> {
      nativeAudioInputService.configureAnalyzers(_config);
    },

    // addFrameConsumer intentionally omitted — analysis happens natively

    onSessionStateChanged(
      callback: (state: AudioSessionState) => void,
    ): () => void {
      const unsub = nativeAudioInputService.onStateChanged(callback);
      unsubscribers.push(unsub);
      return unsub;
    },

    onPitchDetected(
      callback: (event: PitchDetectionEvent) => void,
    ): () => void {
      const unsub = nativeAudioInputService.onPitchDetected(callback);
      unsubscribers.push(unsub);
      return unsub;
    },

    onRhythmHitDetected(
      callback: (event: RhythmHitEvent) => void,
    ): () => void {
      const unsub = nativeAudioInputService.onRhythmDetected(callback);
      unsubscribers.push(unsub);
      return unsub;
    },

    onRouteChanged(
      callback: (devices: AudioInputDevice[]) => void,
    ): () => void {
      const unsub = nativeAudioInputService.onRouteChanged(callback);
      unsubscribers.push(unsub);
      return unsub;
    },

    onError(callback: (error: Error) => void): () => void {
      const unsub = nativeAudioInputService.onError((message: string) => {
        callback(new Error(message));
      });
      unsubscribers.push(unsub);
      return unsub;
    },

    dispose(): void {
      for (const unsub of unsubscribers) {
        unsub();
      }
      unsubscribers.length = 0;
    },
  };
}
