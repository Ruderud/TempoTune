import type { TimeSignature, MetronomeEvent } from '@tempo-tune/shared/types';

export type MetronomeEngineConfig = {
  bpm: number;
  timeSignature: TimeSignature;
  accentFirst: boolean;
  subdivision: number;
};

export type MetronomeTickCallback = (event: MetronomeEvent) => void;

export type SchedulerConfig = {
  lookaheadMs: number;
  scheduleAheadMs: number;
};

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  lookaheadMs: 25,
  scheduleAheadMs: 100,
};
