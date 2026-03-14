import {NativeModules, NativeEventEmitter} from 'react-native';
import type {
  AudioInputDevice,
  AudioSessionState,
  PitchDetectionEvent,
  AudioCaptureConfig,
  RhythmHitEvent,
} from '@tempo-tune/shared/types';

type DevicesResponseEvent = {
  devices: AudioInputDevice[];
};

type SelectedDeviceResponseEvent = {
  device: AudioInputDevice | null;
};

class NativeAudioInputService {
  private emitter: NativeEventEmitter | null = null;
  private moduleAvailable: boolean;

  constructor() {
    try {
      const module = NativeModules.AudioInputModule;
      if (module == null) {
        this.moduleAvailable = false;
      } else {
        this.emitter = new NativeEventEmitter(module);
        this.moduleAvailable = true;
      }
    } catch {
      this.moduleAvailable = false;
    }
  }

  listInputDevices(): Promise<AudioInputDevice[]> {
    if (!this.moduleAvailable) return Promise.resolve([]);

    return new Promise(resolve => {
      const sub = this.emitter!.addListener(
        'onAudioInputDevicesResponse',
        (event: DevicesResponseEvent) => {
          sub.remove();
          resolve(event.devices ?? []);
        },
      );
      NativeModules.AudioInputModule.listInputDevices();
    });
  }

  getSelectedInputDevice(): Promise<AudioInputDevice | null> {
    if (!this.moduleAvailable) return Promise.resolve(null);

    return new Promise(resolve => {
      const sub = this.emitter!.addListener(
        'onSelectedAudioInputDeviceResponse',
        (event: SelectedDeviceResponseEvent) => {
          sub.remove();
          resolve(event.device ?? null);
        },
      );
      NativeModules.AudioInputModule.getSelectedInputDevice();
    });
  }

  selectInputDevice(deviceId: string): void {
    if (!this.moduleAvailable) return;
    NativeModules.AudioInputModule.selectInputDevice(deviceId);
  }

  startCapture(config: AudioCaptureConfig): void {
    if (!this.moduleAvailable) return;
    NativeModules.AudioInputModule.startCapture(config);
  }

  configureAnalyzers(config: {enablePitch: boolean; enableRhythm: boolean}): void {
    if (!this.moduleAvailable) return;
    NativeModules.AudioInputModule.configureAnalyzers(config);
  }

  setQaSampleSource(config: {url: string; loop?: boolean}): void {
    if (!this.moduleAvailable) return;
    NativeModules.AudioInputModule.setQaSampleSource(config);
  }

  clearQaSampleSource(): void {
    if (!this.moduleAvailable) return;
    NativeModules.AudioInputModule.clearQaSampleSource();
  }

  stopCapture(): void {
    if (!this.moduleAvailable) return;
    NativeModules.AudioInputModule.stopCapture();
  }

  onStateChanged(
    callback: (state: AudioSessionState) => void,
  ): () => void {
    if (!this.emitter) return () => {};
    const sub = this.emitter.addListener(
      'onAudioInputStateChanged',
      callback,
    );
    return () => sub.remove();
  }

  onPitchDetected(
    callback: (event: PitchDetectionEvent) => void,
  ): () => void {
    if (!this.emitter) return () => {};
    const sub = this.emitter.addListener('onPitchDetected', callback);
    return () => sub.remove();
  }

  onRouteChanged(
    callback: (devices: AudioInputDevice[]) => void,
  ): () => void {
    if (!this.emitter) return () => {};
    const sub = this.emitter.addListener(
      'onAudioInputRouteChanged',
      (event: DevicesResponseEvent) => {
        callback(event.devices ?? []);
      },
    );
    return () => sub.remove();
  }

  onRhythmDetected(
    callback: (event: RhythmHitEvent) => void,
  ): () => void {
    if (!this.emitter) return () => {};
    const sub = this.emitter.addListener('onRhythmHitDetected', callback);
    return () => sub.remove();
  }

  onError(callback: (error: string) => void): () => void {
    if (!this.emitter) return () => {};
    const sub = this.emitter.addListener(
      'onAudioInputError',
      (event: {message: string}) => {
        callback(event.message);
      },
    );
    return () => sub.remove();
  }
}

export const nativeAudioInputService = new NativeAudioInputService();
