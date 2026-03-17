// @vitest-environment jsdom

import { flushSync } from 'react-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderTestHook } from './test-utils/render-hook';
import { useMetronomePreferences } from './use-metronome-preferences';
import { useTunerPreferences } from './use-tuner-preferences';

describe('shared preference hooks', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps tuner reference frequency and detection settings in sync across hook instances', async () => {
    const first = renderTestHook(() => useTunerPreferences());
    const second = renderTestHook(() => useTunerPreferences());

    expect(first.result.current.referenceFrequency).toBe(432);
    expect(second.result.current.referenceFrequency).toBe(432);
    expect(second.result.current.sensitivityPreset).toBe('balanced');

    flushSync(() => {
      first.result.current.setReferenceFrequency(444);
      first.result.current.applySensitivityPreset('fast');
      first.result.current.setDetectionSettings({ confidenceGate: 0.5 });
    });

    await second.waitFor(() => {
      expect(second.result.current.referenceFrequency).toBe(444);
      expect(second.result.current.detectionSettings.confidenceGate).toBe(0.5);
      expect(second.result.current.sensitivityPreset).toBe('custom');
    });

    first.unmount();
    second.unmount();
  });

  it('keeps metronome defaults in sync across hook instances and clamps invalid bpm values', async () => {
    const first = renderTestHook(() => useMetronomePreferences());
    const second = renderTestHook(() => useMetronomePreferences());

    flushSync(() => {
      first.result.current.setBpm(999);
      first.result.current.setTimeSignature([3, 4]);
    });

    await second.waitFor(() => {
      expect(second.result.current.bpm).toBe(300);
      expect(second.result.current.timeSignature).toEqual([3, 4]);
    });

    first.unmount();
    second.unmount();
  });
});
