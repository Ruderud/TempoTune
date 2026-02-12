'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { MetronomeEvent, TimeSignature } from '@tempo-tune/shared/types';
import { DEFAULT_BPM, DEFAULT_TIME_SIGNATURE } from '@tempo-tune/shared/constants';
import { MetronomeAudioService } from '../services/audio';

export function useMetronome() {
  const [bpm, setBpmState] = useState(DEFAULT_BPM);
  const [timeSignature, setTimeSignatureState] = useState<TimeSignature>(DEFAULT_TIME_SIGNATURE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const serviceRef = useRef<MetronomeAudioService | null>(null);

  useEffect(() => {
    serviceRef.current = new MetronomeAudioService();
    const unsubscribe = serviceRef.current.onTick((event: MetronomeEvent) => {
      if (event.subdivision === 0) {
        setCurrentBeat(event.beatIndex + 1);
      }
    });

    return () => {
      unsubscribe();
      serviceRef.current?.dispose();
    };
  }, []);

  const start = useCallback(async () => {
    await serviceRef.current?.start();
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    serviceRef.current?.stop();
    setIsPlaying(false);
    setCurrentBeat(0);
  }, []);

  const setBpm = useCallback((newBpm: number) => {
    setBpmState(newBpm);
    serviceRef.current?.setTempo(newBpm);
  }, []);

  const setTimeSignature = useCallback((ts: TimeSignature) => {
    setTimeSignatureState(ts);
    serviceRef.current?.setTimeSignature(ts);
  }, []);

  const loadCustomSound = useCallback(async (file: File, type: 'accent' | 'normal') => {
    await serviceRef.current?.loadCustomSound(file, type);
  }, []);

  const clearCustomSounds = useCallback(() => {
    serviceRef.current?.clearCustomSounds();
  }, []);

  return {
    bpm,
    timeSignature,
    isPlaying,
    currentBeat,
    start,
    stop,
    setBpm,
    setTimeSignature,
    loadCustomSound,
    clearCustomSounds,
  };
}
