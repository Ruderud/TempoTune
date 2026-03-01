'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { MetronomeEvent, TimeSignature } from '@tempo-tune/shared/types';
import { DEFAULT_BPM, DEFAULT_TIME_SIGNATURE } from '@tempo-tune/shared/constants';
import { MetronomeAudioService } from '../services/audio';
import {
  isNativeEnvironment,
  sendNativeMetronomeCommand,
  onNativeMetronomeTick,
  onNativeMetronomeState,
} from '../services/audio/native-metronome-bridge';

export function useMetronome() {
  const [bpm, setBpmState] = useState(DEFAULT_BPM);
  const [timeSignature, setTimeSignatureState] = useState<TimeSignature>(DEFAULT_TIME_SIGNATURE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const serviceRef = useRef<MetronomeAudioService | null>(null);
  const isNativeRef = useRef(false);

  useEffect(() => {
    isNativeRef.current = isNativeEnvironment();

    if (isNativeRef.current) {
      // Native path: listen for tick/state events from iOS native module
      const unsubTick = onNativeMetronomeTick((data) => {
        setCurrentBeat(data.beatIndex + 1);
      });

      const unsubState = onNativeMetronomeState((data) => {
        // Sync state from lock screen / Dynamic Island controls
        setIsPlaying(data.isPlaying);
        setBpmState(data.bpm);
        if (data.beatsPerMeasure != null) {
          setTimeSignatureState((prev) =>
            prev[0] === data.beatsPerMeasure ? prev : [data.beatsPerMeasure!, prev[1]],
          );
        }
      });

      return () => {
        unsubTick();
        unsubState();
      };
    }

    // Web path: use Web Audio API
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
    if (isNativeRef.current) {
      sendNativeMetronomeCommand('START_NATIVE_METRONOME', {
        bpm,
        beatsPerMeasure: timeSignature[0],
        accentFirst: true,
      });
    } else {
      await serviceRef.current?.start();
    }
    setIsPlaying(true);
  }, [bpm, timeSignature]);

  const stop = useCallback(() => {
    if (isNativeRef.current) {
      sendNativeMetronomeCommand('STOP_NATIVE_METRONOME');
    } else {
      serviceRef.current?.stop();
    }
    setIsPlaying(false);
    setCurrentBeat(0);
  }, []);

  const setBpm = useCallback((newBpm: number) => {
    setBpmState(newBpm);
    if (isNativeRef.current) {
      sendNativeMetronomeCommand('SET_METRONOME_BPM', { bpm: newBpm });
    } else {
      serviceRef.current?.setTempo(newBpm);
    }
  }, []);

  const setTimeSignature = useCallback((ts: TimeSignature) => {
    setTimeSignatureState(ts);
    if (isNativeRef.current) {
      sendNativeMetronomeCommand('SET_METRONOME_TIME_SIG', { beatsPerMeasure: ts[0] });
    } else {
      serviceRef.current?.setTimeSignature(ts);
    }
  }, []);

  const loadCustomSound = useCallback(async (file: File, type: 'accent' | 'normal') => {
    // Custom sounds only supported on web path
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
