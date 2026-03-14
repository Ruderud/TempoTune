/**
 * tuner-audio-input.smoke.spec.ts
 * Verifies the tuner can detect a real QA sample through the shared native audio-input path.
 */
import { acceptSystemAlertIfPresent } from '../helpers/alerts';
import {
  clearBridgeEvents,
  installBridgeProbe,
  waitForBridgeEvent,
  waitForBridgeEventMatching,
} from '../helpers/bridge';
import { switchToWebView, switchToNative } from '../helpers/contexts';
import { clearQaAudioSampleSource, setQaAudioSampleSource } from '../helpers/qa-audio';
import { waitForWebViewReady } from '../helpers/wait';

async function waitForNativeTunerReadout(
  driver: WebdriverIO.Browser,
  timeout = 20000,
): Promise<void> {
  await driver.waitUntil(
    async () => {
      const source = await driver.getPageSource();
      return (
        source.includes('value="E"') &&
        source.includes('value="2"') &&
        /value="8[1-4]\.\d Hz"/.test(source)
      );
    },
    {
      timeout,
      timeoutMsg: 'Expected tuner UI to render the E2 QA sample readout',
      interval: 500,
    },
  );
}

describe('Tuner Audio Input', () => {
  before(async () => {
    await acceptSystemAlertIfPresent(driver);
    await switchToWebView(driver, 20, 5000);
    await waitForWebViewReady(driver, 45000);
    await installBridgeProbe(driver);
  });

  it('detects an E2 tuner sample through the native capture path', async () => {
    const tunerTab = await driver.$('[data-testid="tab-tuner"]');
    await tunerTab.waitForDisplayed({ timeout: 10000 });
    await tunerTab.click();

    let playStop = await driver.$('[data-testid="tuner-play-stop"]');
    await playStop.waitForDisplayed({ timeout: 10000 });

    await clearBridgeEvents(driver);
    await setQaAudioSampleSource(driver, 'reference_e2_note', {loop: true});
    await playStop.click();

    await driver.waitUntil(
      async () => (await playStop.getText()).includes('중지'),
      {
        timeout: 10000,
        timeoutMsg: 'Tuner did not enter the listening state in time',
      },
    );

    await waitForBridgeEvent(driver, 'PITCH_DETECTED', 1, 15000);
    await waitForBridgeEventMatching(
      driver,
      'PITCH_DETECTED',
      (event) => {
        const payload = event.data as
          | {name?: string; octave?: number; frequency?: number}
          | undefined;
        if (!payload) return false;

        return (
          payload.name === 'E' &&
          payload.octave === 2 &&
          typeof payload.frequency === 'number' &&
          payload.frequency >= 81 &&
          payload.frequency <= 85
        );
      },
      20000,
    );

    await switchToNative(driver);
    await waitForNativeTunerReadout(driver, 20000);
  });

  after(async () => {
    try {
      await switchToWebView(driver);
      const playStop = await driver.$('[data-testid="tuner-play-stop"]');
      if (await playStop.isExisting()) {
        const text = await playStop.getText();
        if (text.includes('중지')) {
          await playStop.click();
        }
      }
      await clearQaAudioSampleSource(driver);
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
