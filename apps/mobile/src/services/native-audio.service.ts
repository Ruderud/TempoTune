import {NativeModules, NativeEventEmitter} from 'react-native';

type PitchEvent = {
  frequency: number;
  probability: number;
  confidence?: number;
  name: string;
  octave: number;
  cents: number;
  detectedAtMs?: number;
  bridgeSentAtMs?: number;
  webReceivedAtMs?: number;
  debugSource?: 'native' | 'web';
  debugSeq?: number;
};

type PitchErrorEvent = {
  message: string;
};

class NativeAudioService {
  private emitter: NativeEventEmitter | null = null;
  private pitchSubscription: ReturnType<NativeEventEmitter['addListener']> | null = null;
  private errorSubscription: ReturnType<NativeEventEmitter['addListener']> | null = null;
  private onPitchCallback: ((data: PitchEvent) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private moduleAvailable: boolean;
  private isListening: boolean = false;

  constructor() {
    try {
      const module = NativeModules.PitchDetectorModule;
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

  start(
    onPitch: (data: PitchEvent) => void,
    onError?: (error: string) => void,
  ): void {
    this.onPitchCallback = onPitch;
    this.onErrorCallback = onError ?? null;

    if (!this.moduleAvailable || this.emitter == null) {
      this.onErrorCallback?.(
        'PitchDetectorModule is not available on this device.',
      );
      return;
    }

    if (this.isListening) {
      this.pitchSubscription?.remove();
      this.errorSubscription?.remove();
      this.pitchSubscription = null;
      this.errorSubscription = null;
      this.isListening = false;
    }

    try {
      this.pitchSubscription = this.emitter.addListener(
        'onPitchDetected',
        (event: PitchEvent) => {
          this.onPitchCallback?.(event);
        },
      );

      this.errorSubscription = this.emitter.addListener(
        'onPitchError',
        (event: PitchErrorEvent) => {
          this.onErrorCallback?.(event.message);
        },
      );

      NativeModules.PitchDetectorModule.startListening();
      this.isListening = true;
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to start pitch detection.';
      this.onErrorCallback?.(message);
    }
  }

  stop(): void {
    if (!this.moduleAvailable) {
      return;
    }

    try {
      NativeModules.PitchDetectorModule.stopListening();
    } catch {
      // Module may have already been torn down; ignore.
    }

    this.pitchSubscription?.remove();
    this.errorSubscription?.remove();
    this.pitchSubscription = null;
    this.errorSubscription = null;
    this.onPitchCallback = null;
    this.onErrorCallback = null;
    this.isListening = false;
  }
}

export const nativeAudioService = new NativeAudioService();
