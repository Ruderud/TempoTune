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
 * Checks for document.readyState === 'complete' and waits until the tab shell
 * is present. If the landing page is still open inside the native WebView,
 * it nudges navigation to the default app route.
 */
export async function waitForWebViewReady(
  driver: WebdriverIO.Browser,
  timeout = 15000,
): Promise<void> {
  await driver.waitUntil(
    async () => {
      try {
        return await driver.execute(() => {
          const nativeWindow = window as typeof window & {
            ReactNativeWebView?: { postMessage: (message: string) => void };
            __TEMPO_TUNE_NATIVE_WEBVIEW__?: boolean;
            __TEMPO_TUNE_APP_ENTRY_PATH__?: string;
          };

          if (document.readyState !== 'complete') {
            return false;
          }

          const hasAppShell = Boolean(
            document.querySelector('[data-testid="tab-bar-mobile"]') ||
              document.querySelector('[data-testid="tab-desktop-metronome"]'),
          );

          if (hasAppShell) {
            return true;
          }

          const appEntryPath =
            nativeWindow.__TEMPO_TUNE_APP_ENTRY_PATH__ ?? '/metronome';
          const pathname = window.location.pathname || '';
          const isAtAppEntry =
            pathname === appEntryPath || pathname.startsWith(`${appEntryPath}/`);

          if (
            (nativeWindow.__TEMPO_TUNE_NATIVE_WEBVIEW__ === true ||
              nativeWindow.ReactNativeWebView) &&
            (pathname === '/' || pathname === '')
          ) {
            window.location.replace(appEntryPath);
            return false;
          }

          return hasAppShell && isAtAppEntry;
        });
      } catch {
        return false;
      }
    },
    {
      timeout,
      timeoutMsg: 'WebView app shell did not become ready',
      interval: 500,
    },
  );
}
