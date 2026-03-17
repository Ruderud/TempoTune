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
const METRONOME_TIME_SIGNATURE_STORAGE_KEY = 'tempo_metronome_time_signature_v1';

const metronomePreferenceSubscribers = new Set<() => void>();
let cachedMetronomeSnapshot: {
  bpm: number;
  timeSignature: TimeSignature;
} | null = null;

function subscribeMetronomePreferences(callback: () => void) {
  metronomePreferenceSubscribers.add(callback);
  return () => {
    metronomePreferenceSubscribers.delete(callback);
  };
}

function emitMetronomePreferenceChange() {
  metronomePreferenceSubscribers.forEach((callback) => callback());
}

export function getStoredMetronomeBpm(): number {
  if (typeof window === 'undefined') return DEFAULT_BPM;

  const raw = window.localStorage.getItem(METRONOME_BPM_STORAGE_KEY);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_BPM;
  return clamp(Math.round(parsed), MIN_BPM, MAX_BPM);
}

export function getStoredMetronomeTimeSignature(): TimeSignature {
  if (typeof window === 'undefined') return DEFAULT_TIME_SIGNATURE;

  const raw = window.localStorage.getItem(METRONOME_TIME_SIGNATURE_STORAGE_KEY);
  if (!raw) return DEFAULT_TIME_SIGNATURE;

  try {
    const parsed = JSON.parse(raw) as TimeSignature;
    const matched = COMMON_TIME_SIGNATURES.find(
      ([beats, noteValue]) => parsed[0] === beats && parsed[1] === noteValue,
    );
    return matched ?? DEFAULT_TIME_SIGNATURE;
  } catch {
    return DEFAULT_TIME_SIGNATURE;
  }
}

function getMetronomePreferencesSnapshot() {
  const nextBpm = getStoredMetronomeBpm();
  const nextTimeSignature = getStoredMetronomeTimeSignature();

  if (
    cachedMetronomeSnapshot &&
    cachedMetronomeSnapshot.bpm === nextBpm &&
    cachedMetronomeSnapshot.timeSignature[0] === nextTimeSignature[0] &&
    cachedMetronomeSnapshot.timeSignature[1] === nextTimeSignature[1]
  ) {
    return cachedMetronomeSnapshot;
  }

  cachedMetronomeSnapshot = {
    bpm: nextBpm,
    timeSignature: nextTimeSignature,
  };

  return cachedMetronomeSnapshot;
}

const SERVER_METRONOME_PREFERENCES_SNAPSHOT = {
  bpm: DEFAULT_BPM,
  timeSignature: DEFAULT_TIME_SIGNATURE,
} satisfies {
  bpm: number;
  timeSignature: TimeSignature;
};

function getServerMetronomePreferencesSnapshot() {
  return SERVER_METRONOME_PREFERENCES_SNAPSHOT;
}

export function useMetronomePreferences() {
  const { bpm, timeSignature } = useSyncExternalStore(
    subscribeMetronomePreferences,
    getMetronomePreferencesSnapshot,
    getServerMetronomePreferencesSnapshot,
  );

  const setBpm = useCallback((nextBpm: number) => {
    if (typeof window === 'undefined') return;

    const normalizedBpm = clamp(Math.round(nextBpm), MIN_BPM, MAX_BPM);
    window.localStorage.setItem(METRONOME_BPM_STORAGE_KEY, String(normalizedBpm));
    emitMetronomePreferenceChange();
  }, []);

  const setTimeSignature = useCallback((nextTimeSignature: TimeSignature) => {
    if (typeof window === 'undefined') return;

    const matched = COMMON_TIME_SIGNATURES.find(
      ([beats, noteValue]) =>
        nextTimeSignature[0] === beats && nextTimeSignature[1] === noteValue,
    );
    const normalizedTimeSignature = matched ?? DEFAULT_TIME_SIGNATURE;
    window.localStorage.setItem(
      METRONOME_TIME_SIGNATURE_STORAGE_KEY,
      JSON.stringify(normalizedTimeSignature),
    );
    emitMetronomePreferenceChange();
  }, []);

  return {
    bpm,
    timeSignature,
    setBpm,
    setTimeSignature,
  };
}
