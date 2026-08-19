'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { A4_FREQUENCY } from '@tempo-tune/shared/constants';
import { clamp } from '@tempo-tune/shared/utils';

const TUNER_REFERENCE_FREQUENCY_STORAGE_KEY =
  'tempo_tuner_reference_frequency_v1';

export const MIN_REFERENCE_FREQUENCY = 432;
export const MAX_REFERENCE_FREQUENCY = 446;

const subscribers = new Set<() => void>();

export function normalizeReferenceFrequency(frequency: number): number {
  if (!Number.isFinite(frequency)) return A4_FREQUENCY;
  return clamp(
    Math.round(frequency),
    MIN_REFERENCE_FREQUENCY,
    MAX_REFERENCE_FREQUENCY
  );
}

export function getStoredReferenceFrequency(): number {
  if (typeof window === 'undefined') return A4_FREQUENCY;

  try {
    const raw = window.localStorage.getItem(
      TUNER_REFERENCE_FREQUENCY_STORAGE_KEY
    );
    if (raw === null || raw.trim() === '') return A4_FREQUENCY;
    return normalizeReferenceFrequency(Number(raw));
  } catch {
    return A4_FREQUENCY;
  }
}

function subscribe(callback: () => void) {
  subscribers.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === TUNER_REFERENCE_FREQUENCY_STORAGE_KEY) callback();
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    subscribers.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function emitChange() {
  subscribers.forEach((callback) => callback());
}

function getServerSnapshot() {
  return A4_FREQUENCY;
}

export function useTunerReferenceFrequency() {
  const referenceFrequency = useSyncExternalStore(
    subscribe,
    getStoredReferenceFrequency,
    getServerSnapshot
  );

  const setReferenceFrequency = useCallback((frequency: number) => {
    if (typeof window === 'undefined') return;

    const normalizedFrequency = normalizeReferenceFrequency(frequency);
    try {
      window.localStorage.setItem(
        TUNER_REFERENCE_FREQUENCY_STORAGE_KEY,
        String(normalizedFrequency)
      );
      emitChange();
    } catch {
      // Keep the current value when storage is unavailable.
    }
  }, []);

  return { referenceFrequency, setReferenceFrequency };
}
