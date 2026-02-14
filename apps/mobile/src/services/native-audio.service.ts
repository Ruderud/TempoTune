import {NativeModules, NativeEventEmitter} from 'react-native';

const {PitchDetectorModule} = NativeModules;

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
  private emitter: NativeEventEmitter;
  private pitchSubscription: ReturnType<NativeEventEmitter['addListener']> | null = null;
  private errorSubscription: ReturnType<NativeEventEmitter['addListener']> | null = null;
  private onPitchCallback: ((data: PitchEvent) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.emitter = new NativeEventEmitter(PitchDetectorModule);
  }

  start(
    onPitch: (data: PitchEvent) => void,
    onError?: (error: string) => void,
  ): void {
    this.onPitchCallback = onPitch;
    this.onErrorCallback = onError ?? null;

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

    PitchDetectorModule.startListening();
  }

  stop(): void {
    PitchDetectorModule.stopListening();
    this.pitchSubscription?.remove();
    this.errorSubscription?.remove();
    this.pitchSubscription = null;
    this.errorSubscription = null;
    this.onPitchCallback = null;
    this.onErrorCallback = null;
  }
}

export const nativeAudioService = new NativeAudioService();
