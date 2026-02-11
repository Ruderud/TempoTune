export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type InstrumentType = 'guitar' | 'bass';

export type TunerNote = {
  frequency: number;
  name: NoteName;
  octave: number;
  cents: number;
};

export type TuningString = {
  name: NoteName;
  octave: number;
  frequency: number;
};

export type TuningPreset = {
  name: string;
  instrument: InstrumentType;
  strings: TuningString[];
};

export type TunerConfig = {
  referenceFrequency: number;
  tolerance: number;
  instrument: InstrumentType;
  selectedPreset: string;
};

export type TunerState = {
  isListening: boolean;
  detectedNote: TunerNote | null;
  targetString: TuningString | null;
};
