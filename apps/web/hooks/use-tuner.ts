'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TunerNote, TuningPreset, TuningString } from '@tempo-tune/shared/types';
import { A4_FREQUENCY, ALL_TUNING_PRESETS } from '@tempo-tune/shared/constants';
import { TunerAudioService } from '../services/audio';
import { AudioBridgeClient } from '../services/bridge/audio-bridge.client';
import { isNativeEnvironment } from '../services/bridge/bridge-adapter';
import { TunerEngine } from '@tempo-tune/audio/tuner';

export function useTuner() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<TunerNote | null>(null);
  const [closestString, setClosestString] = useState<TuningString | null>(null);
  const [centsFromTarget, setCentsFromTarget] = useState(0);
  const [currentPreset, setCurrentPresetState] = useState<TuningPreset>(ALL_TUNING_PRESETS[0]);
  const [referenceFrequency, setReferenceFrequencyState] = useState(A4_FREQUENCY);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef<TunerAudioService | null>(null);
  const bridgeRef = useRef<AudioBridgeClient | null>(null);
  const engineRef = useRef<TunerEngine | null>(null);

  useEffect(() => {
    const handleNote = (note: TunerNote | null) => {
      setDetectedNote(note);
      if (note) {
        const engine = engineRef.current;
        const service = serviceRef.current;
        const closest = engine
          ? engine.findClosestString(note.frequency)
          : service?.findClosestString(note.frequency) ?? null;
        setClosestString(closest);
        if (closest) {
          const cents = engine
            ? engine.getCentsFromTarget(note.frequency, closest)
            : service?.getCentsFromTarget(note.frequency, closest) ?? 0;
          setCentsFromTarget(cents);
        }
      } else {
        setClosestString(null);
        setCentsFromTarget(0);
      }
    };

    if (isNativeEnvironment()) {
      const bridge = new AudioBridgeClient();
      const engine = new TunerEngine();
      bridgeRef.current = bridge;
      engineRef.current = engine;

      const unsubPitch = bridge.onPitchDetected((note) => handleNote(note));

      return () => {
        unsubPitch();
        bridge.dispose();
        engine.dispose();
      };
    } else {
      serviceRef.current = new TunerAudioService();
      const unsubscribe = serviceRef.current.onNoteDetected(handleNote);

      return () => {
        unsubscribe();
        serviceRef.current?.dispose();
      };
    }
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      if (bridgeRef.current) {
        await bridgeRef.current.startListening();
      } else {
        await serviceRef.current?.start();
      }
      setIsListening(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setIsListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (bridgeRef.current) {
      bridgeRef.current.stopListening();
    } else {
      serviceRef.current?.stop();
    }
    setIsListening(false);
    setDetectedNote(null);
    setClosestString(null);
    setCentsFromTarget(0);
  }, []);

  const setPreset = useCallback((preset: TuningPreset) => {
    setCurrentPresetState(preset);
    engineRef.current?.setPreset(preset);
    serviceRef.current?.setPreset(preset);
  }, []);

  const setReferenceFrequency = useCallback((freq: number) => {
    setReferenceFrequencyState(freq);
    engineRef.current?.setReferenceFrequency(freq);
    serviceRef.current?.setReferenceFrequency(freq);
  }, []);

  return {
    isListening,
    detectedNote,
    closestString,
    centsFromTarget,
    currentPreset,
    referenceFrequency,
    error,
    start,
    stop,
    setPreset,
    setReferenceFrequency,
  };
}
