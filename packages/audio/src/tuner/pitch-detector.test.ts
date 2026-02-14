import { describe, it, expect } from 'vitest';
import { PitchDetector } from './pitch-detector';

type WaveOptions = {
  phase?: number;
  amplitude?: number;
};

function createSeededRandom(seed = 12345): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function generateSineWave(
  frequency: number,
  sampleRate: number,
  bufferSize: number,
  options: WaveOptions = {},
): Float32Array {
  const phase = options.phase ?? 0;
  const amplitude = options.amplitude ?? 0.8;
  const out = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    out[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate + phase);
  }
  return out;
}

function generateSawtoothLikeWave(
  fundamental: number,
  sampleRate: number,
  bufferSize: number,
  harmonics = 8,
  options: WaveOptions = {},
): Float32Array {
  const phase = options.phase ?? 0;
  const amplitude = options.amplitude ?? 0.8;
  const out = new Float32Array(bufferSize);

  for (let i = 0; i < bufferSize; i++) {
    let value = 0;
    for (let h = 1; h <= harmonics; h++) {
      value += Math.sin((2 * Math.PI * fundamental * h * i) / sampleRate + phase) / h;
    }
    out[i] = amplitude * (value / Math.log(harmonics + 1));
  }

  return out;
}

function generateMissingFundamentalWave(
  fundamental: number,
  sampleRate: number,
  bufferSize: number,
  options: WaveOptions = {},
): Float32Array {
  const phase = options.phase ?? 0;
  const amplitude = options.amplitude ?? 0.85;
  const out = new Float32Array(bufferSize);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / sampleRate;
    // intentionally omit the fundamental and boost harmonics
    const h2 = Math.sin(2 * Math.PI * (fundamental * 2) * t + phase) * 0.9;
    const h3 = Math.sin(2 * Math.PI * (fundamental * 3) * t + phase) * 0.7;
    const h4 = Math.sin(2 * Math.PI * (fundamental * 4) * t + phase) * 0.5;
    out[i] = amplitude * ((h2 + h3 + h4) / 2.1);
  }

  return out;
}

function addNoise(
  signal: Float32Array,
  noiseLevel: number,
  seed = 999,
): Float32Array {
  const rng = createSeededRandom(seed);
  const out = new Float32Array(signal.length);
  for (let i = 0; i < signal.length; i++) {
    const noise = (rng() * 2 - 1) * noiseLevel;
    out[i] = signal[i] + noise;
  }
  return out;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

describe('PitchDetector (Hybrid YIN)', () => {
  const sampleRate = 44100;
  const bufferSize = 2048;

  it('sine 440Hz를 안정적으로 감지한다', () => {
    const detector = new PitchDetector({ sampleRate, bufferSize });
    const signal = generateSineWave(440, sampleRate, bufferSize);
    const result = detector.detect(signal);

    expect(result).not.toBeNull();
    expect(result!.frequency).toBeGreaterThan(438);
    expect(result!.frequency).toBeLessThan(442);
    expect(result!.confidence).toBeGreaterThan(0.7);
  });

  it('무음/저레벨 입력은 RMS gate로 차단한다', () => {
    const detector = new PitchDetector({
      sampleRate,
      bufferSize,
      rmsThreshold: 0.03,
    });

    const silence = new Float32Array(bufferSize);
    expect(detector.detect(silence)).toBeNull();

    const lowLevel = generateSineWave(440, sampleRate, bufferSize, { amplitude: 0.01 });
    expect(detector.detect(lowLevel)).toBeNull();
  });

  it('배음이 강한 톱니파에서도 옥타브 오류를 줄인다', () => {
    const detector = new PitchDetector({ sampleRate, bufferSize, minFrequency: 70, maxFrequency: 500 });
    const signal = generateSawtoothLikeWave(110, sampleRate, bufferSize, 10);
    const result = detector.detect(signal);

    expect(result).not.toBeNull();
    expect(result!.frequency).toBeGreaterThan(100);
    expect(result!.frequency).toBeLessThan(122);
  });

  it('missing fundamental 케이스에서 f0/2f0 점프를 억제한다', () => {
    const detector = new PitchDetector({
      sampleRate,
      bufferSize,
      minFrequency: 70,
      maxFrequency: 500,
      octaveSimilarityTolerance: 0.12,
    });

    const signal = generateMissingFundamentalWave(110, sampleRate, bufferSize);
    const result = detector.detect(signal);

    expect(result).not.toBeNull();
    expect(result!.frequency).toBeGreaterThan(95);
    expect(result!.frequency).toBeLessThan(130);
  });

  it('노이즈가 섞여도 confidence 기반으로 안정적인 추정을 유지한다', () => {
    const detector = new PitchDetector({
      sampleRate,
      bufferSize,
      rmsThreshold: 0.01,
      probabilityThreshold: 0.25,
    });

    const clean = generateSineWave(196, sampleRate, bufferSize, { amplitude: 0.7 });
    const noisy = addNoise(clean, 0.08);
    const result = detector.detect(noisy);

    expect(result).not.toBeNull();
    expect(result!.frequency).toBeGreaterThan(186);
    expect(result!.frequency).toBeLessThan(206);
    expect(result!.confidence).toBeGreaterThan(0.3);
  });

  it('연속 프레임에서 jitter를 완화한다', () => {
    const detector = new PitchDetector({
      sampleRate,
      bufferSize,
      smoothingAlpha: 0.2,
      medianWindowSize: 5,
    });

    const estimates: number[] = [];
    const rng = createSeededRandom(2026);

    for (let frame = 0; frame < 40; frame++) {
      const phase = rng() * 2 * Math.PI;
      const noisy = addNoise(
        generateSineWave(146.83, sampleRate, bufferSize, { phase, amplitude: 0.75 }),
        0.05,
        frame + 1,
      );
      const result = detector.detect(noisy);
      if (result) estimates.push(result.frequency);
    }

    expect(estimates.length).toBeGreaterThan(20);
    const deviation = stdDev(estimates);
    expect(deviation).toBeLessThan(4.5);
  });
});
