import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BridgeHandler } from '../bridge-handler.service';
import type { RefObject } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWebViewRef(injectJavaScript = vi.fn()) {
  return {
    current: { injectJavaScript },
  } as unknown as RefObject<{ injectJavaScript: (script: string) => void }>;
}

function makeBridgeMessage(
  type: string,
  data?: unknown,
  requestId?: string,
): string {
  return JSON.stringify({ type, data, requestId });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// sendToWebView
// ---------------------------------------------------------------------------
describe('BridgeHandler.sendToWebView', () => {
  it('injects postMessage script into WebView', () => {
    const inject = vi.fn();
    const ref = makeWebViewRef(inject);
    const handler = new BridgeHandler(ref as never);

    handler.sendToWebView({ type: 'PING' });

    expect(inject).toHaveBeenCalledTimes(1);
    const script: string = inject.mock.calls[0][0];
    expect(script).toContain('window.postMessage');
    expect(script).toContain('PING');
  });

  it('does nothing when webViewRef.current is null', () => {
    const ref = { current: null } as RefObject<null>;
    const handler = new BridgeHandler(ref as never);
    // Should not throw
    expect(() => handler.sendToWebView({ type: 'PING' })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// handleMessage — protocol routing
// ---------------------------------------------------------------------------
describe('BridgeHandler.handleMessage', () => {
  it('routes message to registered handler', async () => {
    const inject = vi.fn();
    const ref = makeWebViewRef(inject);
    const handler = new BridgeHandler(ref as never);

    const mockHandler = vi.fn().mockResolvedValue({ success: true });
    handler.registerHandler('REQUEST_MIC_PERMISSION', mockHandler);

    await handler.handleMessage(makeBridgeMessage('REQUEST_MIC_PERMISSION'));

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('maps REQUEST_MIC_PERMISSION → MIC_PERMISSION_RESPONSE in reply', async () => {
    const inject = vi.fn();
    const ref = makeWebViewRef(inject);
    const handler = new BridgeHandler(ref as never);

    handler.registerHandler('REQUEST_MIC_PERMISSION', async () => ({
      success: true,
      data: { status: 'granted' },
    }));

    await handler.handleMessage(
      makeBridgeMessage('REQUEST_MIC_PERMISSION', undefined, 'req-1'),
    );

    expect(inject).toHaveBeenCalledTimes(1);
    const script: string = inject.mock.calls[0][0];
    expect(script).toContain('MIC_PERMISSION_RESPONSE');
    expect(script).toContain('granted');
    expect(script).toContain('req-1');
  });

  it('does nothing when no handler is registered for the message type', async () => {
    const inject = vi.fn();
    const ref = makeWebViewRef(inject);
    const handler = new BridgeHandler(ref as never);

    await handler.handleMessage(makeBridgeMessage('UNKNOWN_TYPE'));

    expect(inject).not.toHaveBeenCalled();
  });

  it('passes handler data payload to the registered handler', async () => {
    const inject = vi.fn();
    const ref = makeWebViewRef(inject);
    const handler = new BridgeHandler(ref as never);

    const mockHandler = vi.fn().mockResolvedValue({ success: true });
    handler.registerHandler('START_LISTENING', mockHandler);

    const payload = { sampleRate: 44100 };
    await handler.handleMessage(makeBridgeMessage('START_LISTENING', payload));

    expect(mockHandler).toHaveBeenCalledWith(payload);
  });

  it('does not throw on malformed JSON input', async () => {
    const ref = makeWebViewRef();
    const handler = new BridgeHandler(ref as never);

    await expect(handler.handleMessage('not-json')).resolves.toBeUndefined();
  });

  it('forwards requestId from incoming message to the response envelope', async () => {
    const inject = vi.fn();
    const ref = makeWebViewRef(inject);
    const handler = new BridgeHandler(ref as never);

    handler.registerHandler('START_LISTENING', async () => ({ success: true }));
    await handler.handleMessage(
      makeBridgeMessage('START_LISTENING', undefined, 'abc-123'),
    );

    const script: string = inject.mock.calls[0][0];
    expect(script).toContain('abc-123');
  });
});

// ---------------------------------------------------------------------------
// dispose
// ---------------------------------------------------------------------------
describe('BridgeHandler.dispose', () => {
  it('clears all handlers so subsequent messages are ignored', async () => {
    const inject = vi.fn();
    const ref = makeWebViewRef(inject);
    const handler = new BridgeHandler(ref as never);

    handler.registerHandler('START_LISTENING', async () => ({ success: true }));
    handler.dispose();

    await handler.handleMessage(makeBridgeMessage('START_LISTENING'));
    expect(inject).not.toHaveBeenCalled();
  });
});
