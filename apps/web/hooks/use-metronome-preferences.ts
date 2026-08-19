'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  COMMON_TIME_SIGNATURES,
  DEFAULT_BPM,
  DEFAULT_TIME_SIGNATURE,
  MAX_BPM,
  MIN_BPM,
} from '@tempo-tune/shared/constants';
import type { TimeSignature } from '@tempo-tune/shared/types';
import { clamp } from '@tempo-tune/shared/utils';

const METRONOME_BPM_STORAGE_KEY = 'tempo_metronome_bpm_v1';
const METRONOME_TIME_SIGNATURE_STORAGE_KEY =
  'tempo_metronome_time_signature_v1';

const subscribers = new Set<() => void>();

export function normalizeMetronomeBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return DEFAULT_BPM;
  return clamp(Math.round(bpm), MIN_BPM, MAX_BPM);
}

export function normalizeMetronomeTimeSignature(
  timeSignature: TimeSignature
): TimeSignature {
  return (
    COMMON_TIME_SIGNATURES.find(
      ([beats, noteValue]) =>
        timeSignature[0] === beats && timeSignature[1] === noteValue
    ) ?? DEFAULT_TIME_SIGNATURE
  );
}

export function getStoredMetronomeBpm(): number {
  if (typeof window === 'undefined') return DEFAULT_BPM;

  try {
    const raw = window.localStorage.getItem(METRONOME_BPM_STORAGE_KEY);
    if (raw === null || raw.trim() === '') return DEFAULT_BPM;
    return normalizeMetronomeBpm(Number(raw));
  } catch {
    return DEFAULT_BPM;
  }
}

export function getStoredMetronomeTimeSignature(): TimeSignature {
  if (typeof window === 'undefined') return DEFAULT_TIME_SIGNATURE;

  try {
    const raw = window.localStorage.getItem(
      METRONOME_TIME_SIGNATURE_STORAGE_KEY
    );
    if (raw === null) return DEFAULT_TIME_SIGNATURE;
    const parsed = JSON.parse(raw) as TimeSignature;
    return normalizeMetronomeTimeSignature(parsed);
  } catch {
    return DEFAULT_TIME_SIGNATURE;
  }
}

function subscribe(callback: () => void) {
  subscribers.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === METRONOME_BPM_STORAGE_KEY ||
      event.key === METRONOME_TIME_SIGNATURE_STORAGE_KEY
    ) {
      callback();
    }
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

function getServerBpmSnapshot() {
  return DEFAULT_BPM;
}

function getServerTimeSignatureSnapshot() {
  return DEFAULT_TIME_SIGNATURE;
}

export function useMetronomePreferences() {
  const bpm = useSyncExternalStore(
    subscribe,
    getStoredMetronomeBpm,
    getServerBpmSnapshot
  );
  const timeSignature = useSyncExternalStore(
    subscribe,
    getStoredMetronomeTimeSignature,
    getServerTimeSignatureSnapshot
  );

  const setBpm = useCallback((nextBpm: number) => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(
        METRONOME_BPM_STORAGE_KEY,
        String(normalizeMetronomeBpm(nextBpm))
      );
      emitChange();
    } catch {
      // Keep the current value when storage is unavailable.
    }
  }, []);

  const setTimeSignature = useCallback((nextTimeSignature: TimeSignature) => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(
        METRONOME_TIME_SIGNATURE_STORAGE_KEY,
        JSON.stringify(normalizeMetronomeTimeSignature(nextTimeSignature))
      );
      emitChange();
    } catch {
      // Keep the current value when storage is unavailable.
    }
  }, []);

  return { bpm, timeSignature, setBpm, setTimeSignature };
}
