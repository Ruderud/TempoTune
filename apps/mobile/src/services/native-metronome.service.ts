import {NativeModules, NativeEventEmitter} from 'react-native';

type MetronomeTickEvent = {
  beatIndex: number;
  isAccent: boolean;
  timestamp: number;
};

type MetronomeStateEvent = {
  isPlaying: boolean;
  bpm: number;
  beatsPerMeasure?: number;
};

class NativeMetronomeService {
  private emitter: NativeEventEmitter | null = null;
  private tickSubscription: ReturnType<NativeEventEmitter['addListener']> | null = null;
  private stateSubscription: ReturnType<NativeEventEmitter['addListener']> | null = null;
  private onTickCallback: ((data: MetronomeTickEvent) => void) | null = null;
  private onStateCallback: ((data: MetronomeStateEvent) => void) | null = null;
  private moduleAvailable: boolean;

  constructor() {
    try {
      const module = NativeModules.MetronomeModule;
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
    bpm: number,
    beatsPerMeasure: number,
    accentFirst: boolean,
    onTick: (data: MetronomeTickEvent) => void,
    onState: (data: MetronomeStateEvent) => void,
  ): void {
    if (!this.moduleAvailable || this.emitter == null) {
      return;
    }

    this.cleanup();

    this.onTickCallback = onTick;
    this.onStateCallback = onState;

    try {
      this.tickSubscription = this.emitter.addListener(
        'onMetronomeTick',
        (event: MetronomeTickEvent) => {
          this.onTickCallback?.(event);
        },
      );

      this.stateSubscription = this.emitter.addListener(
        'onMetronomeStateChanged',
        (event: MetronomeStateEvent) => {
          this.onStateCallback?.(event);
        },
      );

      NativeModules.MetronomeModule.start(bpm, beatsPerMeasure, accentFirst);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to start native metronome.';
      console.warn('[NativeMetronomeService]', message);
    }
  }

  stop(): void {
    if (!this.moduleAvailable) {
      return;
    }

    try {
      NativeModules.MetronomeModule.stop();
    } catch {
      // Module may have already been torn down; ignore.
    }

    this.cleanup();
  }

  setBpm(bpm: number): void {
    if (!this.moduleAvailable) {
      return;
    }
    try {
      NativeModules.MetronomeModule.setBpm(bpm);
    } catch {
      // ignore
    }
  }

  setTimeSignature(beatsPerMeasure: number): void {
    if (!this.moduleAvailable) {
      return;
    }
    try {
      NativeModules.MetronomeModule.setTimeSignature(beatsPerMeasure);
    } catch {
      // ignore
    }
  }

  private cleanup(): void {
    this.tickSubscription?.remove();
    this.stateSubscription?.remove();
    this.tickSubscription = null;
    this.stateSubscription = null;
    this.onTickCallback = null;
    this.onStateCallback = null;
  }
}

export const nativeMetronomeService = new NativeMetronomeService();
