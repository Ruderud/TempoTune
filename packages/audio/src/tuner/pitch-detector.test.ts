import { describe, it, expect } from 'vitest';
import { PitchDetector } from './pitch-detector';

function generateSineWave(
  frequency: number,
  sampleRate: number,
  bufferSize: number,
  amplitude = 0.8,
): Float32Array {
  const buffer = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    buffer[i] = amplitude * Math.sin(2 * Math.PI * frequency * i / sampleRate);
  }
  return buffer;
}

describe('PitchDetector', () => {
  const sampleRate = 44100;
  const bufferSize = 4096;

  it('440Hz 사인파를 정확하게 감지', () => {
    const detector = new PitchDetector({ sampleRate, bufferSize });
    const signal = generateSineWave(440, sampleRate, bufferSize);
    const result = detector.detect(signal);

    expect(result).not.toBeNull();
    expect(result!.frequency).toBeCloseTo(440, 0);
    expect(result!.probability).toBeGreaterThan(0.9);
  });

  it('220Hz 사인파를 정확하게 감지', () => {
    const detector = new PitchDetector({ sampleRate, bufferSize });
    const signal = generateSineWave(220, sampleRate, bufferSize);
    const result = detector.detect(signal);

    expect(result).not.toBeNull();
    expect(result!.frequency).toBeCloseTo(220, 0);
  });

  it('82Hz(E2 기타 6번줄) 감지', () => {
    const detector = new PitchDetector({ sampleRate, bufferSize });
    const signal = generateSineWave(82.41, sampleRate, bufferSize);
    const result = detector.detect(signal);

    expect(result).not.toBeNull();
    expect(result!.frequency).toBeCloseTo(82.41, 0);
  });

  it('무음 신호에서는 null 반환', () => {
    const detector = new PitchDetector({ sampleRate, bufferSize });
    const silence = new Float32Array(bufferSize);
    const result = detector.detect(silence);

    expect(result).toBeNull();
  });

  it('노이즈 신호에서는 null 반환', () => {
    const detector = new PitchDetector({ sampleRate, bufferSize });
    const noise = new Float32Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
      noise[i] = (Math.random() - 0.5) * 0.1;
    }
    const result = detector.detect(noise);

    // 노이즈는 피치를 감지하지 못하거나 낮은 확률이어야 함
    if (result) {
      expect(result.probability).toBeLessThan(0.5);
    }
  });

  it('updateConfig로 설정 변경 가능', () => {
    const detector = new PitchDetector({ sampleRate, bufferSize });
    detector.updateConfig({ threshold: 0.2 });

    const signal = generateSineWave(440, sampleRate, bufferSize);
    const result = detector.detect(signal);

    expect(result).not.toBeNull();
  });
});
