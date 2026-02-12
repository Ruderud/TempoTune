import { describe, it, expect } from 'vitest';
import { frequencyToSemitones, frequencyToNote, noteToFrequency, centsFromPitch } from './frequency.util';

describe('frequencyToSemitones', () => {
  it('A4(440Hz)는 0 반음', () => {
    expect(frequencyToSemitones(440)).toBeCloseTo(0);
  });

  it('A5(880Hz)는 +12 반음', () => {
    expect(frequencyToSemitones(880)).toBeCloseTo(12);
  });

  it('A3(220Hz)는 -12 반음', () => {
    expect(frequencyToSemitones(220)).toBeCloseTo(-12);
  });
});

describe('frequencyToNote', () => {
  it('440Hz → A4, 0 cents', () => {
    const note = frequencyToNote(440);
    expect(note.name).toBe('A');
    expect(note.octave).toBe(4);
    expect(note.cents).toBe(0);
  });

  it('261.63Hz → C4 (middle C) 근접', () => {
    const note = frequencyToNote(261.63);
    expect(note.name).toBe('C');
    expect(note.octave).toBe(4);
    expect(Math.abs(note.cents)).toBeLessThanOrEqual(5);
  });

  it('82.41Hz → E2 (기타 6번줄)', () => {
    const note = frequencyToNote(82.41);
    expect(note.name).toBe('E');
    expect(note.octave).toBe(2);
  });

  it('커스텀 기준 주파수 사용', () => {
    // A4 = 432Hz 기준에서 432Hz는 A4
    const note = frequencyToNote(432, 432);
    expect(note.name).toBe('A');
    expect(note.octave).toBe(4);
    expect(note.cents).toBe(0);
  });
});

describe('noteToFrequency', () => {
  it('A4 → 440Hz', () => {
    expect(noteToFrequency('A', 4)).toBeCloseTo(440, 1);
  });

  it('C4 → ~261.63Hz', () => {
    expect(noteToFrequency('C', 4)).toBeCloseTo(261.63, 0);
  });

  it('E2 → ~82.41Hz (기타 6번줄)', () => {
    expect(noteToFrequency('E', 2)).toBeCloseTo(82.41, 0);
  });

  it('noteToFrequency ↔ frequencyToNote 라운드트립', () => {
    const freq = noteToFrequency('G', 3);
    const note = frequencyToNote(freq);
    expect(note.name).toBe('G');
    expect(note.octave).toBe(3);
    expect(Math.abs(note.cents)).toBeLessThanOrEqual(1);
  });
});

describe('centsFromPitch', () => {
  it('같은 주파수 → 0 cents', () => {
    expect(centsFromPitch(440, 440)).toBe(0);
  });

  it('한 반음 높은 주파수 → +100 cents', () => {
    const semitoneUp = 440 * Math.pow(2, 1 / 12);
    expect(centsFromPitch(semitoneUp, 440)).toBeCloseTo(100, 0);
  });

  it('한 반음 낮은 주파수 → -100 cents', () => {
    const semitoneDown = 440 * Math.pow(2, -1 / 12);
    expect(centsFromPitch(semitoneDown, 440)).toBeCloseTo(-100, 0);
  });

  it('한 옥타브 위 → +1200 cents', () => {
    expect(centsFromPitch(880, 440)).toBe(1200);
  });
});
