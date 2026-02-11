import type { AudioBridgeInterface } from '@tempo-tune/shared/bridge';
import type { AudioPermissionStatus, TunerNote } from '@tempo-tune/shared/types';
import { isNativeEnvironment, postMessageToNative, addNativeMessageListener } from './bridge-adapter';

export class AudioBridgeClient implements AudioBridgeInterface {
  private pitchCallbacks: Set<(note: TunerNote) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();
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

    return new Promise((resolve) => {
      postMessageToNative({ type: 'REQUEST_MIC_PERMISSION' });
      const cleanup = addNativeMessageListener((data) => {
        const msg = data as { type: string; status: AudioPermissionStatus };
        if (msg.type === 'MIC_PERMISSION_RESPONSE') {
          cleanup();
          resolve(msg.status);
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

  async startListening(): Promise<void> {
    if (isNativeEnvironment()) {
      postMessageToNative({ type: 'START_LISTENING' });
    }
  }

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

  dispose(): void {
    if (this.removeListener) {
      this.removeListener();
      this.removeListener = null;
    }
    this.pitchCallbacks.clear();
    this.errorCallbacks.clear();
  }

  private handleNativeMessage(data: unknown): void {
    const msg = data as { type: string; data?: unknown; error?: string };
    if (msg.type === 'PITCH_DETECTED' && msg.data) {
      for (const cb of this.pitchCallbacks) {
        cb(msg.data as TunerNote);
      }
    }
    if (msg.type === 'ERROR' && msg.error) {
      for (const cb of this.errorCallbacks) {
        cb(new Error(msg.error));
      }
    }
  }
}
