'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { A4_FREQUENCY } from '@tempo-tune/shared/constants';
import { clamp } from '@tempo-tune/shared/utils';
import { useTunerDetectionSettings } from './use-tuner-detection-settings';
import { useTunerLayout } from './use-tuner-layout';

const TUNER_REFERENCE_FREQUENCY_STORAGE_KEY = 'tempo_tuner_reference_frequency_v1';
const MIN_REFERENCE_FREQUENCY = 432;
const MAX_REFERENCE_FREQUENCY = 446;

const tunerPreferenceSubscribers = new Set<() => void>();

function subscribeTunerPreferences(callback: () => void) {
  tunerPreferenceSubscribers.add(callback);
  return () => {
    tunerPreferenceSubscribers.delete(callback);
  };
}

function emitTunerPreferenceChange() {
  tunerPreferenceSubscribers.forEach((callback) => callback());
}

export function getStoredReferenceFrequency(): number {
  if (typeof window === 'undefined') return A4_FREQUENCY;

  const raw = window.localStorage.getItem(TUNER_REFERENCE_FREQUENCY_STORAGE_KEY);
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) return A4_FREQUENCY;
  return clamp(parsed, MIN_REFERENCE_FREQUENCY, MAX_REFERENCE_FREQUENCY);
}

function getReferenceFrequencySnapshot() {
  return getStoredReferenceFrequency();
}

function getServerReferenceFrequencySnapshot() {
  return A4_FREQUENCY;
}

export function useTunerPreferences() {
  const referenceFrequency = useSyncExternalStore(
    subscribeTunerPreferences,
    getReferenceFrequencySnapshot,
    getServerReferenceFrequencySnapshot,
  );
  const {
    detectionSettings,
    sensitivityPreset,
    setDetectionSettings,
    applySensitivityPreset,
  } = useTunerDetectionSettings();
  const { headstockLayout, setHeadstockLayout } = useTunerLayout();

  const setReferenceFrequency = useCallback((freq: number) => {
    if (typeof window === 'undefined') return;

    const normalizedFrequency = clamp(
      freq,
      MIN_REFERENCE_FREQUENCY,
      MAX_REFERENCE_FREQUENCY,
    );
    window.localStorage.setItem(
      TUNER_REFERENCE_FREQUENCY_STORAGE_KEY,
      String(normalizedFrequency),
    );
    emitTunerPreferenceChange();
  }, []);

  return {
    referenceFrequency,
    setReferenceFrequency,
    detectionSettings,
    sensitivityPreset,
    setDetectionSettings,
    applySensitivityPreset,
    headstockLayout,
    setHeadstockLayout,
  };
}
