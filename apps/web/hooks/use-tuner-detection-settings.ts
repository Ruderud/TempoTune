'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { clamp } from '@tempo-tune/shared/utils';
import type { YinConfig } from '@tempo-tune/audio/tuner';

export type SensitivityPreset = 'stable' | 'balanced' | 'fast' | 'custom';
type PresetKey = Exclude<SensitivityPreset, 'custom'>;

export type TunerDetectionSettings = {
  confidenceGate: number;
  confidenceSmoothingAlpha: number;
  probabilityThreshold: number;
  rmsThreshold: number;
  detectorSmoothingAlpha: number;
  maxJumpCents: number;
};

const DETECTION_SETTINGS_STORAGE_KEY = 'tempo_tuner_detection_settings_v1';

const DETECTOR_MIN_FREQUENCY = 55;
const DETECTOR_MAX_FREQUENCY = 1400;
const DETECTOR_MEDIAN_WINDOW_SIZE = 5;

export const TUNER_SENSITIVITY_PRESETS: Record<PresetKey, TunerDetectionSettings> = {
  stable: {
    confidenceGate: 0.4,
    confidenceSmoothingAlpha: 0.45,
    probabilityThreshold: 0.3,
    rmsThreshold: 0.012,
    detectorSmoothingAlpha: 0.28,
    maxJumpCents: 60,
  },
  balanced: {
    confidenceGate: 0.3,
    confidenceSmoothingAlpha: 0.35,
    probabilityThreshold: 0.2,
    rmsThreshold: 0.008,
    detectorSmoothingAlpha: 0.2,
    maxJumpCents: 80,
  },
  fast: {
    confidenceGate: 0.22,
    confidenceSmoothingAlpha: 0.24,
    probabilityThreshold: 0.14,
    rmsThreshold: 0.005,
    detectorSmoothingAlpha: 0.14,
    maxJumpCents: 120,
  },
};

const DEFAULT_DETECTION_SETTINGS: TunerDetectionSettings = TUNER_SENSITIVITY_PRESETS.balanced;
const detectionSettingsSubscribers = new Set<() => void>();
let cachedDetectionSettingsSnapshot: TunerDetectionSettings | null = null;

function subscribeDetectionSettings(callback: () => void) {
  detectionSettingsSubscribers.add(callback);
  return () => {
    detectionSettingsSubscribers.delete(callback);
  };
}

function emitDetectionSettingsChange() {
  detectionSettingsSubscribers.forEach((callback) => callback());
}

function sanitizeDetectionSettings(settings: Partial<TunerDetectionSettings>): TunerDetectionSettings {
  return {
    confidenceGate: clamp(settings.confidenceGate ?? DEFAULT_DETECTION_SETTINGS.confidenceGate, 0.1, 0.75),
    confidenceSmoothingAlpha: clamp(
      settings.confidenceSmoothingAlpha ?? DEFAULT_DETECTION_SETTINGS.confidenceSmoothingAlpha,
      0.05,
      0.8,
    ),
    probabilityThreshold: clamp(
      settings.probabilityThreshold ?? DEFAULT_DETECTION_SETTINGS.probabilityThreshold,
      0.05,
      0.8,
    ),
    rmsThreshold: clamp(settings.rmsThreshold ?? DEFAULT_DETECTION_SETTINGS.rmsThreshold, 0.001, 0.05),
    detectorSmoothingAlpha: clamp(
      settings.detectorSmoothingAlpha ?? DEFAULT_DETECTION_SETTINGS.detectorSmoothingAlpha,
      0.05,
      0.6,
    ),
    maxJumpCents: clamp(settings.maxJumpCents ?? DEFAULT_DETECTION_SETTINGS.maxJumpCents, 30, 300),
  };
}

function getStoredDetectionSettings(): TunerDetectionSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_DETECTION_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(DETECTION_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_DETECTION_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<TunerDetectionSettings>;
    return sanitizeDetectionSettings(parsed);
  } catch {
    return DEFAULT_DETECTION_SETTINGS;
  }
}

function getDetectionSettingsSnapshot(): TunerDetectionSettings {
  const nextSettings = getStoredDetectionSettings();

  if (
    cachedDetectionSettingsSnapshot &&
    cachedDetectionSettingsSnapshot.confidenceGate === nextSettings.confidenceGate &&
    cachedDetectionSettingsSnapshot.confidenceSmoothingAlpha === nextSettings.confidenceSmoothingAlpha &&
    cachedDetectionSettingsSnapshot.probabilityThreshold === nextSettings.probabilityThreshold &&
    cachedDetectionSettingsSnapshot.rmsThreshold === nextSettings.rmsThreshold &&
    cachedDetectionSettingsSnapshot.detectorSmoothingAlpha === nextSettings.detectorSmoothingAlpha &&
    cachedDetectionSettingsSnapshot.maxJumpCents === nextSettings.maxJumpCents
  ) {
    return cachedDetectionSettingsSnapshot;
  }

  cachedDetectionSettingsSnapshot = nextSettings;
  return cachedDetectionSettingsSnapshot;
}

function getServerDetectionSettingsSnapshot(): TunerDetectionSettings {
  return DEFAULT_DETECTION_SETTINGS;
}

export function getSensitivityPreset(settings: TunerDetectionSettings): SensitivityPreset {
  const presetEntries = Object.entries(TUNER_SENSITIVITY_PRESETS) as Array<[PresetKey, TunerDetectionSettings]>;

  for (const [presetKey, preset] of presetEntries) {
    if (
      settings.confidenceGate === preset.confidenceGate &&
      settings.confidenceSmoothingAlpha === preset.confidenceSmoothingAlpha &&
      settings.probabilityThreshold === preset.probabilityThreshold &&
      settings.rmsThreshold === preset.rmsThreshold &&
      settings.detectorSmoothingAlpha === preset.detectorSmoothingAlpha &&
      settings.maxJumpCents === preset.maxJumpCents
    ) {
      return presetKey;
    }
  }

  return 'custom';
}

export function toPitchDetectionConfig(settings: TunerDetectionSettings): Partial<YinConfig> {
  return {
    minFrequency: DETECTOR_MIN_FREQUENCY,
    maxFrequency: DETECTOR_MAX_FREQUENCY,
    probabilityThreshold: settings.probabilityThreshold,
    rmsThreshold: settings.rmsThreshold,
    smoothingAlpha: settings.detectorSmoothingAlpha,
    medianWindowSize: DETECTOR_MEDIAN_WINDOW_SIZE,
    maxJumpCents: settings.maxJumpCents,
  };
}

export type UseTunerDetectionSettingsReturn = {
  detectionSettings: TunerDetectionSettings;
  detectionSettingsRef: React.MutableRefObject<TunerDetectionSettings>;
  sensitivityPreset: SensitivityPreset;
  setDetectionSettings: (patch: Partial<TunerDetectionSettings>) => void;
  applySensitivityPreset: (preset: PresetKey) => void;
};

export function useTunerDetectionSettings(): UseTunerDetectionSettingsReturn {
  const detectionSettings = useSyncExternalStore(
    subscribeDetectionSettings,
    getDetectionSettingsSnapshot,
    getServerDetectionSettingsSnapshot,
  );
  const detectionSettingsRef = useRef<TunerDetectionSettings>(detectionSettings);

  useEffect(() => {
    detectionSettingsRef.current = detectionSettings;
  }, [detectionSettings]);

  const setDetectionSettings = useCallback((patch: Partial<TunerDetectionSettings>) => {
    if (typeof window === 'undefined') return;

    const nextSettings = sanitizeDetectionSettings({
      ...getStoredDetectionSettings(),
      ...patch,
    });
    window.localStorage.setItem(DETECTION_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
    emitDetectionSettingsChange();
  }, []);

  const applySensitivityPreset = useCallback((preset: PresetKey) => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
      DETECTION_SETTINGS_STORAGE_KEY,
      JSON.stringify(TUNER_SENSITIVITY_PRESETS[preset]),
    );
    emitDetectionSettingsChange();
  }, []);

  const sensitivityPreset = getSensitivityPreset(detectionSettings);

  return {
    detectionSettings,
    detectionSettingsRef,
    sensitivityPreset,
    setDetectionSettings,
    applySensitivityPreset,
  };
}
