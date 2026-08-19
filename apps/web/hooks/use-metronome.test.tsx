// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NativeMetronomeStateData } from '@tempo-tune/shared/types';
import { renderTestHook } from './test-utils/render-hook';

const serviceHarness = vi.hoisted(() => {
  const instances: Array<{
    setTempo: ReturnType<typeof vi.fn>;
    setTimeSignature: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  }> = [];

  const MetronomeAudioServiceMock = vi.fn(function MockMetronomeAudioService() {
    const instance = {
      onTick: vi.fn(() => vi.fn()),
      start: vi.fn(async () => undefined),
      stop: vi.fn(),
      setTempo: vi.fn(),
      setTimeSignature: vi.fn(),
      loadCustomSound: vi.fn(async () => undefined),
      clearCustomSounds: vi.fn(),
      dispose: vi.fn(),
    };
    instances.push(instance);
    return instance;
  });

  return {
    instances,
    MetronomeAudioServiceMock,
    reset() {
      instances.length = 0;
      MetronomeAudioServiceMock.mockClear();
    },
  };
});

const nativeHarness = vi.hoisted(() => {
  let stateCallback: ((data: NativeMetronomeStateData) => void) | null = null;

  return {
    isNative: false,
    sendCommand: vi.fn(),
    setStateCallback(callback: (data: NativeMetronomeStateData) => void) {
      stateCallback = callback;
    },
    reset() {
      stateCallback = null;
      this.isNative = false;
      this.sendCommand.mockReset();
    },
  };
});

vi.mock('../services/audio', () => ({
  MetronomeAudioService: serviceHarness.MetronomeAudioServiceMock,
}));

vi.mock('../services/audio/native-metronome-bridge', () => ({
  isNativeEnvironment: () => nativeHarness.isNative,
  sendNativeMetronomeCommand: nativeHarness.sendCommand,
  onNativeMetronomeTick: () => vi.fn(),
  onNativeMetronomeState: (
    callback: (data: NativeMetronomeStateData) => void
  ) => {
    nativeHarness.setStateCallback(callback);
    return vi.fn();
  },
}));

import { useMetronome } from './use-metronome';

describe('useMetronome preferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
    serviceHarness.reset();
    nativeHarness.reset();
  });

  it('restores preferences and sends normalized values to the web service', () => {
    window.localStorage.setItem('tempo_metronome_bpm_v1', '180');
    window.localStorage.setItem('tempo_metronome_time_signature_v1', '[6,8]');

    const { result, unmount } = renderTestHook(() => useMetronome());
    const service = serviceHarness.instances[0];

    expect(result.current.bpm).toBe(180);
    expect(result.current.timeSignature).toEqual([6, 8]);
    expect(service.setTempo).toHaveBeenCalledWith(180);
    expect(service.setTimeSignature).toHaveBeenCalledWith([6, 8]);

    act(() => {
      result.current.setBpm(999);
      result.current.setTimeSignature([5, 16]);
    });

    expect(result.current.bpm).toBe(300);
    expect(result.current.timeSignature).toEqual([4, 4]);
    expect(service.setTempo).toHaveBeenLastCalledWith(300);
    expect(service.setTimeSignature).toHaveBeenLastCalledWith([4, 4]);

    unmount();
  });

  it('sends normalized preferences to the native bridge', () => {
    nativeHarness.isNative = true;
    const { result, unmount } = renderTestHook(() => useMetronome());

    act(() => {
      result.current.setBpm(999);
      result.current.setTimeSignature([5, 16]);
    });

    expect(nativeHarness.sendCommand).toHaveBeenCalledWith(
      'SET_METRONOME_BPM',
      {
        bpm: 300,
      }
    );
    expect(nativeHarness.sendCommand).toHaveBeenCalledWith(
      'SET_METRONOME_TIME_SIG',
      {
        beatsPerMeasure: 4,
      }
    );

    unmount();
  });
});
