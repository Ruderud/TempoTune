import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- bridge-adapter mock (must be declared before AudioBridgeClient import) ---
vi.mock('../bridge-adapter', () => ({
  isNativeEnvironment: vi.fn(),
  postMessageToNative: vi.fn(),
  addNativeMessageListener: vi.fn(),
}));

import { AudioBridgeClient } from '../audio-bridge.client';
import * as adapter from '../bridge-adapter';

const mockIsNative = adapter.isNativeEnvironment as ReturnType<typeof vi.fn>;
const mockPostMessage = adapter.postMessageToNative as ReturnType<typeof vi.fn>;
const mockAddListener = adapter.addNativeMessageListener as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockIsNative.mockReturnValue(false);
  mockAddListener.mockReturnValue(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// bridge-adapter unit tests
// ---------------------------------------------------------------------------
describe('bridge-adapter', () => {
  describe('isNativeEnvironment', () => {
    it('returns false when ReactNativeWebView is absent', () => {
      mockIsNative.mockReturnValue(false);
      expect(adapter.isNativeEnvironment()).toBe(false);
    });

    it('returns true when ReactNativeWebView is present', () => {
      mockIsNative.mockReturnValue(true);
      expect(adapter.isNativeEnvironment()).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// AudioBridgeClient — non-native environment
// ---------------------------------------------------------------------------
describe('AudioBridgeClient (non-native)', () => {
  it('does NOT register a native message listener on construction', () => {
    mockIsNative.mockReturnValue(false);
    new AudioBridgeClient();
    expect(mockAddListener).not.toHaveBeenCalled();
  });

  it('registers a native message listener in native env on construction', () => {
    mockIsNative.mockReturnValue(true);
    new AudioBridgeClient();
    expect(mockAddListener).toHaveBeenCalledTimes(1);
  });

  it('startListening does NOT postMessage in non-native env', async () => {
    mockIsNative.mockReturnValue(false);
    const client = new AudioBridgeClient();
    await client.startListening();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('stopListening does NOT postMessage in non-native env', async () => {
    mockIsNative.mockReturnValue(false);
    const client = new AudioBridgeClient();
    await client.stopListening();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AudioBridgeClient — native environment
// ---------------------------------------------------------------------------
describe('AudioBridgeClient (native)', () => {
  beforeEach(() => {
    mockIsNative.mockReturnValue(true);
  });

  it('startListening posts START_LISTENING to native', async () => {
    const client = new AudioBridgeClient();
    await client.startListening();
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'START_LISTENING' });
  });

  it('stopListening posts STOP_LISTENING to native', async () => {
    const client = new AudioBridgeClient();
    await client.stopListening();
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'STOP_LISTENING' });
  });

  it('requestPermission posts REQUEST_MIC_PERMISSION and resolves on success response', async () => {
    // addNativeMessageListener is called twice: once in constructor, once in requestPermission.
    // Capture the second call's callback to simulate the native response.
    let permissionCallback: ((data: unknown) => void) | null = null;
    mockAddListener.mockImplementation((cb: (data: unknown) => void) => {
      permissionCallback = cb;
      return () => {};
    });

    const client = new AudioBridgeClient();
    const permissionPromise = client.requestPermission();

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'REQUEST_MIC_PERMISSION' });

    // Simulate native sending MIC_PERMISSION_RESPONSE
    permissionCallback!({
      type: 'MIC_PERMISSION_RESPONSE',
      success: true,
      data: { status: 'granted' },
    });

    const result = await permissionPromise;
    expect(result).toBe('granted');
  });

  it('requestPermission rejects when native responds with success=false', async () => {
    let permissionCallback: ((data: unknown) => void) | null = null;
    mockAddListener.mockImplementation((cb: (data: unknown) => void) => {
      permissionCallback = cb;
      return () => {};
    });

    const client = new AudioBridgeClient();
    const permissionPromise = client.requestPermission();

    permissionCallback!({
      type: 'MIC_PERMISSION_RESPONSE',
      success: false,
      error: 'Permission denied by OS',
    });

    await expect(permissionPromise).rejects.toThrow('Permission denied by OS');
  });

  it('ignores non-MIC_PERMISSION_RESPONSE messages during requestPermission', async () => {
    let permissionCallback: ((data: unknown) => void) | null = null;
    mockAddListener.mockImplementation((cb: (data: unknown) => void) => {
      permissionCallback = cb;
      return () => {};
    });

    const client = new AudioBridgeClient();
    const permissionPromise = client.requestPermission();

    // Unrelated message — should be ignored
    permissionCallback!({ type: 'PITCH_DETECTED', data: {} });

    // Now send the real response
    permissionCallback!({
      type: 'MIC_PERMISSION_RESPONSE',
      success: true,
      data: { status: 'granted' },
    });

    await expect(permissionPromise).resolves.toBe('granted');
  });
});

// ---------------------------------------------------------------------------
// AudioBridgeClient — pitch/error callback routing
// ---------------------------------------------------------------------------
describe('AudioBridgeClient pitch and error callbacks', () => {
  it('fires onPitchDetected callbacks when PITCH_DETECTED arrives', () => {
    let nativeHandler: ((data: unknown) => void) | null = null;
    mockIsNative.mockReturnValue(true);
    mockAddListener.mockImplementation((cb: (data: unknown) => void) => {
      nativeHandler = cb;
      return () => {};
    });

    const client = new AudioBridgeClient();
    const pitchSpy = vi.fn();
    client.onPitchDetected(pitchSpy);

    nativeHandler!({
      type: 'PITCH_DETECTED',
      data: { name: 'A', octave: 4, cents: 0, frequency: 440 },
    });

    expect(pitchSpy).toHaveBeenCalledTimes(1);
    expect(pitchSpy.mock.calls[0][0]).toMatchObject({ name: 'A', octave: 4 });
  });

  it('unsubscribes onPitchDetected when returned cleanup is called', () => {
    let nativeHandler: ((data: unknown) => void) | null = null;
    mockIsNative.mockReturnValue(true);
    mockAddListener.mockImplementation((cb: (data: unknown) => void) => {
      nativeHandler = cb;
      return () => {};
    });

    const client = new AudioBridgeClient();
    const pitchSpy = vi.fn();
    const unsub = client.onPitchDetected(pitchSpy);
    unsub();

    nativeHandler!({ type: 'PITCH_DETECTED', data: { name: 'A', octave: 4, cents: 0, frequency: 440 } });
    expect(pitchSpy).not.toHaveBeenCalled();
  });

  it('fires onError callbacks when ERROR message arrives', () => {
    let nativeHandler: ((data: unknown) => void) | null = null;
    mockIsNative.mockReturnValue(true);
    mockAddListener.mockImplementation((cb: (data: unknown) => void) => {
      nativeHandler = cb;
      return () => {};
    });

    const client = new AudioBridgeClient();
    const errorSpy = vi.fn();
    client.onError(errorSpy);

    nativeHandler!({ type: 'ERROR', error: 'mic failure' });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(errorSpy.mock.calls[0][0].message).toBe('mic failure');
  });

  it('dispose clears all callbacks and removes native listener', () => {
    const removeSpy = vi.fn();
    mockIsNative.mockReturnValue(true);
    mockAddListener.mockReturnValue(removeSpy);

    const client = new AudioBridgeClient();
    client.dispose();

    expect(removeSpy).toHaveBeenCalledTimes(1);
  });
});
