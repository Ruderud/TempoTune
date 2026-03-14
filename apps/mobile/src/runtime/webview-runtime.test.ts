import { describe, expect, it } from 'vitest';
import {
  buildNativeAppBootstrapUrl,
  createMobileWebViewRuntime,
  DEFAULT_APP_ENTRY_PATH,
  ensureAppEntryPath,
  getWebOrigin,
} from './webview-runtime';

const baseOptions = {
  isDevMode: false,
  runtimeChannel: 'development' as const,
  platformOs: 'ios' as const,
  devMachineIp: '192.168.0.10',
  devServerPort: 3000,
  prodWebUrl: 'https://tempotune.example.com',
  androidEmulatorHost: '10.0.2.2',
  qaUseDevWebUrl: false,
  qaEnableWebviewDebugging: false,
  qaWebUrl: '',
};

describe('ensureAppEntryPath', () => {
  it('normalizes origin-only URLs to the app entry path', () => {
    expect(ensureAppEntryPath('https://tempotune.example.com')).toBe(
      `https://tempotune.example.com${DEFAULT_APP_ENTRY_PATH}`,
    );
  });

  it('keeps existing nested paths untouched', () => {
    expect(ensureAppEntryPath('https://tempotune.example.com/tuner')).toBe(
      'https://tempotune.example.com/tuner',
    );
  });
});

describe('getWebOrigin', () => {
  it('returns the origin for valid URLs', () => {
    expect(getWebOrigin('https://tempotune.example.com/metronome')).toBe(
      'https://tempotune.example.com',
    );
  });

  it('returns null for invalid URLs', () => {
    expect(getWebOrigin('not a url')).toBeNull();
  });
});

describe('buildNativeAppBootstrapUrl', () => {
  it('builds a root bootstrap URL with the native app redirect parameters', () => {
    expect(
      buildNativeAppBootstrapUrl('https://tempotune.example.com/metronome'),
    ).toBe(
      'https://tempotune.example.com/?nativeApp=1&appEntryPath=%2Fmetronome',
    );
  });

  it('falls back to the app-entry URL when the input is not a valid URL', () => {
    expect(buildNativeAppBootstrapUrl('not a url')).toBe('not a url');
  });
});

describe('createMobileWebViewRuntime', () => {
  it('forces the production URL and hides QA chrome in production runtime', () => {
    const runtime = createMobileWebViewRuntime({
      ...baseOptions,
      runtimeChannel: 'production',
      qaUseDevWebUrl: true,
      qaEnableWebviewDebugging: true,
      qaWebUrl: 'https://qa.example.com',
    });

    expect(runtime.webUrl).toBe('https://tempotune.example.com/metronome');
    expect(runtime.webOrigin).toBe('https://tempotune.example.com');
    expect(runtime.webviewDebuggingEnabled).toBe(false);
    expect(runtime.showQaDebugBanner).toBe(false);
    expect(runtime.shouldLogWebviewEvents).toBe(false);
  });

  it('uses the QA URL and enables QA chrome in qa runtime', () => {
    const runtime = createMobileWebViewRuntime({
      ...baseOptions,
      runtimeChannel: 'qa',
      qaEnableWebviewDebugging: true,
      qaWebUrl: 'https://qa.example.com',
    });

    expect(runtime.webUrl).toBe('https://qa.example.com/metronome');
    expect(runtime.webOrigin).toBe('https://qa.example.com');
    expect(runtime.webviewDebuggingEnabled).toBe(true);
    expect(runtime.showQaDebugBanner).toBe(true);
    expect(runtime.shouldLogWebviewEvents).toBe(true);
  });

  it('uses the dev server on android debug/runtime-dev path', () => {
    const runtime = createMobileWebViewRuntime({
      ...baseOptions,
      isDevMode: true,
      platformOs: 'android',
    });

    expect(runtime.webUrl).toBe('http://10.0.2.2:3000/metronome');
    expect(runtime.showQaDebugBanner).toBe(true);
    expect(runtime.webviewDebuggingEnabled).toBe(true);
  });
});
