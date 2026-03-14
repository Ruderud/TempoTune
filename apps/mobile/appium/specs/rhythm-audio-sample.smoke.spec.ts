/**
 * rhythm-audio-sample.smoke.spec.ts
 * Verifies a QA rhythm sample can drive native rhythm-hit detection on device.
 */
import {acceptSystemAlertIfPresent} from '../helpers/alerts';
import {
  clearBridgeEvents,
  installBridgeProbe,
  postBridgeMessage,
  waitForBridgeEvent,
} from '../helpers/bridge';
import {switchToNative, switchToWebView} from '../helpers/contexts';
import {clearQaAudioSampleSource, setQaAudioSampleSource} from '../helpers/qa-audio';
import {waitForWebViewReady} from '../helpers/wait';

describe('Rhythm Audio Sample', () => {
  before(async () => {
    await acceptSystemAlertIfPresent(driver);
    await switchToWebView(driver, 20, 5000);
    await waitForWebViewReady(driver, 45000);
    await installBridgeProbe(driver);
  });

  it('emits RHYTHM_HIT_DETECTED from a QA rhythm sample while the metronome runs', async () => {
    const metronomeTab = await driver.$('[data-testid="tab-metronome"]');
    await metronomeTab.waitForDisplayed({timeout: 10000});
    await metronomeTab.click();

    await clearBridgeEvents(driver);
    await setQaAudioSampleSource(driver, 'rhythm_quarter_120bpm_on_time', {
      loop: true,
    });

    await postBridgeMessage(driver, 'START_NATIVE_METRONOME', {
      bpm: 120,
      beatsPerMeasure: 4,
      accentFirst: true,
    });
    await driver.pause(250);

    await postBridgeMessage(driver, 'START_AUDIO_CAPTURE', {
      deviceId: 'default',
      channelIndex: 0,
      enablePitch: false,
      enableRhythm: true,
    });

    await waitForBridgeEvent(driver, 'RHYTHM_HIT_DETECTED', 1, 15000);

    await postBridgeMessage(driver, 'STOP_AUDIO_CAPTURE');
    await postBridgeMessage(driver, 'STOP_NATIVE_METRONOME');
    await clearQaAudioSampleSource(driver);
  });

  after(async () => {
    try {
      await switchToWebView(driver);
      await postBridgeMessage(driver, 'STOP_AUDIO_CAPTURE');
      await postBridgeMessage(driver, 'STOP_NATIVE_METRONOME');
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
