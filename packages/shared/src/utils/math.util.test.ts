import { describe, it, expect } from 'vitest';
import { clamp, lerp, dbToGain, gainToDb } from './math.util';

describe('clamp', () => {
  it('범위 내 값은 그대로 반환', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('최소값 미만이면 최소값 반환', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('최대값 초과하면 최대값 반환', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('경계값 정확히 반환', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('lerp', () => {
  it('t=0이면 a 반환', () => {
    expect(lerp(0, 100, 0)).toBe(0);
  });

  it('t=1이면 b 반환', () => {
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it('t=0.5이면 중간값 반환', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it('음수 범위에서도 동작', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });
});

describe('dbToGain / gainToDb', () => {
  it('0dB → gain 1.0', () => {
    expect(dbToGain(0)).toBeCloseTo(1.0);
  });

  it('-20dB → gain 0.1', () => {
    expect(dbToGain(-20)).toBeCloseTo(0.1);
  });

  it('+20dB → gain 10.0', () => {
    expect(dbToGain(20)).toBeCloseTo(10.0);
  });

  it('gain 1.0 → 0dB', () => {
    expect(gainToDb(1.0)).toBeCloseTo(0);
  });

  it('dbToGain ↔ gainToDb 라운드트립', () => {
    const db = -6;
    expect(gainToDb(dbToGain(db))).toBeCloseTo(db);
  });
});
