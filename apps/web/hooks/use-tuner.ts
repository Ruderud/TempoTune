'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TunerNote, TuningPreset, TuningString } from '@tempo-tune/shared/types';
import { A4_FREQUENCY, ALL_TUNING_PRESETS } from '@tempo-tune/shared/constants';
import { TunerAudioService } from '../services/audio';

export function useTuner() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<TunerNote | null>(null);
  const [closestString, setClosestString] = useState<TuningString | null>(null);
  const [centsFromTarget, setCentsFromTarget] = useState(0);
  const [currentPreset, setCurrentPresetState] = useState<TuningPreset>(ALL_TUNING_PRESETS[0]);
  const [referenceFrequency, setReferenceFrequencyState] = useState(A4_FREQUENCY);
  const serviceRef = useRef<TunerAudioService | null>(null);

  useEffect(() => {
    serviceRef.current = new TunerAudioService();
    const unsubscribe = serviceRef.current.onNoteDetected((note) => {
      setDetectedNote(note);
      if (note && serviceRef.current) {
        const closest = serviceRef.current.findClosestString(note.frequency);
        setClosestString(closest);
        if (closest) {
          setCentsFromTarget(serviceRef.current.getCentsFromTarget(note.frequency, closest));
        }
      } else {
        setClosestString(null);
        setCentsFromTarget(0);
      }
    });

    return () => {
      unsubscribe();
      serviceRef.current?.dispose();
    };
  }, []);

  const start = useCallback(async () => {
    await serviceRef.current?.start();
    setIsListening(true);
  }, []);

  const stop = useCallback(() => {
    serviceRef.current?.stop();
    setIsListening(false);
    setDetectedNote(null);
    setClosestString(null);
    setCentsFromTarget(0);
  }, []);

  const setPreset = useCallback((preset: TuningPreset) => {
    setCurrentPresetState(preset);
    serviceRef.current?.setPreset(preset);
  }, []);

  const setReferenceFrequency = useCallback((freq: number) => {
    setReferenceFrequencyState(freq);
    serviceRef.current?.setReferenceFrequency(freq);
  }, []);

  return {
    isListening,
    detectedNote,
    closestString,
    centsFromTarget,
    currentPreset,
    referenceFrequency,
    start,
    stop,
    setPreset,
    setReferenceFrequency,
  };
}
