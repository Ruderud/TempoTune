export type TimeSignature = [number, number];

export type MetronomeClickType = 'synthesized' | 'custom';

export type MetronomeConfig = {
  bpm: number;
  timeSignature: TimeSignature;
  accentFirst: boolean;
  subdivision: number;
  clickType: MetronomeClickType;
  customSoundUrl?: string;
};

export type MetronomeState = {
  isPlaying: boolean;
  currentBeat: number;
  currentSubdivision: number;
};

export type MetronomeEvent = {
  beatIndex: number;
  isAccent: boolean;
  timestamp: number;
  subdivision: number;
};
