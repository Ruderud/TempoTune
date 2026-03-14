import { describe, it, expect, vi } from 'vitest';
import { AudioInputBridgeImpl } from './audio-input-bridge';
import type { AudioInputPlatformAdapter } from '../contracts/audio-input-platform-adapter.interface';
import type { AudioAnalyzerConfig, AudioFrameConsumer } from '../contracts/audio-frame.types';
import type {
  AudioSessionState,
  PitchDetectionEvent,
  RhythmHitEvent,
  AudioInputDevice,
  AudioCaptureConfig,
} from '@tempo-tune/shared/types';

/** Creates a fake adapter with controllable event emitters. */
function createFakeAdapter() {
  const callbacks = {
    sessionState: [] as ((state: AudioSessionState) => void)[],
    pitch: [] as ((event: PitchDetectionEvent) => void)[],
    rhythmHit: [] as ((event: RhythmHitEvent) => void)[],
    route: [] as ((devices: AudioInputDevice[]) => void)[],
    error: [] as ((error: Error) => void)[],
  };

  const adapter: AudioInputPlatformAdapter = {
    requestPermission: vi.fn().mockResolvedValue('granted'),
    getPermissionStatus: vi.fn().mockResolvedValue('granted'),
    listInputDevices: vi.fn().mockResolvedValue([]),
    getSelectedInputDevice: vi.fn().mockResolvedValue(null),
    selectInputDevice: vi.fn().mockResolvedValue(undefined),
    startCapture: vi.fn().mockResolvedValue(undefined),
    stopCapture: vi.fn().mockResolvedValue(undefined),
    setAnalyzerConfig: vi.fn().mockResolvedValue(undefined),
    onSessionStateChanged: vi.fn((cb) => {
      callbacks.sessionState.push(cb);
      return () => {
        callbacks.sessionState = callbacks.sessionState.filter((c) => c !== cb);
      };
    }),
    onPitchDetected: vi.fn((cb) => {
      callbacks.pitch.push(cb);
      return () => {
        callbacks.pitch = callbacks.pitch.filter((c) => c !== cb);
      };
    }),
    onRhythmHitDetected: vi.fn((cb) => {
      callbacks.rhythmHit.push(cb);
      return () => {
        callbacks.rhythmHit = callbacks.rhythmHit.filter((c) => c !== cb);
      };
    }),
    onRouteChanged: vi.fn((cb) => {
      callbacks.route.push(cb);
      return () => {
        callbacks.route = callbacks.route.filter((c) => c !== cb);
      };
    }),
    onError: vi.fn((cb) => {
      callbacks.error.push(cb);
      return () => {
        callbacks.error = callbacks.error.filter((c) => c !== cb);
      };
    }),
    dispose: vi.fn(),
  };

  const emit = {
    sessionState(state: AudioSessionState) {
      for (const cb of callbacks.sessionState) cb(state);
    },
    pitch(event: PitchDetectionEvent) {
      for (const cb of callbacks.pitch) cb(event);
    },
    rhythmHit(event: RhythmHitEvent) {
      for (const cb of callbacks.rhythmHit) cb(event);
    },
    route(devices: AudioInputDevice[]) {
      for (const cb of callbacks.route) cb(devices);
    },
    error(error: Error) {
      for (const cb of callbacks.error) cb(error);
    },
  };

  return { adapter, emit };
}

const defaultCaptureConfig: AudioCaptureConfig = {
  deviceId: 'mic-1',
  channelIndex: 0,
  enablePitch: true,
  enableRhythm: false,
};

const samplePitch: PitchDetectionEvent = {
  frequency: 440,
  confidence: 0.95,
  name: 'A',
  octave: 4,
  cents: 0,
  detectedAtMonotonicMs: 1000,
  debugSource: 'web',
};

const sampleRhythmHit: RhythmHitEvent = {
  detectedAtMonotonicMs: 1000,
  nearestBeatAtMonotonicMs: 1000,
  offsetMs: 0,
  status: 'on-time',
  confidence: 0.9,
  source: 'clap',
};

const sampleDevice: AudioInputDevice = {
  id: 'mic-1',
  label: 'Built-in Mic',
  transport: 'built-in',
  platformKind: 'default',
  channelCount: 1,
  sampleRates: [44100],
  isDefault: true,
  isAvailable: true,
};

describe('AudioInputBridgeImpl', () => {
  it('startCapture called twice does not create duplicate sessions', async () => {
    const { adapter, emit } = createFakeAdapter();
    const bridge = new AudioInputBridgeImpl(adapter);

    // First call should delegate to adapter
    const p1 = bridge.startCapture(defaultCaptureConfig);
    // Adapter emits running state
    emit.sessionState({ status: 'running', timestampSource: 'monotonic' });
    await p1;

    // Second call should be a no-op (session already running)
    await bridge.startCapture(defaultCaptureConfig);

    expect(adapter.startCapture).toHaveBeenCalledTimes(1);
    bridge.dispose();
  });

  it('startCapture called again while starting does not create duplicate sessions', async () => {
    const { adapter } = createFakeAdapter();
    let resolveStart!: () => void;
    adapter.startCapture = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveStart = () => resolve();
        }),
    );
    const bridge = new AudioInputBridgeImpl(adapter);

    const first = bridge.startCapture(defaultCaptureConfig);
    const second = bridge.startCapture(defaultCaptureConfig);

    expect(adapter.startCapture).toHaveBeenCalledTimes(1);

    resolveStart();
    await Promise.all([first, second]);
    bridge.dispose();
  });

  it('stopCapture delegates to adapter', async () => {
    const { adapter, emit } = createFakeAdapter();
    const bridge = new AudioInputBridgeImpl(adapter);

    await bridge.startCapture(defaultCaptureConfig);
    emit.sessionState({ status: 'running', timestampSource: 'monotonic' });

    await bridge.stopCapture();
    expect(adapter.stopCapture).toHaveBeenCalledTimes(1);
    bridge.dispose();
  });

  it('configureAnalyzers passes correct config to adapter setAnalyzerConfig', async () => {
    const { adapter } = createFakeAdapter();
    const bridge = new AudioInputBridgeImpl(adapter);

    const config: AudioAnalyzerConfig = { enablePitch: true, enableRhythm: false };
    await bridge.configureAnalyzers(config);

    expect(adapter.setAnalyzerConfig).toHaveBeenCalledWith(config);
    bridge.dispose();
  });

  it('onSessionStateChanged fan-out: subscribers receive adapter state', () => {
    const { adapter, emit } = createFakeAdapter();
    const bridge = new AudioInputBridgeImpl(adapter);
    const received: AudioSessionState[] = [];

    bridge.onSessionStateChanged((state) => received.push(state));

    const state: AudioSessionState = { status: 'running', timestampSource: 'monotonic' };
    emit.sessionState(state);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(state);
    bridge.dispose();
  });

  it('onPitchDetected fan-out: subscribers receive adapter pitch events', () => {
    const { adapter, emit } = createFakeAdapter();
    const bridge = new AudioInputBridgeImpl(adapter);
    const received: PitchDetectionEvent[] = [];

    bridge.onPitchDetected((event) => received.push(event));
    emit.pitch(samplePitch);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(samplePitch);
    bridge.dispose();
  });

  it('onRhythmHitDetected fan-out works', () => {
    const { adapter, emit } = createFakeAdapter();
    const bridge = new AudioInputBridgeImpl(adapter);
    const received: RhythmHitEvent[] = [];

    bridge.onRhythmHitDetected((event) => received.push(event));
    emit.rhythmHit(sampleRhythmHit);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(sampleRhythmHit);
    bridge.dispose();
  });

  it('onRouteChanged fan-out works', () => {
    const { adapter, emit } = createFakeAdapter();
    const bridge = new AudioInputBridgeImpl(adapter);
    const received: AudioInputDevice[][] = [];

    bridge.onRouteChanged((devices) => received.push(devices));
    emit.route([sampleDevice]);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual([sampleDevice]);
    bridge.dispose();
  });

  it('onError fan-out works', () => {
    const { adapter, emit } = createFakeAdapter();
    const bridge = new AudioInputBridgeImpl(adapter);
    const received: Error[] = [];

    bridge.onError((error) => received.push(error));
    const err = new Error('test error');
    emit.error(err);

    expect(received).toHaveLength(1);
    expect(received[0]).toBe(err);
    bridge.dispose();
  });

  it('selectInputDevice passes deviceId string to adapter', async () => {
    const { adapter } = createFakeAdapter();
    const bridge = new AudioInputBridgeImpl(adapter);

    await bridge.selectInputDevice('usb-mic-2');
    expect(adapter.selectInputDevice).toHaveBeenCalledWith('usb-mic-2');
    bridge.dispose();
  });

  it('dispose cleans up subscriptions (callbacks no longer fire)', () => {
    const { adapter, emit } = createFakeAdapter();
    const bridge = new AudioInputBridgeImpl(adapter);
    const received: PitchDetectionEvent[] = [];

    bridge.onPitchDetected((event) => received.push(event));
    bridge.dispose();

    emit.pitch(samplePitch);
    expect(received).toHaveLength(0);
  });

  it('addFrameConsumer passthrough works when adapter supports it', () => {
    const { adapter } = createFakeAdapter();
    const removeConsumer = vi.fn();
    adapter.addFrameConsumer = vi.fn().mockReturnValue(removeConsumer);

    const bridge = new AudioInputBridgeImpl(adapter);
    const consumer: AudioFrameConsumer = vi.fn();

    expect(bridge.addFrameConsumer).toBeDefined();
    const unsub = bridge.addFrameConsumer!(consumer);

    expect(adapter.addFrameConsumer).toHaveBeenCalledWith(consumer);
    expect(unsub).toBe(removeConsumer);
    bridge.dispose();
  });
});
