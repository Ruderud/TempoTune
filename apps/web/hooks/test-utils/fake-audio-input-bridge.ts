import { vi } from 'vitest';
import type { AudioInputBridge, AudioFrameConsumer } from '@tempo-tune/audio-input';
import type {
  AudioCaptureConfig,
  AudioInputDevice,
  AudioPermissionStatus,
  AudioSessionState,
  PitchDetectionEvent,
  RhythmHitEvent,
} from '@tempo-tune/shared/types';

type ListenerSet<T> = Set<(payload: T) => void>;

function addListener<T>(listeners: ListenerSet<T>, callback: (payload: T) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function createFakeAudioInputBridge(options?: {
  withFrameConsumer?: boolean;
}) {
  const sessionStateListeners: ListenerSet<AudioSessionState> = new Set();
  const pitchListeners: ListenerSet<PitchDetectionEvent> = new Set();
  const rhythmListeners: ListenerSet<RhythmHitEvent> = new Set();
  const routeListeners: ListenerSet<AudioInputDevice[]> = new Set();
  const errorListeners: ListenerSet<Error> = new Set();

  const removeFrameConsumer = vi.fn();
  const addFrameConsumer = vi.fn<(_: AudioFrameConsumer) => () => void>(() => removeFrameConsumer);

  const bridge: AudioInputBridge = {
    requestPermission: vi.fn<() => Promise<AudioPermissionStatus>>().mockResolvedValue('granted'),
    getPermissionStatus: vi.fn<() => Promise<AudioPermissionStatus>>().mockResolvedValue('granted'),
    listInputDevices: vi.fn<() => Promise<AudioInputDevice[]>>().mockResolvedValue([]),
    getSelectedInputDevice: vi.fn<() => Promise<AudioInputDevice | null>>().mockResolvedValue(null),
    selectInputDevice: vi.fn<(deviceId: string) => Promise<void>>().mockResolvedValue(undefined),
    startCapture: vi.fn<(config: AudioCaptureConfig) => Promise<void>>().mockResolvedValue(undefined),
    stopCapture: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    configureAnalyzers: vi.fn<(config: { enablePitch: boolean; enableRhythm: boolean }) => Promise<void>>()
      .mockResolvedValue(undefined),
    onSessionStateChanged: vi.fn((callback: (state: AudioSessionState) => void) =>
      addListener(sessionStateListeners, callback),
    ),
    onPitchDetected: vi.fn((callback: (event: PitchDetectionEvent) => void) =>
      addListener(pitchListeners, callback),
    ),
    onRhythmHitDetected: vi.fn((callback: (event: RhythmHitEvent) => void) =>
      addListener(rhythmListeners, callback),
    ),
    onRouteChanged: vi.fn((callback: (devices: AudioInputDevice[]) => void) =>
      addListener(routeListeners, callback),
    ),
    onError: vi.fn((callback: (error: Error) => void) =>
      addListener(errorListeners, callback),
    ),
    dispose: vi.fn(),
    ...(options?.withFrameConsumer ? { addFrameConsumer } : {}),
  };

  return {
    bridge,
    addFrameConsumer,
    removeFrameConsumer,
    emitSessionState(state: AudioSessionState) {
      for (const listener of sessionStateListeners) listener(state);
    },
    emitPitch(event: PitchDetectionEvent) {
      for (const listener of pitchListeners) listener(event);
    },
    emitRhythm(event: RhythmHitEvent) {
      for (const listener of rhythmListeners) listener(event);
    },
    emitRoute(devices: AudioInputDevice[]) {
      for (const listener of routeListeners) listener(devices);
    },
    emitError(error: Error) {
      for (const listener of errorListeners) listener(error);
    },
  };
}
