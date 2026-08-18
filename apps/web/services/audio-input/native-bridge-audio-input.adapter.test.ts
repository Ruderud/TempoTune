import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  postMessageToNativeMock,
  addNativeMessageListenerMock,
} = vi.hoisted(() => ({
  postMessageToNativeMock: vi.fn(),
  addNativeMessageListenerMock: vi.fn(),
}));

vi.mock('../bridge/bridge-adapter', () => ({
  postMessageToNative: postMessageToNativeMock,
  addNativeMessageListener: addNativeMessageListenerMock,
}));

import { createNativeBridgeAudioInputAdapter } from './native-bridge-audio-input.adapter';

describe('createNativeBridgeAudioInputAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addNativeMessageListenerMock.mockReturnValue(() => {});
  });

  it('posts CONFIGURE_AUDIO_ANALYZERS to native', async () => {
    const adapter = createNativeBridgeAudioInputAdapter();

    await adapter.setAnalyzerConfig({
      enablePitch: true,
      enableRhythm: true,
    });

    expect(postMessageToNativeMock).toHaveBeenCalledWith({
      type: 'CONFIGURE_AUDIO_ANALYZERS',
      data: {
        enablePitch: true,
        enableRhythm: true,
      },
    });
  });

  it('forwards RHYTHM_HIT_DETECTED events to subscribers', () => {
    let nativeListener: ((data: unknown) => void) | null = null;
    addNativeMessageListenerMock.mockImplementation((callback) => {
      nativeListener = callback;
      return () => {};
    });

    const adapter = createNativeBridgeAudioInputAdapter();
    const received = vi.fn();
    adapter.onRhythmHitDetected(received);

    nativeListener?.({
      type: 'RHYTHM_HIT_DETECTED',
      data: {
        detectedAtMonotonicMs: 1000,
        nearestBeatAtMonotonicMs: 1000,
        offsetMs: 0,
        status: 'on-time',
        confidence: 0.9,
        source: 'unknown',
      },
    });

    expect(received).toHaveBeenCalledTimes(1);
    expect(received.mock.calls[0][0]).toMatchObject({
      status: 'on-time',
      offsetMs: 0,
    });
  });

  it('ignores native events whose required payload is missing', () => {
    let nativeListener: ((data: unknown) => void) | null = null;
    addNativeMessageListenerMock.mockImplementation((callback) => {
      nativeListener = callback;
      return () => {};
    });

    const adapter = createNativeBridgeAudioInputAdapter();
    const sessionState = vi.fn();
    const pitch = vi.fn();
    const rhythm = vi.fn();
    const route = vi.fn();
    const error = vi.fn();
    adapter.onSessionStateChanged(sessionState);
    adapter.onPitchDetected(pitch);
    adapter.onRhythmHitDetected(rhythm);
    adapter.onRouteChanged(route);
    adapter.onError(error);

    expect(() => {
      nativeListener?.({type: 'AUDIO_INPUT_STATE_CHANGED'});
      nativeListener?.({type: 'PITCH_DETECTED'});
      nativeListener?.({type: 'RHYTHM_HIT_DETECTED'});
      nativeListener?.({type: 'AUDIO_INPUT_ROUTE_CHANGED'});
      nativeListener?.({type: 'ERROR'});
    }).not.toThrow();
    expect(sessionState).not.toHaveBeenCalled();
    expect(pitch).not.toHaveBeenCalled();
    expect(rhythm).not.toHaveBeenCalled();
    expect(route).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
