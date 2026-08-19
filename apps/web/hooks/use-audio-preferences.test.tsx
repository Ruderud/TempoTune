// @vitest-environment jsdom

import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderTestHook } from './test-utils/render-hook';
import { useMetronomePreferences } from './use-metronome-preferences';
import { useTunerDetectionSettings } from './use-tuner-detection-settings';
import { useTunerLayout } from './use-tuner-layout';
import { useTunerReferenceFrequency } from './use-tuner-reference-frequency';

describe('audio preferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uses the product defaults when no preferences have been stored', () => {
    const tuner = renderTestHook(() => useTunerReferenceFrequency());
    const metronome = renderTestHook(() => useMetronomePreferences());

    expect(tuner.result.current.referenceFrequency).toBe(440);
    expect(metronome.result.current.bpm).toBe(120);
    expect(metronome.result.current.timeSignature).toEqual([4, 4]);

    tuner.unmount();
    metronome.unmount();
  });

  it('falls back to defaults when stored preferences are malformed or unsupported', () => {
    window.localStorage.setItem('tempo_tuner_reference_frequency_v1', '');
    window.localStorage.setItem('tempo_metronome_bpm_v1', 'not-a-number');
    window.localStorage.setItem('tempo_metronome_time_signature_v1', '[5, 16]');

    const tuner = renderTestHook(() => useTunerReferenceFrequency());
    const metronome = renderTestHook(() => useMetronomePreferences());

    expect(tuner.result.current.referenceFrequency).toBe(440);
    expect(metronome.result.current.bpm).toBe(120);
    expect(metronome.result.current.timeSignature).toEqual([4, 4]);

    tuner.unmount();
    metronome.unmount();
  });

  it('clamps values and synchronizes mounted consumers', () => {
    const firstTuner = renderTestHook(() => useTunerReferenceFrequency());
    const secondTuner = renderTestHook(() => useTunerReferenceFrequency());
    const firstMetronome = renderTestHook(() => useMetronomePreferences());
    const secondMetronome = renderTestHook(() => useMetronomePreferences());

    act(() => {
      firstTuner.result.current.setReferenceFrequency(999);
      firstMetronome.result.current.setBpm(999);
      firstMetronome.result.current.setTimeSignature([3, 4]);
    });

    expect(secondTuner.result.current.referenceFrequency).toBe(446);
    expect(secondMetronome.result.current.bpm).toBe(300);
    expect(secondMetronome.result.current.timeSignature).toEqual([3, 4]);
    expect(
      window.localStorage.getItem('tempo_tuner_reference_frequency_v1')
    ).toBe('446');
    expect(window.localStorage.getItem('tempo_metronome_bpm_v1')).toBe('300');

    firstTuner.unmount();
    secondTuner.unmount();
    firstMetronome.unmount();
    secondMetronome.unmount();
  });

  it('restores tuner sensitivity and headstock layout after remounting', () => {
    const first = renderTestHook(() => ({
      detection: useTunerDetectionSettings(),
      layout: useTunerLayout(),
    }));

    act(() => {
      first.result.current.detection.applySensitivityPreset('fast');
      first.result.current.layout.setHeadstockLayout('six-inline');
    });
    first.unmount();

    const second = renderTestHook(() => ({
      detection: useTunerDetectionSettings(),
      layout: useTunerLayout(),
    }));

    expect(second.result.current.detection.sensitivityPreset).toBe('fast');
    expect(second.result.current.layout.headstockLayout).toBe('six-inline');

    second.unmount();
  });
});
