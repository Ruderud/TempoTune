export type RhythmHitStatus = 'early' | 'on-time' | 'late';

export type RhythmHitSource = 'pick-attack' | 'clap' | 'pluck' | 'unknown';

export type RhythmHitEvent = {
  detectedAtMonotonicMs: number;
  nearestBeatAtMonotonicMs: number;
  offsetMs: number;
  status: RhythmHitStatus;
  confidence: number;
  source: RhythmHitSource;
};
