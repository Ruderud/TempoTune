import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AudioInputDevice } from '@tempo-tune/shared/types';

// --- Hoisted mocks (accessible inside vi.mock factories) ---
const {
  mockStartCapture,
  mockStopCapture,
  mockAddConsumer,
  mockOnStateChanged,
  mockDispose,
  mockListWebInputDevices,
  mockOnWebDeviceChange,
} = vi.hoisted(() => ({
  mockStartCapture: vi.fn(),
  mockStopCapture: vi.fn(),
  mockAddConsumer: vi.fn(() => vi.fn()),
  mockOnStateChanged: vi.fn(() => vi.fn()),
  mockDispose: vi.fn(),
  mockListWebInputDevices: vi.fn(),
  mockOnWebDeviceChange: vi.fn(() => vi.fn()),
}));

vi.mock('../audio/live-input-audio.service', () => ({
  LiveInputAudioService: function MockLiveInputAudioService() {
    return {
      startCapture: mockStartCapture,
      stopCapture: mockStopCapture,
      addConsumer: mockAddConsumer,
      onStateChanged: mockOnStateChanged,
      dispose: mockDispose,
    };
  },
}));

vi.mock('../audio/web-audio-input.service', () => ({
  listWebInputDevices: mockListWebInputDevices,
  onWebDeviceChange: mockOnWebDeviceChange,
}));

import { createWebAudioInputAdapter } from './web-audio-input.adapter';

// --- Browser API mocks ---
const mockMediaDevices = {
  enumerateDevices: vi.fn(),
  getUserMedia: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockPermissions = {
  query: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('navigator', {
    mediaDevices: mockMediaDevices,
    permissions: mockPermissions,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// listInputDevices
// ---------------------------------------------------------------------------
describe('listInputDevices', () => {
  it('returns devices in AudioInputDevice shape', async () => {
    const fakeDevices: AudioInputDevice[] = [
      {
        id: 'mic-1',
        label: 'Built-in Microphone',
        transport: 'built-in',
        platformKind: 'web',
        channelCount: 1,
        sampleRates: [],
        isDefault: true,
        isAvailable: true,
      },
    ];
    mockListWebInputDevices.mockResolvedValue(fakeDevices);

    const adapter = createWebAudioInputAdapter();
    const devices = await adapter.listInputDevices();

    expect(devices).toEqual(fakeDevices);
    expect(mockListWebInputDevices).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// selectInputDevice + startCapture
// ---------------------------------------------------------------------------
describe('selectInputDevice', () => {
  it('stores device ID so subsequent startCapture uses it', async () => {
    mockStartCapture.mockResolvedValue(undefined);

    const adapter = createWebAudioInputAdapter();
    await adapter.selectInputDevice('usb-mic-42');
    await adapter.startCapture({ sampleRate: 44100 });

    expect(mockStartCapture).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: 'usb-mic-42' }),
    );
  });
});

// ---------------------------------------------------------------------------
// startCapture / stopCapture delegation
// ---------------------------------------------------------------------------
describe('startCapture / stopCapture', () => {
  it('startCapture delegates to LiveInputAudioService', async () => {
    mockStartCapture.mockResolvedValue(undefined);

    const adapter = createWebAudioInputAdapter();
    await adapter.startCapture({ sampleRate: 44100, bufferSize: 2048 });

    expect(mockStartCapture).toHaveBeenCalledTimes(1);
    expect(mockStartCapture).toHaveBeenCalledWith(
      expect.objectContaining({ sampleRate: 44100, bufferSize: 2048 }),
    );
  });

  it('stopCapture delegates to LiveInputAudioService', async () => {
    const adapter = createWebAudioInputAdapter();
    await adapter.stopCapture();

    expect(mockStopCapture).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// addFrameConsumer
// ---------------------------------------------------------------------------
describe('addFrameConsumer', () => {
  it('returns an unsubscribe function', () => {
    const unsubSpy = vi.fn();
    mockAddConsumer.mockReturnValue(unsubSpy);

    const adapter = createWebAudioInputAdapter();
    const consumer = vi.fn();
    const unsub = adapter.addFrameConsumer(consumer);

    expect(mockAddConsumer).toHaveBeenCalledWith(consumer);
    expect(typeof unsub).toBe('function');

    unsub();
    expect(unsubSpy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// onRouteChanged
// ---------------------------------------------------------------------------
describe('onRouteChanged', () => {
  it('fires when devices change', () => {
    const unsubSpy = vi.fn();
    mockOnWebDeviceChange.mockReturnValue(unsubSpy);

    const adapter = createWebAudioInputAdapter();
    const callback = vi.fn();
    const unsub = adapter.onRouteChanged(callback);

    expect(mockOnWebDeviceChange).toHaveBeenCalledWith(callback);
    expect(typeof unsub).toBe('function');

    unsub();
    expect(unsubSpy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// onError
// ---------------------------------------------------------------------------
describe('onError', () => {
  it('fires when startCapture fails', async () => {
    const captureError = new Error('Mic access denied');
    mockStartCapture.mockRejectedValue(captureError);

    const adapter = createWebAudioInputAdapter();
    const errorSpy = vi.fn();
    adapter.onError(errorSpy);

    await expect(adapter.startCapture({ sampleRate: 44100 })).rejects.toThrow('Mic access denied');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(captureError);
  });
});

// ---------------------------------------------------------------------------
// requestPermission
// ---------------------------------------------------------------------------
describe('requestPermission', () => {
  it('returns granted when getUserMedia succeeds', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: () => [mockTrack] };
    mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

    const adapter = createWebAudioInputAdapter();
    const status = await adapter.requestPermission();

    expect(status).toBe('granted');
    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(mockTrack.stop).toHaveBeenCalledTimes(1);
  });

  it('returns denied when getUserMedia throws', async () => {
    mockMediaDevices.getUserMedia.mockRejectedValue(new DOMException('Not allowed', 'NotAllowedError'));

    const adapter = createWebAudioInputAdapter();
    const status = await adapter.requestPermission();

    expect(status).toBe('denied');
  });
});

// ---------------------------------------------------------------------------
// dispose
// ---------------------------------------------------------------------------
describe('dispose', () => {
  it('cleans up LiveInputAudioService and internal state', () => {
    const adapter = createWebAudioInputAdapter();

    const errorSpy = vi.fn();
    adapter.onError(errorSpy);

    adapter.dispose();

    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it('clears error callbacks so they no longer fire', async () => {
    mockStartCapture.mockRejectedValue(new Error('fail'));

    const adapter = createWebAudioInputAdapter();
    const errorSpy = vi.fn();
    adapter.onError(errorSpy);

    adapter.dispose();

    // After dispose, error callback should not fire
    await expect(adapter.startCapture({ sampleRate: 44100 })).rejects.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
