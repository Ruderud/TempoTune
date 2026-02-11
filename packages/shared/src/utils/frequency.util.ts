import { A4_FREQUENCY, NOTE_NAMES, SEMITONE_RATIO, CENTS_PER_SEMITONE } from '../constants';
import type { NoteName, TunerNote } from '../types';

/** A4 기준 반음 수 계산 */
export function frequencyToSemitones(frequency: number): number {
  return 12 * Math.log2(frequency / A4_FREQUENCY);
}

/** 주파수를 음계 정보로 변환 */
export function frequencyToNote(frequency: number, referenceFrequency = A4_FREQUENCY): TunerNote {
  const semitones = 12 * Math.log2(frequency / referenceFrequency);
  const roundedSemitones = Math.round(semitones);
  const cents = Math.round((semitones - roundedSemitones) * CENTS_PER_SEMITONE);

  // A4 = MIDI 69, 기준으로 계산
  const midiNote = 69 + roundedSemitones;
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = ((midiNote % 12) + 12) % 12;
  const name = NOTE_NAMES[noteIndex];

  return { frequency, name, octave, cents };
}

/** 음계 이름과 옥타브에서 주파수 계산 */
export function noteToFrequency(name: NoteName, octave: number, referenceFrequency = A4_FREQUENCY): number {
  const noteIndex = NOTE_NAMES.indexOf(name);
  const midiNote = (octave + 1) * 12 + noteIndex;
  const semitonesFromA4 = midiNote - 69;
  return referenceFrequency * Math.pow(SEMITONE_RATIO, semitonesFromA4);
}

/** 두 주파수 간 cents 차이 계산 */
export function centsFromPitch(frequency: number, targetFrequency: number): number {
  return Math.round(1200 * Math.log2(frequency / targetFrequency));
}
