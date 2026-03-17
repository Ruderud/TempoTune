// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { setAudioInputBridge, resetAudioInputBridge } from '../services/audio-input';
import { createFakeAudioInputBridge } from './test-utils/fake-audio-input-bridge';
import { renderTestHook } from './test-utils/render-hook';
import { useRhythmPractice } from './use-rhythm-practice';

describe('useRhythmPractice', () => {
  afterEach(() => {
    resetAudioInputBridge();
  });

  it('uses native rhythm events when frame consumers are unavailable', async () => {
    const fakeBridge = createFakeAudioInputBridge();
    setAudioInputBridge(fakeBridge.bridge);

    const { result, unmount, waitFor } = renderTestHook(() => useRhythmPractice());

    result.current.startPractice(120, 4);

    expect(fakeBridge.bridge.configureAnalyzers).toHaveBeenCalledWith({
      enablePitch: true,
      enableRhythm: true,
    });

    await waitFor(() => {
      expect(result.current.isActive).toBe(true);
    });

    fakeBridge.emitRhythm({
      detectedAtMonotonicMs: 1000,
      nearestBeatAtMonotonicMs: 990,
      offsetMs: 10,
      status: 'late',
      confidence: 0.88,
      source: 'pick',
    });

    await waitFor(() => {
      expect(result.current.latestHit?.status).toBe('late');
      expect(result.current.stats.totalHits).toBe(1);
      expect(result.current.stats.lateCount).toBe(1);
      expect(result.current.recentHits).toHaveLength(1);
      expect(result.current.currentStreak).toBe(0);
    });

    fakeBridge.emitRhythm({
      detectedAtMonotonicMs: 1200,
      nearestBeatAtMonotonicMs: 1200,
      offsetMs: 0,
      status: 'on-time',
      confidence: 0.93,
      source: 'pick-attack',
    });

    await waitFor(() => {
      expect(result.current.latestHit?.status).toBe('on-time');
      expect(result.current.recentHits).toHaveLength(2);
      expect(result.current.recentHits[0]?.status).toBe('on-time');
      expect(result.current.currentStreak).toBe(1);
      expect(result.current.stats.onTimeCount).toBe(1);
    });

    result.current.stopPractice();

    expect(fakeBridge.bridge.configureAnalyzers).toHaveBeenLastCalledWith({
      enablePitch: true,
      enableRhythm: false,
    });

    await waitFor(() => {
      expect(result.current.isActive).toBe(false);
    });

    fakeBridge.emitRhythm({
      detectedAtMonotonicMs: 1100,
      nearestBeatAtMonotonicMs: 1090,
      offsetMs: 10,
      status: 'late',
      confidence: 0.9,
      source: 'pick',
    });

    expect(result.current.stats.totalHits).toBe(2);
    unmount();
  });

  it('reuses the shared frame-consumer path on web and removes the consumer on stop', async () => {
    const fakeBridge = createFakeAudioInputBridge({ withFrameConsumer: true });
    setAudioInputBridge(fakeBridge.bridge);

    const { result, unmount, waitFor } = renderTestHook(() => useRhythmPractice());

    result.current.startPractice(96, 4);

    expect(fakeBridge.addFrameConsumer).toHaveBeenCalledTimes(1);
    expect(fakeBridge.bridge.configureAnalyzers).not.toHaveBeenCalledWith({
      enablePitch: true,
      enableRhythm: true,
    });

    await waitFor(() => {
      expect(result.current.isActive).toBe(true);
    });

    result.current.stopPractice();

    expect(fakeBridge.removeFrameConsumer).toHaveBeenCalledTimes(1);
    expect(fakeBridge.bridge.configureAnalyzers).toHaveBeenLastCalledWith({
      enablePitch: true,
      enableRhythm: false,
    });

    await waitFor(() => {
      expect(result.current.isActive).toBe(false);
    });

    unmount();
  });
});
