import { describe, it, expect } from 'vitest';
import { TunerEngine } from './tuner-engine';
import {
  STANDARD_GUITAR_TUNING,
  DROP_D_GUITAR_TUNING,
  STANDARD_BASS_TUNING,
} from './tuning-presets';

function generateSineWave(
  frequency: number,
  sampleRate: number,
  bufferSize: number,
): Float32Array {
  const buffer = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    buffer[i] = 0.8 * Math.sin(2 * Math.PI * frequency * i / sampleRate);
  }
  return buffer;
}

describe('TunerEngine', () => {
  it('기본 프리셋은 Standard 기타', () => {
    const engine = new TunerEngine();
    expect(engine.getPreset()).toEqual(STANDARD_GUITAR_TUNING);
  });

  it('기본 기준 주파수는 440Hz', () => {
    const engine = new TunerEngine();
    expect(engine.getReferenceFrequency()).toBe(440);
  });

  it('프리셋 변경 가능', () => {
    const engine = new TunerEngine();
    engine.setPreset(STANDARD_BASS_TUNING);
    expect(engine.getPreset()).toEqual(STANDARD_BASS_TUNING);
  });

  it('기준 주파수 변경 가능', () => {
    const engine = new TunerEngine();
    engine.setReferenceFrequency(432);
    expect(engine.getReferenceFrequency()).toBe(432);
  });
});

describe('TunerEngine.processAudioData', () => {
  it('440Hz 신호 → A4 감지', () => {
    const engine = new TunerEngine({ sampleRate: 44100, bufferSize: 4096 });
    const signal = generateSineWave(440, 44100, 4096);
    const note = engine.processAudioData(signal);

    expect(note).not.toBeNull();
    expect(note!.name).toBe('A');
    expect(note!.octave).toBe(4);
  });

  it('무음 → null 반환', () => {
    const engine = new TunerEngine({ sampleRate: 44100, bufferSize: 4096 });
    const silence = new Float32Array(4096);
    const note = engine.processAudioData(silence);

    expect(note).toBeNull();
  });

  it('detectPitch는 Hz + confidence를 반환한다', () => {
    const engine = new TunerEngine({ sampleRate: 44100, bufferSize: 4096 });
    const signal = generateSineWave(329.63, 44100, 4096);
    const result = engine.detectPitch(signal);

    expect(result).not.toBeNull();
    expect(result!.frequency).toBeGreaterThan(320);
    expect(result!.frequency).toBeLessThan(338);
    expect(result!.confidence).toBeGreaterThan(0.6);
  });
});

describe('TunerEngine.findClosestString', () => {
  it('440Hz → Standard 기타에서 E4(329.63Hz)에 가까움', () => {
    const engine = new TunerEngine();
    engine.setPreset(STANDARD_GUITAR_TUNING);
    const closest = engine.findClosestString(330);

    expect(closest).not.toBeNull();
    expect(closest!.name).toBe('E');
    expect(closest!.octave).toBe(4);
  });

  it('110Hz → A2 줄에 매칭', () => {
    const engine = new TunerEngine();
    engine.setPreset(STANDARD_GUITAR_TUNING);
    const closest = engine.findClosestString(110);

    expect(closest).not.toBeNull();
    expect(closest!.name).toBe('A');
    expect(closest!.octave).toBe(2);
  });

  it('73Hz → Drop D에서 D2 줄에 매칭', () => {
    const engine = new TunerEngine();
    engine.setPreset(DROP_D_GUITAR_TUNING);
    const closest = engine.findClosestString(73);

    expect(closest).not.toBeNull();
    expect(closest!.name).toBe('D');
    expect(closest!.octave).toBe(2);
  });

  it('55Hz → 베이스 A1 줄에 매칭', () => {
    const engine = new TunerEngine();
    engine.setPreset(STANDARD_BASS_TUNING);
    const closest = engine.findClosestString(55);

    expect(closest).not.toBeNull();
    expect(closest!.name).toBe('A');
    expect(closest!.octave).toBe(1);
  });
});

describe('TunerEngine.getCentsFromTarget', () => {
  it('정확한 주파수 → 0 cents', () => {
    const engine = new TunerEngine();
    const target = STANDARD_GUITAR_TUNING.strings[1]; // A2 = 110Hz
    const cents = engine.getCentsFromTarget(110, target);
    expect(cents).toBe(0);
  });

  it('약간 높은 주파수 → 양수 cents', () => {
    const engine = new TunerEngine();
    const target = STANDARD_GUITAR_TUNING.strings[1]; // A2 = 110Hz
    const cents = engine.getCentsFromTarget(112, target);
    expect(cents).toBeGreaterThan(0);
  });

  it('약간 낮은 주파수 → 음수 cents', () => {
    const engine = new TunerEngine();
    const target = STANDARD_GUITAR_TUNING.strings[1]; // A2 = 110Hz
    const cents = engine.getCentsFromTarget(108, target);
    expect(cents).toBeLessThan(0);
  });

  it('setPitchDetectionConfig로 민감도 조정 가능', () => {
    const engine = new TunerEngine({ sampleRate: 44100, bufferSize: 4096 });
    engine.setPitchDetectionConfig({
      rmsThreshold: 0.03,
      probabilityThreshold: 0.25,
    });

    const weakSignal = generateSineWave(110, 44100, 4096).map((sample) => sample * 0.015);
    const result = engine.detectPitch(weakSignal);
    expect(result).toBeNull();
  });
});
