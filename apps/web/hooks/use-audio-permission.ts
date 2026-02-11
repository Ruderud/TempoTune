'use client';

import { useState, useCallback } from 'react';
import type { AudioPermissionStatus } from '@tempo-tune/shared/types';

export function useAudioPermission() {
  const [status, setStatus] = useState<AudioPermissionStatus>('undetermined');
  const [isRequesting, setIsRequesting] = useState(false);

  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setStatus('granted');
    } catch {
      setStatus('denied');
    } finally {
      setIsRequesting(false);
    }
  }, []);

  const checkPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (result.state === 'granted') setStatus('granted');
      else if (result.state === 'denied') setStatus('denied');
      else setStatus('undetermined');
    } catch {
      setStatus('undetermined');
    }
  }, []);

  return { status, isRequesting, requestPermission, checkPermission };
}
