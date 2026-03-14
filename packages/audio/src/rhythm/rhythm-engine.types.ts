import type { RhythmHitStatus, RhythmHitSource } from '@tempo-tune/shared/types';

export type OnsetDetectorConfig = {
  /** RMS threshold to consider a frame as a potential onset */
  rmsThreshold: number;
  /** Spectral flux threshold multiplier over adaptive mean */
  fluxThresholdMultiplier: number;
  /** Minimum time between consecutive onsets (ms) */
  refractoryWindowMs: number;
  /** Number of frames for adaptive threshold averaging */
  adaptiveWindowSize: number;
};

export type BeatTimeline = {
  bpm: number;
  beatsPerMeasure: number;
  /** Monotonic timestamps (ms) of expected beats */
  beatTimesMs: number[];
};

export type RhythmJudgement = {
  detectedAtMonotonicMs: number;
  nearestBeatAtMonotonicMs: number;
  offsetMs: number;
  status: RhythmHitStatus;
  confidence: number;
  source: RhythmHitSource;
};

export type RhythmSessionStats = {
  totalHits: number;
  onTimeCount: number;
  earlyCount: number;
  lateCount: number;
  meanOffsetMs: number;
  accuracy: number;
};

export const DEFAULT_ONSET_CONFIG: OnsetDetectorConfig = {
  rmsThreshold: 0.02,
  fluxThresholdMultiplier: 1.5,
  refractoryWindowMs: 80,
  adaptiveWindowSize: 10,
};
