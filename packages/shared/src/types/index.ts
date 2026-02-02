// Metronome types
export type MetronomeConfig = {
  bpm: number;
  timeSignature: [number, number];
  enabled: boolean;
};

// Tuner types
export type TunerNote = {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
};

export type TunerConfig = {
  referenceFrequency: number;
  tolerance: number;
};
