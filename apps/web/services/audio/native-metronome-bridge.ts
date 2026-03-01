import type { BridgeMessage } from '@tempo-tune/shared/types';
import { isNativeEnvironment, postMessageToNative, addNativeMessageListener } from '../bridge/bridge-adapter';

export { isNativeEnvironment };

type NativeMetronomeTickData = {
  beatIndex: number;
  isAccent: boolean;
  timestamp: number;
};

type NativeMetronomeStateData = {
  isPlaying: boolean;
  bpm: number;
  beatsPerMeasure?: number;
};

export function sendNativeMetronomeCommand(
  type: 'START_NATIVE_METRONOME' | 'STOP_NATIVE_METRONOME' | 'SET_METRONOME_BPM' | 'SET_METRONOME_TIME_SIG',
  data?: Record<string, unknown>,
): void {
  postMessageToNative({ type, data });
}

export function onNativeMetronomeTick(
  callback: (data: NativeMetronomeTickData) => void,
): () => void {
  return addNativeMessageListener((raw) => {
    const msg = raw as BridgeMessage<NativeMetronomeTickData>;
    if (msg.type === 'NATIVE_METRONOME_TICK' && msg.data) {
      callback(msg.data);
    }
  });
}

export function onNativeMetronomeState(
  callback: (data: NativeMetronomeStateData) => void,
): () => void {
  return addNativeMessageListener((raw) => {
    const msg = raw as BridgeMessage<NativeMetronomeStateData>;
    if (msg.type === 'NATIVE_METRONOME_STATE' && msg.data) {
      callback(msg.data);
    }
  });
}
