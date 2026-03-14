'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AudioInputDevice, AudioCaptureConfig, AudioSessionState } from '@tempo-tune/shared/types';
import type { AudioInputBridge, AudioFrameConsumer } from '@tempo-tune/audio-input';
import { getAudioInputBridge } from '../services/audio-input';

/**
 * Thin hook wrapper around the singleton AudioInputBridge facade.
 * Does NOT create its own capture session — delegates everything to the facade.
 */
export function useAudioInput() {
  const [devices, setDevices] = useState<AudioInputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<AudioSessionState>({
    status: 'idle',
    timestampSource: 'monotonic',
  });

  const bridgeRef = useRef<AudioInputBridge | null>(null);

  useEffect(() => {
    const bridge = getAudioInputBridge();
    bridgeRef.current = bridge;

    const unsubState = bridge.onSessionStateChanged(setSessionState);
    const unsubRoute = bridge.onRouteChanged(setDevices);

    // Initial device enumeration
    bridge.listInputDevices().then(setDevices).catch(() => {});

    return () => {
      unsubState();
      unsubRoute();
    };
  }, []);

  const refreshDevices = useCallback(async () => {
    const bridge = bridgeRef.current;
    if (!bridge) return [];
    const list = await bridge.listInputDevices();
    setDevices(list);
    return list;
  }, []);

  const selectDevice = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    await bridgeRef.current?.selectInputDevice(deviceId);
  }, []);

  const startCapture = useCallback(async (config?: Partial<AudioCaptureConfig>) => {
    const bridge = bridgeRef.current;
    if (!bridge) return;

    const fullConfig: AudioCaptureConfig = {
      deviceId: config?.deviceId ?? selectedDeviceId ?? 'default',
      channelIndex: config?.channelIndex ?? 0,
      preferredSampleRate: config?.preferredSampleRate,
      bufferSize: config?.bufferSize ?? 1024,
      latencyOffsetMs: config?.latencyOffsetMs ?? 0,
      enablePitch: config?.enablePitch ?? true,
      enableRhythm: config?.enableRhythm ?? false,
    };

    await bridge.startCapture(fullConfig);
  }, [selectedDeviceId]);

  const stopCapture = useCallback(() => {
    bridgeRef.current?.stopCapture();
  }, []);

  const addConsumer = useCallback((consumer: AudioFrameConsumer): (() => void) => {
    const bridge = bridgeRef.current;
    if (!bridge?.addFrameConsumer) return () => {};
    return bridge.addFrameConsumer(consumer);
  }, []);

  return {
    devices,
    selectedDeviceId,
    sessionState,
    refreshDevices,
    selectDevice,
    startCapture,
    stopCapture,
    addConsumer,
  };
}
