'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TunerNote, TuningPreset, TuningString } from '@tempo-tune/shared/types';
import { A4_FREQUENCY, ALL_TUNING_PRESETS } from '@tempo-tune/shared/constants';
import { TunerAudioService } from '../services/audio';
import { AudioBridgeClient } from '../services/bridge/audio-bridge.client';
import { isNativeEnvironment } from '../services/bridge/bridge-adapter';
import { TunerEngine } from '@tempo-tune/audio/tuner';
import { clamp } from '@tempo-tune/shared/utils';
import { useTunerDetectionSettings, toPitchDetectionConfig } from './use-tuner-detection-settings';
import { useTunerHistory } from './use-tuner-history';
import { useTunerSignalState } from './use-tuner-signal-state';
import { isLatencyDebugEnabled } from '../utils/latency-debug';

type TuningMode = 'auto' | 'manual';

const MAX_HISTORY_CENTS = 50;
const SAMPLE_INTERVAL_MS = 80;
const SIGNAL_HOLD_MS = 240;
const SILENCE_DECAY_FACTOR = 0.84;
const SILENCE_EPSILON = 0.2;
const LATENCY_LOG_THROTTLE_MS = 120;

function isSameString(a: TuningString | null, b: TuningString | null): boolean {
  if (!a || !b) return false;
  return a.name === b.name && a.octave === b.octave;
}

function getStringKey(target: TuningString | null): string | null {
  return target ? `${target.name}-${target.octave}` : null;
}


export function useTuner() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<TunerNote | null>(null);
  const [closestString, setClosestString] = useState<TuningString | null>(null);
  const [targetString, setTargetStringState] = useState<TuningString | null>(null);
  const [tuningMode, setTuningModeState] = useState<TuningMode>('auto');
  const [currentPreset, setCurrentPresetState] = useState<TuningPreset>(ALL_TUNING_PRESETS[0]);
  const [referenceFrequency, setReferenceFrequencyState] = useState(A4_FREQUENCY);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<TunerAudioService | null>(null);
  const bridgeRef = useRef<AudioBridgeClient | null>(null);
  const engineRef = useRef<TunerEngine | null>(null);
  const targetStringRef = useRef<TuningString | null>(null);
  const closestStringRef = useRef<TuningString | null>(null);
  const detectedNoteRef = useRef<TunerNote | null>(null);
  const tuningModeRef = useRef<TuningMode>('auto');
  const latencyDebugEnabledRef = useRef(false);
  const lastLatencyLogAtRef = useRef(0);

  const {
    detectionSettings,
    detectionSettingsRef,
    sensitivityPreset,
    setDetectionSettings,
    applySensitivityPreset,
  } = useTunerDetectionSettings();

  const {
    centsHistory,
    graphCursorCentsRef,
    latestSmoothedCentsRef,
    activeTargetForSmoothingRef,
    clearSmoothingState,
    clearHistory,
    appendHistoryPoint,
    pushToSmoothingBuffer,
  } = useTunerHistory();

  const {
    hasSignal,
    pitchConfidence,
    isLowConfidence,
    centsFromTarget,
    hasSignalRef,
    confidenceRef,
    lastSignalAtRef,
    setHasSignal,
    setPitchConfidence,
    setIsLowConfidence,
    setCentsFromTarget,
    clearSignalState,
  } = useTunerSignalState(clearSmoothingState);

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
    latencyDebugEnabledRef.current = isLatencyDebugEnabled();
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

      const smoothedCents = pushToSmoothingBuffer(clampedCents);
      latestSmoothedCentsRef.current = smoothedCents;
      graphCursorCentsRef.current = smoothedCents;
    },
    [
      activeTargetForSmoothingRef,
      clearSmoothingState,
      confidenceRef,
      detectionSettingsRef,
      getCentsFromTarget,
      getClosestString,
      graphCursorCentsRef,
      hasSignalRef,
      lastSignalAtRef,
      latestSmoothedCentsRef,
      pushToSmoothingBuffer,
      setCentsFromTarget,
      setHasSignal,
      setIsLowConfidence,
      setPitchConfidence,
    ],
  );

  useEffect(() => {
    if (!isListening) return;

    const tick = () => {
      const now = performance.now();
      const isSignalLive =
        lastSignalAtRef.current !== null && now - lastSignalAtRef.current <= SIGNAL_HOLD_MS;

      const wasSignalLive = hasSignalRef.current;
      if (isSignalLive !== hasSignalRef.current) {
        setHasSignal(isSignalLive);
        if (!isSignalLive && wasSignalLive) {
          setPitchConfidence(0);
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
  }, [
    appendHistoryPoint,
    graphCursorCentsRef,
    hasSignalRef,
    isListening,
    lastSignalAtRef,
    latestSmoothedCentsRef,
    setCentsFromTarget,
    setHasSignal,
    setIsLowConfidence,
    setPitchConfidence,
  ]);

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
      const unsubError = bridge.onError((err) => {
        setError(err.message || 'An error occurred. Please try again.');
        setIsListening(false);
      });

      return () => {
        unsubPitch();
        unsubError();
        bridge.dispose();
        engine.dispose();
      };
    }

    serviceRef.current = new TunerAudioService();
    serviceRef.current.setPreset(ALL_TUNING_PRESETS[0]);
    serviceRef.current.setReferenceFrequency(A4_FREQUENCY);
    serviceRef.current.setPitchDetectionConfig(pitchConfig);
    const unsubscribe = serviceRef.current.onNoteDetected(processDetectedNote);
    const unsubError = serviceRef.current.onError((err) => {
      setError(err.message || 'An error occurred. Please try again.');
      setIsListening(false);
    });

    return () => {
      unsubscribe();
      unsubError();
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
  }, [clearHistory, clearSignalState, setCentsFromTarget]);

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
  }, [clearHistory, clearSignalState, setCentsFromTarget]);

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
  }, [clearHistory, clearSignalState, getCentsFromTarget, graphCursorCentsRef, latestSmoothedCentsRef, setCentsFromTarget]);

  const setReferenceFrequency = useCallback((freq: number) => {
    setReferenceFrequencyState(freq);
    engineRef.current?.setReferenceFrequency(freq);
    serviceRef.current?.setReferenceFrequency(freq);
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
  }, [clearHistory, getCentsFromTarget, graphCursorCentsRef, latestSmoothedCentsRef, setCentsFromTarget]);

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
    [clearHistory, clearSignalState, currentPreset, getCentsFromTarget, graphCursorCentsRef, latestSmoothedCentsRef, setCentsFromTarget],
  );

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
