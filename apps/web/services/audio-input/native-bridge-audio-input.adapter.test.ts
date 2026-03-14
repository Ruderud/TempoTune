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
});
