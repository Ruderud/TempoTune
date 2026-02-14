export type YinConfig = {
  // YIN core
  threshold: number;
  probabilityThreshold: number;
  sampleRate: number;
  bufferSize: number;
  // Frequency range guard
  minFrequency: number;
  maxFrequency: number;
  // Energy gate
  rmsThreshold: number;
  // Complexity/latency tradeoff
  differenceStep: number;
  // Temporal stability
  smoothingAlpha: number;
  medianWindowSize: number;
  maxJumpCents: number;
  // Dropout handling
  silenceHoldFrames: number;
  // Octave error guard
  octaveSimilarityTolerance: number;
  harmonicThreshold: number;
  // Debug
  debug: boolean;
};

export type PitchCandidateDebug = {
  frequency: number;
  lag: number;
  yinScore: number;
  periodicity: number;
  harmonicScore: number;
  continuityPenalty: number;
  score: number;
};

export type PitchDetectionDebug = {
  rms: number;
  gatePassed: boolean;
  chosenLag: number;
  rawFrequency: number;
  smoothedFrequency: number;
  confidence: number;
  candidates: PitchCandidateDebug[];
};

export type PitchDetectionResult = {
  frequency: number;
  rawFrequency: number;
  smoothedFrequency: number;
  confidence: number;
  probability: number;
  rms: number;
  lag: number;
  debug?: PitchDetectionDebug;
} | null;

export type TunerEngineConfig = {
  sampleRate: number;
  bufferSize: number;
  referenceFrequency: number;
  minFrequency: number;
  maxFrequency: number;
};
