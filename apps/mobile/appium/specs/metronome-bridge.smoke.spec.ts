/**
 * metronome-bridge.smoke.spec.ts
 * Verifies the metronome native bridge start/stop works.
 */
import { acceptSystemAlertIfPresent } from '../helpers/alerts';
import { switchToWebView, switchToNative } from '../helpers/contexts';
import { waitForWebViewReady } from '../helpers/wait';

describe('Metronome Bridge', () => {
  before(async () => {
    await acceptSystemAlertIfPresent(driver);
    await switchToWebView(driver, 20, 5000);
    await waitForWebViewReady(driver, 45000);
  });

  it('should find the metronome play/stop button', async () => {
    // Navigate to metronome (default page)
    const playStop = await driver.$('[data-testid="metronome-play-stop"]');
    await playStop.waitForDisplayed({ timeout: 10000 });
    expect(await playStop.isDisplayed()).toBe(true);
  });

  it('should start the metronome', async () => {
    const playStop = await driver.$('[data-testid="metronome-play-stop"]');
    await playStop.click();

    // Button text should change to 정지 (stop)
    await driver.pause(1000);
    const text = await playStop.getText();
    expect(text).toContain('정지');
  });

  it('should stop the metronome', async () => {
    const playStop = await driver.$('[data-testid="metronome-play-stop"]');
    await playStop.click();

    await driver.pause(500);
    const text = await playStop.getText();
    expect(text).toContain('시작');
  });

  after(async () => {
    try {
      await switchToNative(driver);
    } catch {
      /* already in native */
    }
  });
});
