/**
 * webview-load.smoke.spec.ts
 * Verifies that the WebView loads the web app content.
 */
import { acceptSystemAlertIfPresent } from '../helpers/alerts';
import { switchToWebView, switchToNative } from '../helpers/contexts';
import { waitForWebViewReady } from '../helpers/wait';

describe('WebView Load', () => {
  it('should detect WEBVIEW context', async () => {
    await acceptSystemAlertIfPresent(driver);
    // Wait for WebView to become available
    const webviewContext = await switchToWebView(driver, 10, 3000);
    expect(webviewContext).toMatch(/^WEBVIEW/);
  });

  it('should load the web app in WebView', async () => {
    await switchToWebView(driver);
    await waitForWebViewReady(driver, 20000);

    const title = await driver.getTitle();
    // App should have loaded (title may vary)
    expect(title).toBeTruthy();
  });

  it('should find the tab navigation', async () => {
    await switchToWebView(driver);
    await waitForWebViewReady(driver);

    // Look for the mobile tab bar via data-testid
    const tabBar = await driver.$('[data-testid="tab-bar-mobile"]');
    const exists = await tabBar.isExisting();
    expect(exists).toBe(true);
  });

  afterEach(async () => {
    try {
      await switchToNative(driver);
    } catch {
      /* already in native */
    }
  });
});
