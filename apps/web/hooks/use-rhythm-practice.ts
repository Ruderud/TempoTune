'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { RhythmHitEvent } from '@tempo-tune/shared/types';
import { RhythmEngine, type RhythmSessionStats, type RhythmJudgement } from '@tempo-tune/audio/rhythm';
import type { AudioFrameConsumer } from '@tempo-tune/audio-input';
import { getAudioInputBridge } from '../services/audio-input';

const EMPTY_STATS: RhythmSessionStats = {
  totalHits: 0,
  onTimeCount: 0,
  earlyCount: 0,
  lateCount: 0,
  meanOffsetMs: 0,
  accuracy: 0,
};

function accumulateStats(prev: RhythmSessionStats, hit: RhythmHitEvent): RhythmSessionStats {
  const totalHits = prev.totalHits + 1;
  const onTimeCount = prev.onTimeCount + (hit.status === 'on-time' ? 1 : 0);
  const earlyCount = prev.earlyCount + (hit.status === 'early' ? 1 : 0);
  const lateCount = prev.lateCount + (hit.status === 'late' ? 1 : 0);
  const meanOffsetMs = ((prev.meanOffsetMs * prev.totalHits) + hit.offsetMs) / totalHits;

  return {
    totalHits,
    onTimeCount,
    earlyCount,
    lateCount,
    meanOffsetMs,
    accuracy: onTimeCount / totalHits,
  };
}

/**
 * Hook for rhythm practice.
 * Uses the singleton AudioInputBridge facade — does NOT create its own session.
 */
export function useRhythmPractice() {
  const [isActive, setIsActive] = useState(false);
  const [latestHit, setLatestHit] = useState<RhythmHitEvent | null>(null);
  const [stats, setStats] = useState<RhythmSessionStats>(EMPTY_STATS);

  const engineRef = useRef<RhythmEngine | null>(null);
  const removeConsumerRef = useRef<(() => void) | null>(null);
  const removeNativeRhythmRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    engineRef.current = new RhythmEngine();
    return () => {
      engineRef.current?.reset();
    };
  }, []);

  const startPractice = useCallback(
    (bpm: number, beatsPerMeasure: number) => {
      const engine = engineRef.current;
      if (!engine) return;

      removeConsumerRef.current?.();
      removeConsumerRef.current = null;
      removeNativeRhythmRef.current?.();
      removeNativeRhythmRef.current = null;
      engine.reset();
      setLatestHit(null);
      setStats(EMPTY_STATS);
      const startMs = performance.now();
      engine.generateTimeline(bpm, beatsPerMeasure, startMs, 300_000);

      engine.onRhythmJudgement((j: RhythmJudgement) => {
        setLatestHit({
          detectedAtMonotonicMs: j.detectedAtMonotonicMs,
          nearestBeatAtMonotonicMs: j.nearestBeatAtMonotonicMs,
          offsetMs: j.offsetMs,
          status: j.status,
          confidence: j.confidence,
          source: j.source,
        });
        setStats(engine.getStats());
      });

      // Subscribe to audio frames via the shared facade
      const bridge = getAudioInputBridge();
      if (bridge.addFrameConsumer) {
        const consumer: AudioFrameConsumer = (timeDomainData) => {
          engine.processFrame(timeDomainData, performance.now());
        };
        removeConsumerRef.current = bridge.addFrameConsumer(consumer);
      } else {
        void bridge.configureAnalyzers({
          enablePitch: true,
          enableRhythm: true,
        });
        removeNativeRhythmRef.current = bridge.onRhythmHitDetected((event) => {
          setLatestHit(event);
          setStats((prev) => accumulateStats(prev, event));
        });
      }

      setIsActive(true);
    },
    [],
  );

  const stopPractice = useCallback(() => {
    removeConsumerRef.current?.();
    removeConsumerRef.current = null;
    removeNativeRhythmRef.current?.();
    removeNativeRhythmRef.current = null;
    void getAudioInputBridge().configureAnalyzers({
      enablePitch: true,
      enableRhythm: false,
    });
    setIsActive(false);
  }, []);

  const resetStats = useCallback(() => {
    engineRef.current?.reset();
    setLatestHit(null);
    setStats(EMPTY_STATS);
  }, []);

  return {
    isActive,
    latestHit,
    stats,
    startPractice,
    stopPractice,
    resetStats,
  };
}
