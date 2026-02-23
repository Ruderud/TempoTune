'use client';

import { useState, useCallback, useRef } from 'react';

export type UseTunerSignalStateReturn = {
  hasSignal: boolean;
  pitchConfidence: number;
  isLowConfidence: boolean;
  centsFromTarget: number;
  hasSignalRef: React.MutableRefObject<boolean>;
  confidenceRef: React.MutableRefObject<number>;
  lastSignalAtRef: React.MutableRefObject<number | null>;
  setHasSignal: (value: boolean) => void;
  setPitchConfidence: (value: number) => void;
  setIsLowConfidence: (value: boolean) => void;
  setCentsFromTarget: (value: number) => void;
  clearSignalState: () => void;
};

export function useTunerSignalState(clearSmoothingState: () => void): UseTunerSignalStateReturn {
  const [hasSignal, setHasSignalState] = useState(false);
  const [pitchConfidence, setPitchConfidenceState] = useState(0);
  const [isLowConfidence, setIsLowConfidenceState] = useState(false);
  const [centsFromTarget, setCentsFromTargetState] = useState(0);

  const hasSignalRef = useRef(false);
  const confidenceRef = useRef(0);
  const lastSignalAtRef = useRef<number | null>(null);

  const setHasSignal = useCallback((value: boolean) => {
    hasSignalRef.current = value;
    setHasSignalState(value);
  }, []);

  const setPitchConfidence = useCallback((value: number) => {
    confidenceRef.current = value;
    setPitchConfidenceState(value);
  }, []);

  const setIsLowConfidence = useCallback((value: boolean) => {
    setIsLowConfidenceState(value);
  }, []);

  const setCentsFromTarget = useCallback((value: number) => {
    setCentsFromTargetState(value);
  }, []);

  const clearSignalState = useCallback(() => {
    hasSignalRef.current = false;
    setHasSignalState(false);
    confidenceRef.current = 0;
    setPitchConfidenceState(0);
    setIsLowConfidenceState(false);
    lastSignalAtRef.current = null;
    clearSmoothingState();
  }, [clearSmoothingState]);

  return {
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
  };
}
