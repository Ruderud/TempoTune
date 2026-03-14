import {getWebViewOrigin, postBridgeMessage} from './bridge';

export type QaAudioSampleFormat = 'wav' | 'mp3';

type SetQaAudioSampleSourceOptions = {
  format?: QaAudioSampleFormat;
  loop?: boolean;
};

export async function setQaAudioSampleSource(
  driver: WebdriverIO.Browser,
  sampleId: string,
  options: SetQaAudioSampleSourceOptions = {},
): Promise<string> {
  const origin = await getWebViewOrigin(driver);
  const format = options.format ?? 'wav';
  const loop = options.loop ?? true;
  const url = `${origin}/qa-audio/${sampleId}.${format}`;

  await postBridgeMessage(driver, 'SET_QA_AUDIO_SAMPLE_SOURCE', {
    url,
    loop,
  });
  await driver.pause(250);

  return url;
}

export async function clearQaAudioSampleSource(
  driver: WebdriverIO.Browser,
): Promise<void> {
  await postBridgeMessage(driver, 'CLEAR_QA_AUDIO_SAMPLE_SOURCE');
  await driver.pause(150);
}
