'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TunerNote, TuningPreset, TuningString } from '@tempo-tune/shared/types';
import { A4_FREQUENCY, ALL_TUNING_PRESETS } from '@tempo-tune/shared/constants';
import { TunerAudioService } from '../services/audio';
import { AudioBridgeClient } from '../services/bridge/audio-bridge.client';
import { isNativeEnvironment } from '../services/bridge/bridge-adapter';
import { TunerEngine, type YinConfig } from '@tempo-tune/audio/tuner';
import { clamp } from '@tempo-tune/shared/utils';

type TuningMode = 'auto' | 'manual';
type SensitivityPreset = 'stable' | 'balanced' | 'fast' | 'custom';
type PresetKey = Exclude<SensitivityPreset, 'custom'>;
type TunerDetectionSettings = {
  confidenceGate: number;
  confidenceSmoothingAlpha: number;
  probabilityThreshold: number;
  rmsThreshold: number;
  detectorSmoothingAlpha: number;
  maxJumpCents: number;
};

const MAX_HISTORY_POINTS = 90;
const MAX_HISTORY_CENTS = 50;
const SAMPLE_INTERVAL_MS = 80;
const SMOOTHING_WINDOW = 5;
const SIGNAL_HOLD_MS = 240;
const SILENCE_DECAY_FACTOR = 0.84;
const SILENCE_EPSILON = 0.2;
const LATENCY_LOG_THROTTLE_MS = 120;
const DETECTOR_MIN_FREQUENCY = 55;
const DETECTOR_MAX_FREQUENCY = 1400;
const DETECTOR_MEDIAN_WINDOW_SIZE = 5;
const DETECTION_SETTINGS_STORAGE_KEY = 'tempo_tuner_detection_settings_v1';

const TUNER_SENSITIVITY_PRESETS: Record<PresetKey, TunerDetectionSettings> = {
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

function isSameString(a: TuningString | null, b: TuningString | null): boolean {
  if (!a || !b) return false;
  return a.name === b.name && a.octave === b.octave;
}

function getStringKey(target: TuningString | null): string | null {
  return target ? `${target.name}-${target.octave}` : null;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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

function toPitchDetectionConfig(settings: TunerDetectionSettings): Partial<YinConfig> {
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

function getSensitivityPreset(settings: TunerDetectionSettings): SensitivityPreset {
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

function getInitialDetectionSettings(): TunerDetectionSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_DETECTION_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(DETECTION_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DETECTION_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<TunerDetectionSettings>;
    return sanitizeDetectionSettings(parsed);
  } catch {
    return { ...DEFAULT_DETECTION_SETTINGS };
  }
}

function isLatencyDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (window.localStorage.getItem('tempo_tuner_latency_debug') === '1') return true;
  } catch {
    // ignore storage errors
  }

  try {
    return new URLSearchParams(window.location.search).get('tunerDebug') === '1';
  } catch {
    return false;
  }
}

export function useTuner() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<TunerNote | null>(null);
  const [closestString, setClosestString] = useState<TuningString | null>(null);
  const [targetString, setTargetStringState] = useState<TuningString | null>(null);
  const [tuningMode, setTuningModeState] = useState<TuningMode>('auto');
  const [hasSignal, setHasSignal] = useState(false);
  const [pitchConfidence, setPitchConfidence] = useState(0);
  const [isLowConfidence, setIsLowConfidence] = useState(false);
  const [centsFromTarget, setCentsFromTarget] = useState(0);
  const [centsHistory, setCentsHistory] = useState<number[]>([]);
  const [currentPreset, setCurrentPresetState] = useState<TuningPreset>(ALL_TUNING_PRESETS[0]);
  const [referenceFrequency, setReferenceFrequencyState] = useState(A4_FREQUENCY);
  const [detectionSettings, setDetectionSettingsState] = useState<TunerDetectionSettings>(() =>
    getInitialDetectionSettings(),
  );
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<TunerAudioService | null>(null);
  const bridgeRef = useRef<AudioBridgeClient | null>(null);
  const engineRef = useRef<TunerEngine | null>(null);
  const targetStringRef = useRef<TuningString | null>(null);
  const closestStringRef = useRef<TuningString | null>(null);
  const detectedNoteRef = useRef<TunerNote | null>(null);
  const tuningModeRef = useRef<TuningMode>('auto');
  const hasSignalRef = useRef(false);
  const confidenceRef = useRef(0);
  const detectionSettingsRef = useRef<TunerDetectionSettings>(detectionSettings);
  const lastSignalAtRef = useRef<number | null>(null);
  const latestSmoothedCentsRef = useRef(0);
  const graphCursorCentsRef = useRef(0);
  const latencyDebugEnabledRef = useRef(false);
  const lastLatencyLogAtRef = useRef(0);
  const smoothingBufferRef = useRef<number[]>([]);
  const activeTargetForSmoothingRef = useRef<string | null>(null);

  useEffect(() => {
    targetStringRef.current = targetString;
  }, [targetString]);

  useEffect(() => {
    closestStringRef.current = closestString;
  }, [closestString]);

  useEffect(() => {
    tuningModeRef.current = tuningMode;
  }, [tuningMode]);

  useEffect(() => {
    hasSignalRef.current = hasSignal;
  }, [hasSignal]);

  useEffect(() => {
    confidenceRef.current = pitchConfidence;
  }, [pitchConfidence]);

  useEffect(() => {
    detectionSettingsRef.current = detectionSettings;
  }, [detectionSettings]);

  useEffect(() => {
    latencyDebugEnabledRef.current = isLatencyDebugEnabled();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(
        DETECTION_SETTINGS_STORAGE_KEY,
        JSON.stringify(detectionSettings),
      );
    } catch {
      // ignore storage write errors
    }
  }, [detectionSettings]);

  const clearSmoothingState = useCallback(() => {
    smoothingBufferRef.current = [];
    activeTargetForSmoothingRef.current = null;
    latestSmoothedCentsRef.current = 0;
  }, []);

  const clearHistory = useCallback(() => {
    setCentsHistory([]);
    graphCursorCentsRef.current = 0;
    clearSmoothingState();
  }, [clearSmoothingState]);

  const clearSignalState = useCallback(() => {
    setHasSignal(false);
    hasSignalRef.current = false;
    setPitchConfidence(0);
    confidenceRef.current = 0;
    setIsLowConfidence(false);
    lastSignalAtRef.current = null;
    graphCursorCentsRef.current = 0;
    latestSmoothedCentsRef.current = 0;
    clearSmoothingState();
  }, [clearSmoothingState]);

  const appendHistoryPoint = useCallback((value: number) => {
    setCentsHistory((prev) => {
      const next = [...prev, clamp(value, -MAX_HISTORY_CENTS, MAX_HISTORY_CENTS)];
      if (next.length > MAX_HISTORY_POINTS) next.shift();
      return next;
    });
  }, []);

  const getClosestString = useCallback((frequency: number): TuningString | null => {
    const engine = engineRef.current;
    if (engine) {
      return engine.findClosestString(frequency);
    }

    return serviceRef.current?.findClosestString(frequency) ?? null;
  }, []);

  const getCentsFromTarget = useCallback((frequency: number, target: TuningString | null): number => {
    if (!target) return 0;
    const engine = engineRef.current;
    if (engine) {
      return engine.getCentsFromTarget(frequency, target);
    }

    return serviceRef.current?.getCentsFromTarget(frequency, target) ?? 0;
  }, []);

  const processDetectedNote = useCallback(
    (note: TunerNote | null) => {
      if (!note) {
        return;
      }

      const settings = detectionSettingsRef.current;
      const confidence = clamp(note.confidence ?? 1, 0, 1);
      const smoothedConfidence =
        confidenceRef.current +
        (confidence - confidenceRef.current) * settings.confidenceSmoothingAlpha;
      confidenceRef.current = smoothedConfidence;
      setPitchConfidence(smoothedConfidence);

      const lowConfidence = smoothedConfidence < settings.confidenceGate;
      setIsLowConfidence(lowConfidence);
      if (lowConfidence) {
        if (latencyDebugEnabledRef.current) {
          const now = Date.now();
          if (now - lastLatencyLogAtRef.current >= LATENCY_LOG_THROTTLE_MS) {
            console.info(
              `[tuner-latency:web-hook] drop low-confidence conf=${smoothedConfidence.toFixed(2)} gate=${settings.confidenceGate.toFixed(2)} note=${note.name}${note.octave}`,
            );
            lastLatencyLogAtRef.current = now;
          }
        }
        return;
      }

      lastSignalAtRef.current = performance.now();
      if (!hasSignalRef.current) {
        hasSignalRef.current = true;
        setHasSignal(true);
      }

      setDetectedNote(note);
      detectedNoteRef.current = note;

      if (latencyDebugEnabledRef.current) {
        const now = Date.now();
        if (now - lastLatencyLogAtRef.current >= LATENCY_LOG_THROTTLE_MS) {
          const detectToUiMs =
            typeof note.detectedAtMs === 'number' ? now - note.detectedAtMs : null;
          const bridgeToUiMs =
            typeof note.bridgeSentAtMs === 'number' ? now - note.bridgeSentAtMs : null;
          const webToUiMs =
            typeof note.webReceivedAtMs === 'number' ? now - note.webReceivedAtMs : null;
          console.info(
            `[tuner-latency:web-hook] detect->ui=${detectToUiMs ?? '-'}ms bridge->ui=${bridgeToUiMs ?? '-'}ms web->ui=${webToUiMs ?? '-'}ms conf=${smoothedConfidence.toFixed(2)} note=${note.name}${note.octave} source=${note.debugSource ?? 'unknown'} seq=${note.debugSeq ?? '-'}`,
          );
          lastLatencyLogAtRef.current = now;
        }
      }

      const closest = getClosestString(note.frequency);
      setClosestString(closest);
      closestStringRef.current = closest;

      const target = tuningModeRef.current === 'manual' ? targetStringRef.current : closest;
      const rawCents = getCentsFromTarget(note.frequency, target);
      const clampedCents = clamp(rawCents, -MAX_HISTORY_CENTS, MAX_HISTORY_CENTS);
      setCentsFromTarget(clampedCents);

      if (!target) {
        clearSmoothingState();
        latestSmoothedCentsRef.current = 0;
        return;
      }

      const targetKey = getStringKey(target);
      if (activeTargetForSmoothingRef.current !== targetKey) {
        clearSmoothingState();
        activeTargetForSmoothingRef.current = targetKey;
      }

      smoothingBufferRef.current.push(clampedCents);
      if (smoothingBufferRef.current.length > SMOOTHING_WINDOW) {
        smoothingBufferRef.current.shift();
      }

      const smoothedCents = average(smoothingBufferRef.current);
      latestSmoothedCentsRef.current = smoothedCents;
      graphCursorCentsRef.current = smoothedCents;
    },
    [clearSmoothingState, getCentsFromTarget, getClosestString],
  );

  useEffect(() => {
    if (!isListening) return;

    const tick = () => {
      const now = performance.now();
      const isSignalLive =
        lastSignalAtRef.current !== null && now - lastSignalAtRef.current <= SIGNAL_HOLD_MS;

      const wasSignalLive = hasSignalRef.current;
      if (isSignalLive !== hasSignalRef.current) {
        hasSignalRef.current = isSignalLive;
        setHasSignal(isSignalLive);
        if (!isSignalLive && wasSignalLive) {
          setPitchConfidence(0);
          confidenceRef.current = 0;
          setIsLowConfidence(false);
          setDetectedNote(null);
          detectedNoteRef.current = null;
          setClosestString(null);
          closestStringRef.current = null;
        }
      }

      let nextCents = latestSmoothedCentsRef.current;
      if (!isSignalLive) {
        nextCents = graphCursorCentsRef.current * SILENCE_DECAY_FACTOR;
        if (Math.abs(nextCents) < SILENCE_EPSILON) nextCents = 0;
        setCentsFromTarget(nextCents);
      }

      graphCursorCentsRef.current = nextCents;
      appendHistoryPoint(nextCents);
    };

    tick();
    const intervalId = window.setInterval(tick, SAMPLE_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [appendHistoryPoint, isListening]);

  useEffect(() => {
    const pitchConfig = toPitchDetectionConfig(detectionSettingsRef.current);

    if (isNativeEnvironment()) {
      const bridge = new AudioBridgeClient();
      const engine = new TunerEngine();
      engine.setPreset(ALL_TUNING_PRESETS[0]);
      engine.setReferenceFrequency(A4_FREQUENCY);
      engine.setPitchDetectionConfig(pitchConfig);
      bridgeRef.current = bridge;
      engineRef.current = engine;

      const unsubPitch = bridge.onPitchDetected((note) => processDetectedNote(note));

      return () => {
        unsubPitch();
        bridge.dispose();
        engine.dispose();
      };
    }

    serviceRef.current = new TunerAudioService();
    serviceRef.current.setPreset(ALL_TUNING_PRESETS[0]);
    serviceRef.current.setReferenceFrequency(A4_FREQUENCY);
    serviceRef.current.setPitchDetectionConfig(pitchConfig);
    const unsubscribe = serviceRef.current.onNoteDetected(processDetectedNote);

    return () => {
      unsubscribe();
      serviceRef.current?.dispose();
    };
  }, [processDetectedNote]);

  useEffect(() => {
    const pitchConfig = toPitchDetectionConfig(detectionSettings);
    serviceRef.current?.setPitchDetectionConfig(pitchConfig);
    engineRef.current?.setPitchDetectionConfig(pitchConfig);
  }, [detectionSettings]);

  const start = useCallback(async () => {
    try {
      setError(null);
      if (bridgeRef.current) {
        await bridgeRef.current.startListening();
      } else {
        await serviceRef.current?.start();
      }
      setIsListening(true);
      clearSignalState();
      setDetectedNote(null);
      detectedNoteRef.current = null;
      setClosestString(null);
      closestStringRef.current = null;
      setCentsFromTarget(0);
      clearHistory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setIsListening(false);
    }
  }, [clearHistory, clearSignalState]);

  const stop = useCallback(() => {
    if (bridgeRef.current) {
      bridgeRef.current.stopListening();
    } else {
      serviceRef.current?.stop();
    }
    setIsListening(false);
    clearSignalState();
    setDetectedNote(null);
    detectedNoteRef.current = null;
    setClosestString(null);
    closestStringRef.current = null;
    setCentsFromTarget(0);
    clearHistory();
  }, [clearHistory, clearSignalState]);

  const setPreset = useCallback((preset: TuningPreset) => {
    setCurrentPresetState(preset);
    engineRef.current?.setPreset(preset);
    serviceRef.current?.setPreset(preset);

    if (tuningModeRef.current === 'auto') {
      setTargetStringState(null);
      targetStringRef.current = null;
      clearHistory();
      const note = detectedNoteRef.current;
      const closest = closestStringRef.current;
      if (!note || !closest) {
        clearSignalState();
        setDetectedNote(null);
        detectedNoteRef.current = null;
        setClosestString(null);
        closestStringRef.current = null;
        setCentsFromTarget(0);
        return;
      }

      const cents = getCentsFromTarget(note.frequency, closest);
      const clamped = clamp(cents, -MAX_HISTORY_CENTS, MAX_HISTORY_CENTS);
      setCentsFromTarget(clamped);
      latestSmoothedCentsRef.current = clamped;
      graphCursorCentsRef.current = clamped;
      return;
    }

    const prevTarget = targetStringRef.current;
    const matched = preset.strings.find((string) => isSameString(string, prevTarget)) ?? null;
    const nextTarget = matched ?? preset.strings[0] ?? null;
    setTargetStringState(nextTarget);
    targetStringRef.current = nextTarget;

    const note = detectedNoteRef.current;
    if (!note || !nextTarget) {
      clearHistory();
      setCentsFromTarget(0);
      return;
    }

    clearHistory();
    const cents = getCentsFromTarget(note.frequency, nextTarget);
    const clamped = clamp(cents, -MAX_HISTORY_CENTS, MAX_HISTORY_CENTS);
    setCentsFromTarget(clamped);
    latestSmoothedCentsRef.current = clamped;
    graphCursorCentsRef.current = clamped;
  }, [clearHistory, clearSignalState, getCentsFromTarget]);

  const setReferenceFrequency = useCallback((freq: number) => {
    setReferenceFrequencyState(freq);
    engineRef.current?.setReferenceFrequency(freq);
    serviceRef.current?.setReferenceFrequency(freq);
  }, []);

  const setDetectionSettings = useCallback((patch: Partial<TunerDetectionSettings>) => {
    setDetectionSettingsState((prev) => sanitizeDetectionSettings({ ...prev, ...patch }));
  }, []);

  const applySensitivityPreset = useCallback((preset: PresetKey) => {
    setDetectionSettingsState({ ...TUNER_SENSITIVITY_PRESETS[preset] });
  }, []);

  const setTargetString = useCallback((target: TuningString) => {
    setTuningModeState('manual');
    tuningModeRef.current = 'manual';
    setTargetStringState(target);
    targetStringRef.current = target;
    clearHistory();

    const note = detectedNoteRef.current;
    if (!note) return;

    const cents = getCentsFromTarget(note.frequency, target);
    const clamped = clamp(cents, -MAX_HISTORY_CENTS, MAX_HISTORY_CENTS);
    setCentsFromTarget(clamped);
    latestSmoothedCentsRef.current = clamped;
    graphCursorCentsRef.current = clamped;
  }, [clearHistory, getCentsFromTarget]);

  const setTuningMode = useCallback(
    (mode: TuningMode) => {
      if (tuningModeRef.current === mode) return;
      tuningModeRef.current = mode;
      setTuningModeState(mode);
      clearHistory();

      if (mode === 'auto') {
        setTargetStringState(null);
        targetStringRef.current = null;
        const note = detectedNoteRef.current;
        const closest = closestStringRef.current;
        if (!note || !closest) {
          clearSignalState();
          setDetectedNote(null);
          detectedNoteRef.current = null;
          setClosestString(null);
          closestStringRef.current = null;
          setCentsFromTarget(0);
          return;
        }

        const cents = getCentsFromTarget(note.frequency, closest);
        const clamped = clamp(cents, -MAX_HISTORY_CENTS, MAX_HISTORY_CENTS);
        setCentsFromTarget(clamped);
        latestSmoothedCentsRef.current = clamped;
        graphCursorCentsRef.current = clamped;
        return;
      }

      const fallbackTarget = targetStringRef.current ?? closestStringRef.current ?? currentPreset.strings[0] ?? null;
      setTargetStringState(fallbackTarget);
      targetStringRef.current = fallbackTarget;

      const note = detectedNoteRef.current;
      if (!note || !fallbackTarget) {
        setCentsFromTarget(0);
        return;
      }

      const cents = getCentsFromTarget(note.frequency, fallbackTarget);
      const clamped = clamp(cents, -MAX_HISTORY_CENTS, MAX_HISTORY_CENTS);
      setCentsFromTarget(clamped);
      latestSmoothedCentsRef.current = clamped;
      graphCursorCentsRef.current = clamped;
    },
    [clearHistory, clearSignalState, currentPreset, getCentsFromTarget],
  );

  const sensitivityPreset = getSensitivityPreset(detectionSettings);

  return {
    isListening,
    detectedNote,
    closestString,
    targetString,
    tuningMode,
    hasSignal,
    pitchConfidence,
    isLowConfidence,
    confidenceGate: detectionSettings.confidenceGate,
    centsFromTarget,
    centsHistory,
    currentPreset,
    referenceFrequency,
    detectionSettings,
    sensitivityPreset,
    error,
    start,
    stop,
    setPreset,
    setReferenceFrequency,
    setDetectionSettings,
    applySensitivityPreset,
    setTargetString,
    setTuningMode,
  };
}
