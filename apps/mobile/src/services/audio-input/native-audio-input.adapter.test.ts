import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  requestMicPermissionMock,
  getMicPermissionStatusMock,
  listInputDevicesMock,
  getSelectedInputDeviceMock,
  selectInputDeviceMock,
  startCaptureMock,
  configureAnalyzersMock,
  stopCaptureMock,
  onStateChangedMock,
  onPitchDetectedMock,
  onRhythmDetectedMock,
  onRouteChangedMock,
  onErrorMock,
} = vi.hoisted(() => ({
  requestMicPermissionMock: vi.fn(),
  getMicPermissionStatusMock: vi.fn(),
  listInputDevicesMock: vi.fn(),
  getSelectedInputDeviceMock: vi.fn(),
  selectInputDeviceMock: vi.fn(),
  startCaptureMock: vi.fn(),
  configureAnalyzersMock: vi.fn(),
  stopCaptureMock: vi.fn(),
  onStateChangedMock: vi.fn(),
  onPitchDetectedMock: vi.fn(),
  onRhythmDetectedMock: vi.fn(),
  onRouteChangedMock: vi.fn(),
  onErrorMock: vi.fn(),
}));

vi.mock('../permission.service', () => ({
  requestMicPermission: requestMicPermissionMock,
  getMicPermissionStatus: getMicPermissionStatusMock,
}));

vi.mock('../native-audio-input.service', () => ({
  nativeAudioInputService: {
    listInputDevices: listInputDevicesMock,
    getSelectedInputDevice: getSelectedInputDeviceMock,
    selectInputDevice: selectInputDeviceMock,
    startCapture: startCaptureMock,
    configureAnalyzers: configureAnalyzersMock,
    stopCapture: stopCaptureMock,
    onStateChanged: onStateChangedMock,
    onPitchDetected: onPitchDetectedMock,
    onRhythmDetected: onRhythmDetectedMock,
    onRouteChanged: onRouteChangedMock,
    onError: onErrorMock,
  },
}));

import { createNativeAudioInputAdapter } from './native-audio-input.adapter';

describe('createNativeAudioInputAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestMicPermissionMock.mockResolvedValue('granted');
    getMicPermissionStatusMock.mockResolvedValue('granted');
    listInputDevicesMock.mockResolvedValue([]);
    getSelectedInputDeviceMock.mockResolvedValue(null);
    selectInputDeviceMock.mockReturnValue(undefined);
    startCaptureMock.mockReturnValue(undefined);
    configureAnalyzersMock.mockReturnValue(undefined);
    stopCaptureMock.mockReturnValue(undefined);
    onStateChangedMock.mockImplementation(() => vi.fn());
    onPitchDetectedMock.mockImplementation(() => vi.fn());
    onRhythmDetectedMock.mockImplementation(() => vi.fn());
    onRouteChangedMock.mockImplementation(() => vi.fn());
    onErrorMock.mockImplementation(() => vi.fn());
  });

  it('delegates permission, device, capture, and analyzer calls', async () => {
    const adapter = createNativeAudioInputAdapter();

    await expect(adapter.requestPermission()).resolves.toBe('granted');
    await expect(adapter.getPermissionStatus()).resolves.toBe('granted');
    await adapter.listInputDevices();
    await adapter.getSelectedInputDevice();
    await adapter.selectInputDevice('usb-1');
    await adapter.startCapture({
      deviceId: 'usb-1',
      channelIndex: 0,
      enablePitch: true,
      enableRhythm: true,
    });
    await adapter.setAnalyzerConfig({
      enablePitch: true,
      enableRhythm: false,
    });
    await adapter.stopCapture();

    expect(listInputDevicesMock).toHaveBeenCalledTimes(1);
    expect(getSelectedInputDeviceMock).toHaveBeenCalledTimes(1);
    expect(selectInputDeviceMock).toHaveBeenCalledWith('usb-1');
    expect(startCaptureMock).toHaveBeenCalledWith({
      deviceId: 'usb-1',
      channelIndex: 0,
      enablePitch: true,
      enableRhythm: true,
    });
    expect(configureAnalyzersMock).toHaveBeenCalledWith({
      enablePitch: true,
      enableRhythm: false,
    });
    expect(stopCaptureMock).toHaveBeenCalledTimes(1);
  });

  it('subscribes to native rhythm events', () => {
    let rhythmCallback: ((event: { status: string }) => void) | null = null;
    const remove = vi.fn();
    onRhythmDetectedMock.mockImplementation((callback) => {
      rhythmCallback = callback;
      return remove;
    });

    const adapter = createNativeAudioInputAdapter();
    const received = vi.fn();
    const unsub = adapter.onRhythmHitDetected(received);

    rhythmCallback?.({ status: 'on-time' });

    expect(received).toHaveBeenCalledWith({ status: 'on-time' });
    unsub();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('wraps native string errors into Error objects', () => {
    let errorCallback: ((message: string) => void) | null = null;
    onErrorMock.mockImplementation((callback) => {
      errorCallback = callback;
      return vi.fn();
    });

    const adapter = createNativeAudioInputAdapter();
    const received = vi.fn();
    adapter.onError(received);

    errorCallback?.('capture failed');

    expect(received).toHaveBeenCalledTimes(1);
    expect(received.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(received.mock.calls[0][0].message).toBe('capture failed');
  });
});
