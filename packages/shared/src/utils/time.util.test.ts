import { describe, it, expect } from 'vitest';
import { bpmToMs, msToSamples, samplesToMs } from './time.util';

describe('bpmToMs', () => {
  it('120 BPM → 500ms', () => {
    expect(bpmToMs(120)).toBe(500);
  });

  it('60 BPM → 1000ms', () => {
    expect(bpmToMs(60)).toBe(1000);
  });

  it('240 BPM → 250ms', () => {
    expect(bpmToMs(240)).toBe(250);
  });
});

describe('msToSamples', () => {
  it('1000ms at 44100Hz → 44100 samples', () => {
    expect(msToSamples(1000, 44100)).toBe(44100);
  });

  it('500ms at 44100Hz → 22050 samples', () => {
    expect(msToSamples(500, 44100)).toBe(22050);
  });

  it('반올림 처리', () => {
    // 1ms at 44100Hz = 44.1 → 44
    expect(msToSamples(1, 44100)).toBe(44);
  });
});

describe('samplesToMs', () => {
  it('44100 samples at 44100Hz → 1000ms', () => {
    expect(samplesToMs(44100, 44100)).toBe(1000);
  });

  it('22050 samples at 44100Hz → 500ms', () => {
    expect(samplesToMs(22050, 44100)).toBe(500);
  });

  it('msToSamples ↔ samplesToMs 라운드트립 (정수 ms)', () => {
    const ms = 500;
    const samples = msToSamples(ms, 44100);
    expect(samplesToMs(samples, 44100)).toBeCloseTo(ms, 1);
  });
});
