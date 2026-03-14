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
import { LiveInputAudioService } from '../audio/live-input-audio.service';
import { listWebInputDevices, onWebDeviceChange } from '../audio/web-audio-input.service';

/**
 * Web platform adapter for audio input.
 * Delegates capture to LiveInputAudioService and device enumeration
 * to web-audio-input.service helpers.
 */
export function createWebAudioInputAdapter(): AudioInputPlatformAdapter {
  const liveInput = new LiveInputAudioService();
  let selectedDeviceId: string | null = null;

  const errorCallbacks = new Set<(error: Error) => void>();
  const pitchCallbacks = new Set<(event: PitchDetectionEvent) => void>();
  const rhythmCallbacks = new Set<(event: RhythmHitEvent) => void>();

  function emitError(error: Error): void {
    for (const cb of errorCallbacks) {
      cb(error);
    }
  }

  const adapter: AudioInputPlatformAdapter = {
    async requestPermission(): Promise<AudioPermissionStatus> {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        return 'granted';
      } catch {
        return 'denied';
      }
    },

    async getPermissionStatus(): Promise<AudioPermissionStatus> {
      try {
        const result = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        if (result.state === 'granted') return 'granted';
        if (result.state === 'denied') return 'denied';
        return 'undetermined';
      } catch {
        // Permissions API not supported — fall back to undetermined
        return 'undetermined';
      }
    },

    async listInputDevices(): Promise<AudioInputDevice[]> {
      return listWebInputDevices();
    },

    async getSelectedInputDevice(): Promise<AudioInputDevice | null> {
      if (!selectedDeviceId) return null;
      const devices = await listWebInputDevices();
      return devices.find((d) => d.id === selectedDeviceId) ?? null;
    },

    async selectInputDevice(deviceId: string): Promise<void> {
      selectedDeviceId = deviceId;
    },

    async startCapture(config: AudioCaptureConfig): Promise<void> {
      try {
        const captureConfig: AudioCaptureConfig = {
          ...config,
          deviceId: selectedDeviceId ?? config.deviceId,
        };
        await liveInput.startCapture(captureConfig);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        emitError(error);
        throw error;
      }
    },

    async stopCapture(): Promise<void> {
      liveInput.stopCapture();
    },

    async setAnalyzerConfig(_config: AudioAnalyzerConfig): Promise<void> {
      // No-op: web analyzers are configured via frame consumers in hooks
    },

    addFrameConsumer(consumer: AudioFrameConsumer): () => void {
      return liveInput.addConsumer(consumer);
    },

    onSessionStateChanged(callback: (state: AudioSessionState) => void): () => void {
      return liveInput.onStateChanged(callback);
    },

    onPitchDetected(callback: (event: PitchDetectionEvent) => void): () => void {
      // Pitch events come from frame consumers in hooks, not from the adapter
      pitchCallbacks.add(callback);
      return () => {
        pitchCallbacks.delete(callback);
      };
    },

    onRhythmHitDetected(callback: (event: RhythmHitEvent) => void): () => void {
      // Rhythm events come from frame consumers in hooks, not from the adapter
      rhythmCallbacks.add(callback);
      return () => {
        rhythmCallbacks.delete(callback);
      };
    },

    onRouteChanged(callback: (devices: AudioInputDevice[]) => void): () => void {
      return onWebDeviceChange(callback);
    },

    onError(callback: (error: Error) => void): () => void {
      errorCallbacks.add(callback);
      return () => {
        errorCallbacks.delete(callback);
      };
    },

    dispose(): void {
      liveInput.dispose();
      errorCallbacks.clear();
      pitchCallbacks.clear();
      rhythmCallbacks.clear();
      selectedDeviceId = null;
    },
  };

  return adapter;
}
