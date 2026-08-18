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

  it('detects representative bass, guitar, and reference notes through the native capture path', async () => {
    const tunerTab = await driver.$('[data-testid="tab-tuner"]');
    await tunerTab.waitForDisplayed({ timeout: 10000 });
    await tunerTab.click();

    let playStop = await driver.$('[data-testid="tuner-play-stop"]');
    await playStop.waitForDisplayed({ timeout: 10000 });

    const fixtures = [
      {id: 'bass_open_e1_note', name: 'E', octave: 1, frequency: 41.2},
      {id: 'guitar_open_a2_note', name: 'A', octave: 2, frequency: 110},
      {id: 'guitar_open_d3_note', name: 'D', octave: 3, frequency: 146.83},
      {id: 'reference_c5_note', name: 'C', octave: 5, frequency: 523.251},
      {id: 'guitar_open_e2_note', name: 'E', octave: 2, frequency: 82.41},
    ];

    for (const fixture of fixtures) {
      if ((await playStop.getText()).includes('중지')) {
        await playStop.click();
        await driver.waitUntil(async () => !(await playStop.getText()).includes('중지'), {timeout: 10000});
      }

      await clearBridgeEvents(driver);
      await setQaAudioSampleSource(driver, fixture.id, {loop: true});
      await playStop.click();
      await driver.waitUntil(
        async () => (await playStop.getText()).includes('중지'),
        {
          timeout: 10000,
          timeoutMsg: `Tuner did not start for ${fixture.id}`,
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
          if (!payload || typeof payload.frequency !== 'number') return false;

          const errorCents = Math.abs(1200 * Math.log2(payload.frequency / fixture.frequency));
          return payload.name === fixture.name && payload.octave === fixture.octave && errorCents <= 5;
        },
        20000,
      );
    }

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
