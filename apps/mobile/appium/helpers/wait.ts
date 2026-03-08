/**
 * Wait helpers for Appium tests.
 */

/**
 * Wait for an element to be displayed with a custom timeout.
 */
export async function waitForElement(
  driver: WebdriverIO.Browser,
  selector: string,
  timeout = 10000,
): Promise<WebdriverIO.Element> {
  const element = await driver.$(selector);
  await element.waitForDisplayed({ timeout });
  return element;
}

/**
 * Wait for the WebView to finish loading.
 * Checks for document.readyState === 'complete'.
 */
export async function waitForWebViewReady(
  driver: WebdriverIO.Browser,
  timeout = 15000,
): Promise<void> {
  await driver.waitUntil(
    async () => {
      try {
        const state = await driver.execute(() => document.readyState);
        return state === 'complete';
      } catch {
        return false;
      }
    },
    { timeout, timeoutMsg: 'WebView did not become ready' },
  );
}
