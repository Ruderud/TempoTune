import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetronomeEngine } from './metronome-engine';
import type { MetronomeEvent } from '@tempo-tune/shared/types';

describe('MetronomeEngine beat timing', () => {
  let engine: MetronomeEngine;
  let events: { event: MetronomeEvent; callbackTime: number }[];
  let mockNow: number;

  beforeEach(() => {
    vi.useFakeTimers();
    mockNow = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => mockNow);

    events = [];
    engine = new MetronomeEngine({ bpm: 120, subdivision: 1 });
    engine.onTick((event: MetronomeEvent) => {
      events.push({ event, callbackTime: mockNow });
    });
  });

  afterEach(() => {
    engine.dispose();
    vi.useRealTimers();
  });

  function advanceTime(ms: number) {
    mockNow += ms;
    vi.advanceTimersByTime(ms);
  }

  it('첫 번째~두 번째 박자 간격과 이후 박자 간격이 동일해야 한다', () => {
    // 120 BPM = 500ms per beat
    const expectedInterval = 500;

    engine.start();

    // 2000ms(4 beats worth) 동안 시뮬레이션 - 1ms 단위로 진행
    for (let i = 0; i < 2000; i++) {
      advanceTime(1);
    }

    // 메인 비트만 필터링 (subdivision === 0)
    const mainBeats = events.filter((e) => e.event.subdivision === 0);

    console.log('=== Beat Timing Analysis ===');
    console.log(`BPM: 120, Expected interval: ${expectedInterval}ms\n`);

    console.log('--- Event timestamps (engine scheduled times) ---');
    for (let i = 0; i < mainBeats.length; i++) {
      console.log(
        `Beat ${mainBeats[i].event.beatIndex}: timestamp=${mainBeats[i].event.timestamp.toFixed(1)}ms, callback fired at=${mainBeats[i].callbackTime}ms`,
      );
    }

    // 콜백이 실제로 호출된 시점 기준 간격 분석
    console.log('\n--- Callback timing intervals (what UI actually sees) ---');
    const callbackIntervals: number[] = [];
    for (let i = 1; i < mainBeats.length; i++) {
      const interval = mainBeats[i].callbackTime - mainBeats[i - 1].callbackTime;
      callbackIntervals.push(interval);
      console.log(`Beat ${i - 1} → ${i}: ${interval}ms`);
    }

    // 엔진이 스케줄한 timestamp 기준 간격 분석
    console.log('\n--- Scheduled timestamp intervals (engine internal) ---');
    const scheduledIntervals: number[] = [];
    for (let i = 1; i < mainBeats.length; i++) {
      const interval = mainBeats[i].event.timestamp - mainBeats[i - 1].event.timestamp;
      scheduledIntervals.push(interval);
      console.log(`Beat ${i - 1} → ${i}: ${interval.toFixed(1)}ms`);
    }

    // 검증: 콜백 간격이 모두 동일해야 함
    console.log('\n--- Verification ---');
    const firstCallbackInterval = callbackIntervals[0];
    const restCallbackIntervals = callbackIntervals.slice(1);

    if (restCallbackIntervals.length > 0) {
      const avgRest =
        restCallbackIntervals.reduce((a, b) => a + b, 0) / restCallbackIntervals.length;
      const diff = Math.abs(firstCallbackInterval - avgRest);
      console.log(`First interval: ${firstCallbackInterval}ms`);
      console.log(`Average subsequent intervals: ${avgRest}ms`);
      console.log(`Difference: ${diff}ms`);

      // 25ms 이상 차이나면 타이밍 문제
      expect(diff).toBeLessThan(25);
    }
  });

  it('스케줄된 timestamp 간격은 정확히 beatInterval이어야 한다', () => {
    const expectedInterval = 500; // 120 BPM

    engine.start();

    for (let i = 0; i < 2500; i++) {
      advanceTime(1);
    }

    const mainBeats = events.filter((e) => e.event.subdivision === 0);

    for (let i = 1; i < mainBeats.length; i++) {
      const interval = mainBeats[i].event.timestamp - mainBeats[i - 1].event.timestamp;
      expect(interval).toBeCloseTo(expectedInterval, 1);
    }
  });

  it('60 BPM에서 콜백 간격 일관성 테스트', () => {
    engine.dispose();
    engine = new MetronomeEngine({ bpm: 60, subdivision: 1 });
    events = [];
    engine.onTick((event: MetronomeEvent) => {
      events.push({ event, callbackTime: mockNow });
    });

    const expectedInterval = 1000; // 60 BPM = 1000ms

    engine.start();

    for (let i = 0; i < 4000; i++) {
      advanceTime(1);
    }

    const mainBeats = events.filter((e) => e.event.subdivision === 0);
    const callbackIntervals: number[] = [];
    for (let i = 1; i < mainBeats.length; i++) {
      callbackIntervals.push(mainBeats[i].callbackTime - mainBeats[i - 1].callbackTime);
    }

    console.log('\n=== 60 BPM Callback Intervals ===');
    callbackIntervals.forEach((interval, i) => {
      console.log(`Beat ${i} → ${i + 1}: ${interval}ms (expected: ${expectedInterval}ms)`);
    });

    // 모든 콜백 간격이 허용 오차 내에 있어야 함
    for (const interval of callbackIntervals) {
      expect(Math.abs(interval - expectedInterval)).toBeLessThan(50);
    }
  });
});
