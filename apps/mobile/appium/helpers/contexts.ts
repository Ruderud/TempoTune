/**
 * Appium context helpers for WebView hybrid apps.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = resolve(__dirname, '../../../../reports/qa/device');

async function captureNativeDiagnostics(driver: WebdriverIO.Browser) {
  mkdirSync(REPORT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = `${timestamp}-webview-context-diagnostic`;
  const sourcePath = resolve(REPORT_DIR, `${baseName}.xml`);
  const screenshotPath = resolve(REPORT_DIR, `${baseName}.png`);

  let source = '';
  let webViewExists = false;
  let appState: number | null = null;

  try {
    source = await driver.getPageSource();
    writeFileSync(sourcePath, source, 'utf-8');
  } catch {
    source = '';
  }

  try {
    await driver.saveScreenshot(screenshotPath);
  } catch {
    // Best effort.
  }

  try {
    const webView = await driver.$('~app-webview');
    webViewExists = await webView.isExisting();
  } catch {
    webViewExists = false;
  }

  try {
    if (driver.isIOS) {
      appState = (await driver.execute('mobile: queryAppState', {
        bundleId: process.env.QA_IOS_BUNDLE_ID || 'com.rud.tempotune',
      })) as number;
    }
  } catch {
    appState = null;
  }

  return {
    appState,
    screenshotPath,
    sourcePath,
    webViewExists,
    sourceContainsWebViewTestId: source.includes('app-webview'),
  };
}

/**
 * Switch to the WebView context (from native).
 * Retries up to `maxRetries` times since WebView may take time to load.
 */
export async function switchToWebView(
  driver: WebdriverIO.Browser,
  maxRetries = 5,
  delayMs = 2000,
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const contexts = await driver.getContexts();
    const webview = contexts.find(
      (ctx) => typeof ctx === 'string' && ctx.startsWith('WEBVIEW'),
    ) as string | undefined;

    if (webview) {
      await driver.switchContext(webview);
      return webview;
    }

    if (i < maxRetries - 1) {
      await driver.pause(delayMs);
    }
  }

  const diagnostics = await captureNativeDiagnostics(driver);
  throw new Error(
    `WebView context not found after retries; native app-webview exists=${diagnostics.webViewExists}; ` +
      `source contains app-webview=${diagnostics.sourceContainsWebViewTestId}; ` +
      `appState=${diagnostics.appState ?? 'unknown'}; ` +
      `source=${diagnostics.sourcePath}; screenshot=${diagnostics.screenshotPath}`
  );
}

/**
 * Switch back to the native context.
 */
export async function switchToNative(driver: WebdriverIO.Browser): Promise<void> {
  await driver.switchContext('NATIVE_APP');
}

/**
 * Get all available contexts.
 */
export async function getContexts(driver: WebdriverIO.Browser): Promise<string[]> {
  return (await driver.getContexts()) as string[];
}
