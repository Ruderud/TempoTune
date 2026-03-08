/**
 * tuner-permission.smoke.spec.ts
 * Verifies the tuner page loads and microphone permission flow.
 */
import { acceptSystemAlertIfPresent } from '../helpers/alerts';
import { switchToWebView, switchToNative } from '../helpers/contexts';
import { waitForWebViewReady } from '../helpers/wait';

describe('Tuner Permission Flow', () => {
  before(async () => {
    await acceptSystemAlertIfPresent(driver);
    await switchToWebView(driver, 20, 5000);
    await waitForWebViewReady(driver, 45000);
  });

  it('should navigate to tuner page', async () => {
    // Click the tuner tab
    const tunerTab = await driver.$('[data-testid="tab-tuner"]');
    await tunerTab.waitForDisplayed({ timeout: 10000 });
    await tunerTab.click();

    await driver.pause(1000);
  });

  it('should find tuner controls', async () => {
    const playStop = await driver.$('[data-testid="tuner-play-stop"]');
    await playStop.waitForDisplayed({ timeout: 10000 });
    expect(await playStop.isDisplayed()).toBe(true);
  });

  it('should trigger permission dialog on start', async () => {
    const playStop = await driver.$('[data-testid="tuner-play-stop"]');
    await playStop.click();

    // Switch to native to handle permission dialog
    await switchToNative(driver);
    await driver.pause(2000);

    // Try to accept the permission dialog if it appears
    try {
      if (driver.isIOS) {
        const allowBtn = await driver.$('~Allow');
        if (await allowBtn.isExisting()) {
          await allowBtn.click();
        }
      }

      if (driver.isAndroid) {
        // Android permission dialog: "While using the app" or "Allow"
        const allowBtn = await driver.$(
          '//*[@resource-id="com.android.permissioncontroller:id/permission_allow_foreground_only_button"]'
        );
        if (await allowBtn.isExisting()) {
          await allowBtn.click();
        }
      }
    } catch {
      // Permission may already be granted or dialog may not appear
      console.log('Permission dialog not found or already handled');
    }
  });

  after(async () => {
    try {
      // Stop tuner if running
      await switchToWebView(driver);
      const playStop = await driver.$('[data-testid="tuner-play-stop"]');
      if (await playStop.isExisting()) {
        const text = await playStop.getText();
        if (text.includes('중지')) {
          await playStop.click();
        }
      }
    } catch {
      /* cleanup best effort */
    }

    try {
      await switchToNative(driver);
    } catch {
      /* already in native */
    }
  });
});
