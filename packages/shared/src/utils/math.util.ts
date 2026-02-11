/** 값을 min~max 범위로 제한 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 두 값 사이의 선형 보간 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** dB 값을 선형 gain으로 변환 */
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/** 선형 gain을 dB로 변환 */
export function gainToDb(gain: number): number {
  return 20 * Math.log10(gain);
}
