import type { AudioBridgeInterface } from '@tempo-tune/shared/bridge';
import type { AudioPermissionStatus, TunerNote, AudioInputDevice, AudioCaptureConfig, AudioSessionState, RhythmHitEvent } from '@tempo-tune/shared/types';
import { isNativeEnvironment, postMessageToNative, addNativeMessageListener } from './bridge-adapter';
import { isLatencyDebugEnabled } from '../../utils/latency-debug';

/**
 * @deprecated Use `getAudioInputBridge()` from `../audio-input` instead.
 * This class is kept only for backward compatibility during migration.
 * All web local logic has been moved to WebAudioInputAdapter / NativeBridgeAudioInputAdapter.
 */
export class AudioBridgeClient implements AudioBridgeInterface {
  private pitchCallbacks: Set<(note: TunerNote) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();
  private sessionStateCallbacks: Set<(state: AudioSessionState) => void> = new Set();
  private rhythmHitCallbacks: Set<(event: RhythmHitEvent) => void> = new Set();
  private routeChangedCallbacks: Set<(devices: AudioInputDevice[]) => void> = new Set();
  private removeListener: (() => void) | null = null;

  constructor() {
    if (isNativeEnvironment()) {
      this.removeListener = addNativeMessageListener((data) => this.handleNativeMessage(data));
    }
  }

  async requestPermission(): Promise<AudioPermissionStatus> {
    if (!isNativeEnvironment()) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return 'granted';
      } catch {
        return 'denied';
      }
    }

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
  }

  async getPermissionStatus(): Promise<AudioPermissionStatus> {
    if (!isNativeEnvironment()) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (result.state === 'granted') return 'granted';
        if (result.state === 'denied') return 'denied';
        return 'undetermined';
      } catch {
        return 'undetermined';
      }
    }
    return 'undetermined';
  }

  /** @deprecated Use facade startCapture() instead */
  async startListening(): Promise<void> {
    if (isNativeEnvironment()) {
      postMessageToNative({ type: 'START_LISTENING' });
    }
  }

  /** @deprecated Use facade stopCapture() instead */
  async stopListening(): Promise<void> {
    if (isNativeEnvironment()) {
      postMessageToNative({ type: 'STOP_LISTENING' });
    }
  }

  onPitchDetected(callback: (note: TunerNote) => void): () => void {
    this.pitchCallbacks.add(callback);
    return () => { this.pitchCallbacks.delete(callback); };
  }

  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => { this.errorCallbacks.delete(callback); };
  }

  /** @deprecated Use facade listInputDevices() instead */
  async listInputDevices(): Promise<AudioInputDevice[]> {
    if (!isNativeEnvironment()) return [];
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
  }

  /** @deprecated Use facade getSelectedInputDevice() instead */
  async getSelectedInputDevice(): Promise<AudioInputDevice | null> {
    if (!isNativeEnvironment()) return null;
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
  }

  /** @deprecated Use facade selectInputDevice() instead */
  async selectInputDevice(deviceId: string): Promise<void> {
    if (isNativeEnvironment()) {
      postMessageToNative({ type: 'SELECT_AUDIO_INPUT_DEVICE', data: { deviceId } });
    }
  }

  /** @deprecated Use facade startCapture() instead */
  async startCapture(config: AudioCaptureConfig): Promise<void> {
    if (isNativeEnvironment()) {
      postMessageToNative({ type: 'START_AUDIO_CAPTURE', data: config });
    }
  }

  /** @deprecated Use facade stopCapture() instead */
  async stopCapture(): Promise<void> {
    if (isNativeEnvironment()) {
      postMessageToNative({ type: 'STOP_AUDIO_CAPTURE' });
    }
  }

  onSessionStateChanged(callback: (state: AudioSessionState) => void): () => void {
    this.sessionStateCallbacks.add(callback);
    return () => { this.sessionStateCallbacks.delete(callback); };
  }

  onRhythmHitDetected(callback: (event: RhythmHitEvent) => void): () => void {
    this.rhythmHitCallbacks.add(callback);
    return () => { this.rhythmHitCallbacks.delete(callback); };
  }

  onRouteChanged(callback: (devices: AudioInputDevice[]) => void): () => void {
    this.routeChangedCallbacks.add(callback);
    return () => { this.routeChangedCallbacks.delete(callback); };
  }

  dispose(): void {
    if (this.removeListener) {
      this.removeListener();
      this.removeListener = null;
    }
    this.pitchCallbacks.clear();
    this.errorCallbacks.clear();
    this.sessionStateCallbacks.clear();
    this.rhythmHitCallbacks.clear();
    this.routeChangedCallbacks.clear();
  }

  private handleNativeMessage(data: unknown): void {
    const msg = data as { type: string; data?: unknown; error?: string };
    if (msg.type === 'PITCH_DETECTED' && msg.data) {
      const receivedAtMs = Date.now();
      const note = {
        ...(msg.data as TunerNote),
        webReceivedAtMs: receivedAtMs,
      } satisfies TunerNote;

      if (isLatencyDebugEnabled()) {
        const nativeToBridgeMs =
          typeof note.detectedAtMs === 'number' ? receivedAtMs - note.detectedAtMs : null;
        const bridgeToWebMs =
          typeof note.bridgeSentAtMs === 'number' ? receivedAtMs - note.bridgeSentAtMs : null;
        console.info(
          `[tuner-latency:bridge->web] native->web=${nativeToBridgeMs ?? '-'}ms bridge->web=${bridgeToWebMs ?? '-'}ms seq=${note.debugSeq ?? '-'} note=${note.name}${note.octave}`,
        );
      }

      for (const cb of this.pitchCallbacks) {
        cb(note);
      }
    }
    if (msg.type === 'AUDIO_INPUT_STATE_CHANGED' && msg.data) {
      for (const cb of this.sessionStateCallbacks) {
        cb(msg.data as AudioSessionState);
      }
    }
    if (msg.type === 'RHYTHM_HIT_DETECTED' && msg.data) {
      for (const cb of this.rhythmHitCallbacks) {
        cb(msg.data as RhythmHitEvent);
      }
    }
    if (msg.type === 'AUDIO_INPUT_ROUTE_CHANGED' && msg.data) {
      const payload = msg.data as { devices: AudioInputDevice[] };
      for (const cb of this.routeChangedCallbacks) {
        cb(payload.devices);
      }
    }
    if (msg.type === 'ERROR' && msg.error) {
      for (const cb of this.errorCallbacks) {
        cb(new Error(msg.error));
      }
    }
  }
}
