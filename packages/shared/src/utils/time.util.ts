/** BPM을 밀리초 간격으로 변환 */
export function bpmToMs(bpm: number): number {
  return 60000 / bpm;
}

/** 밀리초를 샘플 수로 변환 */
export function msToSamples(ms: number, sampleRate: number): number {
  return Math.round((ms / 1000) * sampleRate);
}

/** 샘플 수를 밀리초로 변환 */
export function samplesToMs(samples: number, sampleRate: number): number {
  return (samples / sampleRate) * 1000;
}
