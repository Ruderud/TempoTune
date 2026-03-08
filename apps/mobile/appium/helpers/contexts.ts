/**
 * Appium context helpers for WebView hybrid apps.
 */

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

  throw new Error('WebView context not found after retries');
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
