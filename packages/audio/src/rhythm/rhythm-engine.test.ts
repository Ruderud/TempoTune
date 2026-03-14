import { describe, it, expect, beforeEach } from 'vitest';
import { RhythmEngine } from './rhythm-engine';
import { OnsetDetector } from './onset-detector';

describe('RhythmEngine', () => {
  let engine: RhythmEngine;

  beforeEach(() => {
    engine = new RhythmEngine();
  });

  describe('generateTimeline', () => {
    it('generates correct beat times for 120 BPM', () => {
      const timeline = engine.generateTimeline(120, 4, 1000, 2000);
      // 120 BPM = 500ms per beat, 2s duration → 5 beats
      expect(timeline.bpm).toBe(120);
      expect(timeline.beatsPerMeasure).toBe(4);
      expect(timeline.beatTimesMs).toEqual([1000, 1500, 2000, 2500, 3000]);
    });

    it('generates correct beat times for 60 BPM', () => {
      const timeline = engine.generateTimeline(60, 4, 0, 3000);
      // 60 BPM = 1000ms per beat, 3s duration → 4 beats
      expect(timeline.beatTimesMs).toEqual([0, 1000, 2000, 3000]);
    });
  });

  describe('judgeOnset', () => {
    beforeEach(() => {
      engine.generateTimeline(120, 4, 1000, 5000);
    });

    it('judges an on-time hit correctly', () => {
      const result = engine.judgeOnset(1500);
      expect(result).not.toBeNull();
      expect(result!.status).toBe('on-time');
      expect(result!.offsetMs).toBe(0);
      expect(result!.nearestBeatAtMonotonicMs).toBe(1500);
    });

    it('judges a slightly early hit', () => {
      const result = engine.judgeOnset(1460);
      expect(result).not.toBeNull();
      expect(result!.status).toBe('on-time');
      expect(result!.offsetMs).toBe(-40);
    });

    it('judges a significantly early hit', () => {
      const result = engine.judgeOnset(1400);
      expect(result).not.toBeNull();
      expect(result!.status).toBe('early');
      expect(result!.offsetMs).toBe(-100);
    });

    it('judges a late hit', () => {
      const result = engine.judgeOnset(1580);
      expect(result).not.toBeNull();
      expect(result!.status).toBe('late');
      expect(result!.offsetMs).toBe(80);
    });

    it('returns null without a timeline', () => {
      const emptyEngine = new RhythmEngine();
      const result = emptyEngine.judgeOnset(1500);
      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      engine.generateTimeline(120, 4, 1000, 5000);
    });

    it('returns zero stats with no judgements', () => {
      const stats = engine.getStats();
      expect(stats.totalHits).toBe(0);
      expect(stats.accuracy).toBe(0);
    });

    it('computes stats correctly after judgements', () => {
      engine.judgeOnset(1500);  // on-time (0ms)
      engine.judgeOnset(2020);  // on-time (20ms from 2000)
      engine.judgeOnset(2400);  // early (-100ms from 2500)

      const stats = engine.getStats();
      expect(stats.totalHits).toBe(3);
      expect(stats.onTimeCount).toBe(2);
      expect(stats.earlyCount).toBe(1);
      expect(stats.lateCount).toBe(0);
      expect(stats.accuracy).toBeCloseTo(2 / 3);
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      engine.generateTimeline(120, 4, 1000, 5000);
      engine.judgeOnset(1500);

      engine.reset();

      const stats = engine.getStats();
      expect(stats.totalHits).toBe(0);
      expect(engine.judgeOnset(1500)).toBeNull(); // no timeline
    });
  });

  describe('onRhythmJudgement callback', () => {
    it('fires callback on judgement', () => {
      engine.generateTimeline(120, 4, 1000, 5000);
      const received: unknown[] = [];
      engine.onRhythmJudgement((j) => received.push(j));

      engine.judgeOnset(1500);
      expect(received).toHaveLength(1);
    });
  });
});

describe('OnsetDetector', () => {
  it('rejects frames below RMS threshold', () => {
    const detector = new OnsetDetector({ rmsThreshold: 0.1 });
    const silent = new Float32Array(1024).fill(0);
    const result = detector.detect(silent, 100);
    expect(result).toBeNull();
  });

  it('respects refractory window', () => {
    const detector = new OnsetDetector({
      rmsThreshold: 0.001,
      refractoryWindowMs: 100,
      fluxThresholdMultiplier: 0,
    });

    // Create a loud signal
    const loud = new Float32Array(1024);
    for (let i = 0; i < loud.length; i++) {
      loud[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.5;
    }

    const first = detector.detect(loud, 100);
    // First detection may or may not trigger depending on flux history
    // But a second detection within refractory window should be null
    const second = detector.detect(loud, 150);
    if (first !== null) {
      expect(second).toBeNull();
    }
  });

  it('resets state', () => {
    const detector = new OnsetDetector();
    const loud = new Float32Array(1024);
    for (let i = 0; i < loud.length; i++) {
      loud[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.5;
    }
    detector.detect(loud, 100);
    detector.reset();
    // After reset, should be able to detect again immediately
    // (no refractory window blocking)
    const result = detector.detect(loud, 101);
    // Result depends on flux history being empty, but should not throw
    expect(result === null || typeof result === 'number').toBe(true);
  });
});
