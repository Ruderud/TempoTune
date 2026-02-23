'use client';

import { useState, useCallback, useRef } from 'react';
import { clamp } from '@tempo-tune/shared/utils';

const MAX_HISTORY_POINTS = 90;
const MAX_HISTORY_CENTS = 50;
const SMOOTHING_WINDOW = 5;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export type UseTunerHistoryReturn = {
  centsHistory: number[];
  graphCursorCentsRef: React.MutableRefObject<number>;
  latestSmoothedCentsRef: React.MutableRefObject<number>;
  smoothingBufferRef: React.MutableRefObject<number[]>;
  activeTargetForSmoothingRef: React.MutableRefObject<string | null>;
  clearSmoothingState: () => void;
  clearHistory: () => void;
  appendHistoryPoint: (value: number) => void;
  pushToSmoothingBuffer: (clampedCents: number) => number;
};

export function useTunerHistory(): UseTunerHistoryReturn {
  const [centsHistory, setCentsHistory] = useState<number[]>([]);

  const graphCursorCentsRef = useRef(0);
  const latestSmoothedCentsRef = useRef(0);
  const smoothingBufferRef = useRef<number[]>([]);
  const activeTargetForSmoothingRef = useRef<string | null>(null);

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

  const appendHistoryPoint = useCallback((value: number) => {
    setCentsHistory((prev) => {
      const next = [...prev, clamp(value, -MAX_HISTORY_CENTS, MAX_HISTORY_CENTS)];
      if (next.length > MAX_HISTORY_POINTS) next.shift();
      return next;
    });
  }, []);

  const pushToSmoothingBuffer = useCallback((clampedCents: number): number => {
    smoothingBufferRef.current.push(clampedCents);
    if (smoothingBufferRef.current.length > SMOOTHING_WINDOW) {
      smoothingBufferRef.current.shift();
    }
    return average(smoothingBufferRef.current);
  }, []);

  return {
    centsHistory,
    graphCursorCentsRef,
    latestSmoothedCentsRef,
    smoothingBufferRef,
    activeTargetForSmoothingRef,
    clearSmoothingState,
    clearHistory,
    appendHistoryPoint,
    pushToSmoothingBuffer,
  };
}
