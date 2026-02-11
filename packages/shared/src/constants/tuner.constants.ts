import type { NoteName, TuningPreset } from '../types';

export const A4_FREQUENCY = 440;
export const SEMITONE_RATIO = Math.pow(2, 1 / 12);
export const CENTS_PER_SEMITONE = 100;

export const NOTE_NAMES: NoteName[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

export const STANDARD_GUITAR_TUNING: TuningPreset = {
  name: 'Standard',
  instrument: 'guitar',
  strings: [
    { name: 'E', octave: 2, frequency: 82.41 },
    { name: 'A', octave: 2, frequency: 110.0 },
    { name: 'D', octave: 3, frequency: 146.83 },
    { name: 'G', octave: 3, frequency: 196.0 },
    { name: 'B', octave: 3, frequency: 246.94 },
    { name: 'E', octave: 4, frequency: 329.63 },
  ],
};

export const DROP_D_GUITAR_TUNING: TuningPreset = {
  name: 'Drop D',
  instrument: 'guitar',
  strings: [
    { name: 'D', octave: 2, frequency: 73.42 },
    { name: 'A', octave: 2, frequency: 110.0 },
    { name: 'D', octave: 3, frequency: 146.83 },
    { name: 'G', octave: 3, frequency: 196.0 },
    { name: 'B', octave: 3, frequency: 246.94 },
    { name: 'E', octave: 4, frequency: 329.63 },
  ],
};

export const STANDARD_BASS_TUNING: TuningPreset = {
  name: 'Standard',
  instrument: 'bass',
  strings: [
    { name: 'E', octave: 1, frequency: 41.2 },
    { name: 'A', octave: 1, frequency: 55.0 },
    { name: 'D', octave: 2, frequency: 73.42 },
    { name: 'G', octave: 2, frequency: 98.0 },
  ],
};

export const ALL_TUNING_PRESETS: TuningPreset[] = [
  STANDARD_GUITAR_TUNING,
  DROP_D_GUITAR_TUNING,
  STANDARD_BASS_TUNING,
];
