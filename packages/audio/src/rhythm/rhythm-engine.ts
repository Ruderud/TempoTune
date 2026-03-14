import type {
  BeatTimeline,
  RhythmJudgement,
  RhythmSessionStats,
  OnsetDetectorConfig,
} from './rhythm-engine.types';
import { OnsetDetector } from './onset-detector';

/** Threshold in ms: |offset| <= this → on-time */
const ON_TIME_THRESHOLD_MS = 50;

/**
 * Rhythm analysis engine.
 * Compares detected onsets against a beat timeline to produce judgements.
 */
export class RhythmEngine {
  private onsetDetector: OnsetDetector;
  private timeline: BeatTimeline | null = null;
  private judgements: RhythmJudgement[] = [];
  private onJudgement: ((j: RhythmJudgement) => void) | null = null;

  constructor(onsetConfig?: Partial<OnsetDetectorConfig>) {
    this.onsetDetector = new OnsetDetector(onsetConfig);
  }

  /**
   * Set the beat timeline for comparison.
   * Call this when metronome starts or BPM changes.
   */
  setTimeline(timeline: BeatTimeline): void {
    this.timeline = timeline;
  }

  /**
   * Generate a beat timeline from BPM, time signature, and session start time.
   */
  generateTimeline(
    bpm: number,
    beatsPerMeasure: number,
    startAtMonotonicMs: number,
    durationMs: number,
  ): BeatTimeline {
    const beatIntervalMs = 60000 / bpm;
    const beatCount = Math.ceil(durationMs / beatIntervalMs) + 1;
    const beatTimesMs: number[] = [];

    for (let i = 0; i < beatCount; i++) {
      beatTimesMs.push(startAtMonotonicMs + i * beatIntervalMs);
    }

    const timeline: BeatTimeline = { bpm, beatsPerMeasure, beatTimesMs };
    this.timeline = timeline;
    return timeline;
  }

  /**
   * Register a callback for real-time judgement events.
   */
  onRhythmJudgement(callback: (j: RhythmJudgement) => void): () => void {
    this.onJudgement = callback;
    return () => {
      this.onJudgement = null;
    };
  }

  /**
   * Process an audio frame. If an onset is detected, compare it to the timeline.
   */
  processFrame(timeDomainData: Float32Array, nowMonotonicMs: number): RhythmJudgement | null {
    const onsetMs = this.onsetDetector.detect(timeDomainData, nowMonotonicMs);
    if (onsetMs === null) return null;

    return this.judgeOnset(onsetMs);
  }

  /**
   * Judge a pre-detected onset timestamp against the beat timeline.
   * Useful for native-side onset detection where only the timestamp is sent.
   */
  judgeOnset(onsetAtMonotonicMs: number): RhythmJudgement | null {
    if (!this.timeline || this.timeline.beatTimesMs.length === 0) return null;

    const nearestBeat = this.findNearestBeat(onsetAtMonotonicMs);
    if (nearestBeat === null) return null;

    const offsetMs = onsetAtMonotonicMs - nearestBeat;
    const absOffset = Math.abs(offsetMs);

    const status =
      absOffset <= ON_TIME_THRESHOLD_MS
        ? 'on-time'
        : offsetMs < 0
          ? 'early'
          : 'late';

    // Confidence decays as offset increases (max 200ms window)
    const confidence = Math.max(0, 1 - absOffset / 200);

    const judgement: RhythmJudgement = {
      detectedAtMonotonicMs: onsetAtMonotonicMs,
      nearestBeatAtMonotonicMs: nearestBeat,
      offsetMs,
      status,
      confidence,
      source: 'unknown',
    };

    this.judgements.push(judgement);
    this.onJudgement?.(judgement);

    return judgement;
  }

  /**
   * Get session statistics.
   */
  getStats(): RhythmSessionStats {
    const total = this.judgements.length;
    if (total === 0) {
      return {
        totalHits: 0,
        onTimeCount: 0,
        earlyCount: 0,
        lateCount: 0,
        meanOffsetMs: 0,
        accuracy: 0,
      };
    }

    let onTime = 0;
    let early = 0;
    let late = 0;
    let totalOffset = 0;

    for (const j of this.judgements) {
      totalOffset += j.offsetMs;
      if (j.status === 'on-time') onTime++;
      else if (j.status === 'early') early++;
      else late++;
    }

    return {
      totalHits: total,
      onTimeCount: onTime,
      earlyCount: early,
      lateCount: late,
      meanOffsetMs: totalOffset / total,
      accuracy: onTime / total,
    };
  }

  /**
   * Reset engine state for a new session.
   */
  reset(): void {
    this.onsetDetector.reset();
    this.judgements = [];
    this.timeline = null;
  }

  private findNearestBeat(onsetMs: number): number | null {
    if (!this.timeline) return null;
    const beats = this.timeline.beatTimesMs;

    let nearest = beats[0];
    let minDist = Math.abs(onsetMs - nearest);

    for (let i = 1; i < beats.length; i++) {
      const dist = Math.abs(onsetMs - beats[i]);
      if (dist < minDist) {
        minDist = dist;
        nearest = beats[i];
      } else {
        // Beats are sorted, so distance will only increase from here
        break;
      }
    }

    return nearest;
  }
}
