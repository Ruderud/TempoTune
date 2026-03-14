import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AudioInputBridge } from '@tempo-tune/audio-input';

const hoisted = vi.hoisted(() => ({
  createAudioInputBridgeMock: vi.fn(),
  createWebAudioInputAdapterMock: vi.fn(),
  createNativeBridgeAudioInputAdapterMock: vi.fn(),
  isNativeEnvironmentMock: vi.fn(),
}));

vi.mock('@tempo-tune/audio-input', () => ({
  createAudioInputBridge: hoisted.createAudioInputBridgeMock,
}));

vi.mock('./web-audio-input.adapter', () => ({
  createWebAudioInputAdapter: hoisted.createWebAudioInputAdapterMock,
}));

vi.mock('./native-bridge-audio-input.adapter', () => ({
  createNativeBridgeAudioInputAdapter: hoisted.createNativeBridgeAudioInputAdapterMock,
}));

vi.mock('../bridge/bridge-adapter', () => ({
  isNativeEnvironment: hoisted.isNativeEnvironmentMock,
}));

import {
  getAudioInputBridge,
  resetAudioInputBridge,
  setAudioInputBridge,
} from './audio-input-instance';

function createBridgeStub(): AudioInputBridge {
  return {
    requestPermission: vi.fn(),
    getPermissionStatus: vi.fn(),
    listInputDevices: vi.fn(),
    getSelectedInputDevice: vi.fn(),
    selectInputDevice: vi.fn(),
    startCapture: vi.fn(),
    stopCapture: vi.fn(),
    configureAnalyzers: vi.fn(),
    onSessionStateChanged: vi.fn(() => vi.fn()),
    onPitchDetected: vi.fn(() => vi.fn()),
    onRhythmHitDetected: vi.fn(() => vi.fn()),
    onRouteChanged: vi.fn(() => vi.fn()),
    onError: vi.fn(() => vi.fn()),
    dispose: vi.fn(),
  };
}

describe('audio-input-instance', () => {
  beforeEach(() => {
    resetAudioInputBridge();
    vi.clearAllMocks();
    hoisted.isNativeEnvironmentMock.mockReturnValue(false);
    hoisted.createWebAudioInputAdapterMock.mockReturnValue({ kind: 'web' });
    hoisted.createNativeBridgeAudioInputAdapterMock.mockReturnValue({ kind: 'native' });
    hoisted.createAudioInputBridgeMock.mockImplementation(() => createBridgeStub());
  });

  it('creates a singleton bridge with the web adapter in standalone browser mode', () => {
    const first = getAudioInputBridge();
    const second = getAudioInputBridge();

    expect(first).toBe(second);
    expect(hoisted.isNativeEnvironmentMock).toHaveBeenCalledTimes(1);
    expect(hoisted.createWebAudioInputAdapterMock).toHaveBeenCalledTimes(1);
    expect(hoisted.createNativeBridgeAudioInputAdapterMock).not.toHaveBeenCalled();
    expect(hoisted.createAudioInputBridgeMock).toHaveBeenCalledWith({ kind: 'web' });
  });

  it('creates the bridge with the native WebView adapter in native environments', () => {
    hoisted.isNativeEnvironmentMock.mockReturnValue(true);

    getAudioInputBridge();

    expect(hoisted.createNativeBridgeAudioInputAdapterMock).toHaveBeenCalledTimes(1);
    expect(hoisted.createWebAudioInputAdapterMock).not.toHaveBeenCalled();
    expect(hoisted.createAudioInputBridgeMock).toHaveBeenCalledWith({ kind: 'native' });
  });

  it('returns an injected bridge without re-creating adapters', () => {
    const injectedBridge = createBridgeStub();

    setAudioInputBridge(injectedBridge);
    const resolvedBridge = getAudioInputBridge();

    expect(resolvedBridge).toBe(injectedBridge);
    expect(hoisted.createAudioInputBridgeMock).not.toHaveBeenCalled();
    expect(hoisted.createWebAudioInputAdapterMock).not.toHaveBeenCalled();
    expect(hoisted.createNativeBridgeAudioInputAdapterMock).not.toHaveBeenCalled();
  });

  it('disposes the current singleton when resetAudioInputBridge is called', () => {
    const bridge = createBridgeStub();
    hoisted.createAudioInputBridgeMock.mockReturnValue(bridge);

    getAudioInputBridge();
    resetAudioInputBridge();

    expect(bridge.dispose).toHaveBeenCalledTimes(1);
  });
});
