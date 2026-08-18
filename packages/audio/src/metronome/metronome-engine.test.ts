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

  it.each([60, 120, 293])('%i BPM의 예약 timestamp 간격이 정확해야 한다', (bpm) => {
    engine.dispose();
    engine = new MetronomeEngine({ bpm, subdivision: 1 });
    events = [];
    engine.onTick((event: MetronomeEvent) => {
      events.push({ event, callbackTime: mockNow });
    });

    engine.start();
    for (let elapsed = 0; elapsed < 5_000; elapsed += 25) advanceTime(25);

    const mainBeats = events.filter((e) => e.event.subdivision === 0);
    const expectedInterval = 60_000 / bpm;
    for (let i = 1; i < mainBeats.length; i++) {
      const actualInterval = mainBeats[i].event.timestamp - mainBeats[i - 1].event.timestamp;
      expect(actualInterval).toBeCloseTo(expectedInterval, 9);
    }
  });

  it('123 BPM으로 6시간 진행해도 예약 timestamp의 누적 위상 오차가 없어야 한다', () => {
    engine.dispose();
    engine = new MetronomeEngine({ bpm: 123, subdivision: 1 });
    events = [];
    engine.onTick((event: MetronomeEvent) => {
      events.push({ event, callbackTime: mockNow });
    });

    engine.start();
    const processTick = (engine as unknown as { processTick: () => void }).processTick.bind(engine);
    const sixHoursMs = 6 * 60 * 60 * 1000;
    while (mockNow < sixHoursMs) {
      mockNow += 100;
      processTick();
    }

    const firstTimestamp = events[0].event.timestamp;
    const interval = 60_000 / 123;
    const lastIndex = events.length - 1;
    const idealLastTimestamp = firstTimestamp + lastIndex * interval;
    expect(Math.abs(events[lastIndex].event.timestamp - idealLastTimestamp)).toBeLessThan(0.001);
  });

  it('lookahead 구간의 beat를 미래 timestamp로 예약해야 한다', () => {
    engine.start();
    for (let elapsed = 0; elapsed < 425; elapsed += 25) advanceTime(25);

    expect(events.some(({ event, callbackTime }) => event.timestamp > callbackTime)).toBe(true);
  });

  it('긴 scheduler stall 뒤에도 기존 beat phase를 보존해야 한다', () => {
    engine.dispose();
    engine = new MetronomeEngine({ bpm: 293, subdivision: 1 });
    events = [];
    engine.onTick((event: MetronomeEvent) => events.push({ event, callbackTime: mockNow }));
    engine.start();

    const processTick = (engine as unknown as { processTick: () => void }).processTick.bind(engine);
    mockNow = 25;
    processTick();
    const phaseAnchor = events[0].event.timestamp;
    mockNow += 10_000;
    processTick();

    const interval = 60_000 / 293;
    for (const { event } of events) {
      const phase = (event.timestamp - phaseAnchor) / interval;
      expect(Math.abs(phase - Math.round(phase))).toBeLessThan(1e-9);
    }
  });

  it('큰 누락 tick 수의 transport 이동을 한 번의 계산으로 처리해야 한다', () => {
    engine.dispose();
    engine = new MetronomeEngine({
      bpm: 120,
      subdivision: 4,
      timeSignature: [4, 4],
    });

    const skippedTicks = 1_000_000_003;
    const advanceTransport = (
      engine as unknown as { advanceTransport: (tickCount: number) => void }
    ).advanceTransport.bind(engine);

    advanceTransport(skippedTicks);

    expect((engine as unknown as { currentSubdivision: number }).currentSubdivision).toBe(
      skippedTicks % 4,
    );
    expect(engine.getCurrentBeat()).toBe(Math.floor(skippedTicks / 4) % 4);
  });
});
