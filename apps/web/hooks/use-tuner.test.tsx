// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TunerNote } from '@tempo-tune/shared/types';
import { setAudioInputBridge, resetAudioInputBridge } from '../services/audio-input';
import { createFakeAudioInputBridge } from './test-utils/fake-audio-input-bridge';
import { renderTestHook } from './test-utils/render-hook';

const serviceHarness = vi.hoisted(() => {
  let noteCallback: ((note: TunerNote | null) => void) | null = null;
  let errorCallback: ((error: Error) => void) | null = null;

  const instances: Array<{
    startExternal: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    createFrameConsumer: ReturnType<typeof vi.fn>;
  }> = [];

  const TunerAudioServiceMock = vi.fn(function MockTunerAudioService() {
    const instance = {
      setPreset: vi.fn(),
      setReferenceFrequency: vi.fn(),
      setPitchDetectionConfig: vi.fn(),
      onNoteDetected: vi.fn((callback: (note: TunerNote | null) => void) => {
        noteCallback = callback;
        return vi.fn();
      }),
      onError: vi.fn((callback: (error: Error) => void) => {
        errorCallback = callback;
        return vi.fn();
      }),
      createFrameConsumer: vi.fn(() => vi.fn()),
      startExternal: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
      findClosestString: vi.fn(() => null),
      getCentsFromTarget: vi.fn(() => 0),
    };

    instances.push(instance);
    return instance;
  });

  return {
    TunerAudioServiceMock,
    instances,
    emitNote(note: TunerNote | null) {
      noteCallback?.(note);
    },
    emitError(error: Error) {
      errorCallback?.(error);
    },
    reset() {
      noteCallback = null;
      errorCallback = null;
      instances.length = 0;
      TunerAudioServiceMock.mockClear();
    },
  };
});

vi.mock('../services/audio', () => ({
  TunerAudioService: serviceHarness.TunerAudioServiceMock,
}));

vi.mock('../utils/latency-debug', () => ({
  isLatencyDebugEnabled: () => false,
}));

import { useTuner } from './use-tuner';

describe('useTuner', () => {
  beforeEach(() => {
    serviceHarness.reset();
    window.localStorage.clear();
  });

  afterEach(() => {
    resetAudioInputBridge();
  });

  it('starts through the shared bridge and reacts to native pitch/error events', async () => {
    const fakeBridge = createFakeAudioInputBridge();
    setAudioInputBridge(fakeBridge.bridge);

    const { result, unmount, waitFor } = renderTestHook(() => useTuner());

    await result.current.start();

    expect(fakeBridge.bridge.startCapture).toHaveBeenCalledWith({
      deviceId: 'default',
      channelIndex: 0,
      enablePitch: true,
      enableRhythm: false,
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(true);
    });

    fakeBridge.emitPitch({
      frequency: 440,
      confidence: 0.95,
      name: 'A',
      octave: 4,
      cents: 0,
      detectedAtMonotonicMs: 1234,
      debugSource: 'native',
    });

    await waitFor(() => {
      expect(result.current.detectedNote?.name).toBe('A');
      expect(result.current.detectedNote?.octave).toBe(4);
      expect(result.current.hasSignal).toBe(true);
    });

    fakeBridge.emitError(new Error('native capture failed'));

    await waitFor(() => {
      expect(result.current.error).toBe('native capture failed');
      expect(result.current.isListening).toBe(false);
    });

    unmount();
  });

  it('reuses the facade frame-consumer path on web and cleans up on unmount', async () => {
    const fakeBridge = createFakeAudioInputBridge({ withFrameConsumer: true });
    setAudioInputBridge(fakeBridge.bridge);

    const { result, unmount, waitFor } = renderTestHook(() => useTuner());

    expect(fakeBridge.addFrameConsumer).toHaveBeenCalledTimes(1);
    expect(serviceHarness.TunerAudioServiceMock).toHaveBeenCalledTimes(1);

    await result.current.start();

    const serviceInstance = serviceHarness.instances[0];
    expect(serviceInstance.startExternal).toHaveBeenCalledTimes(1);
    expect(fakeBridge.bridge.startCapture).toHaveBeenCalledWith({
      deviceId: 'default',
      channelIndex: 0,
      enablePitch: true,
      enableRhythm: false,
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(true);
    });

    serviceHarness.emitNote({
      frequency: 440,
      confidence: 0.92,
      name: 'A',
      octave: 4,
      cents: 0,
      detectedAtMs: 4321,
      debugSource: 'web',
    });

    await waitFor(() => {
      expect(result.current.detectedNote?.name).toBe('A');
      expect(result.current.isListening).toBe(true);
    });

    result.current.stop();

    expect(fakeBridge.bridge.stopCapture).toHaveBeenCalledTimes(1);
    expect(serviceInstance.stop).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.isListening).toBe(false);
    });

    unmount();

    expect(fakeBridge.removeFrameConsumer).toHaveBeenCalledTimes(1);
    expect(serviceInstance.dispose).toHaveBeenCalledTimes(1);
  });
});
