export type YinConfig = {
  threshold: number;
  probabilityThreshold: number;
  sampleRate: number;
  bufferSize: number;
};

export type PitchDetectionResult = {
  frequency: number;
  probability: number;
} | null;

export type TunerEngineConfig = {
  sampleRate: number;
  bufferSize: number;
  referenceFrequency: number;
};
