import type {
  BridgeCommand,
  BridgeCommandPayload,
  BridgeEvent,
  NativeMetronomeStateData,
  NativeMetronomeTickData,
} from '@tempo-tune/shared/types';
import {
  isNativeEnvironment,
  postMessageToNative,
  addNativeMessageListener,
} from '../bridge/bridge-adapter';

export { isNativeEnvironment };

type NativeMetronomeCommandType =
  | 'START_NATIVE_METRONOME'
  | 'STOP_NATIVE_METRONOME'
  | 'SET_METRONOME_BPM'
  | 'SET_METRONOME_TIME_SIG';

type NativeMetronomeCommandArgs<K extends NativeMetronomeCommandType> =
  BridgeCommandPayload<K> extends undefined
    ? []
    : [data: BridgeCommandPayload<K>];

export function sendNativeMetronomeCommand<
  K extends NativeMetronomeCommandType,
>(type: K, ...args: NativeMetronomeCommandArgs<K>): void {
  const data = args[0];
  const message = data === undefined ? { type } : { type, data };
  postMessageToNative(message as BridgeCommand<K>);
}

export function onNativeMetronomeTick(
  callback: (data: NativeMetronomeTickData) => void
): () => void {
  return addNativeMessageListener((raw) => {
    const msg = raw as BridgeEvent<'NATIVE_METRONOME_TICK'>;
    if (msg.type === 'NATIVE_METRONOME_TICK' && msg.data) {
      callback(msg.data);
    }
  });
}

export function onNativeMetronomeState(
  callback: (data: NativeMetronomeStateData) => void
): () => void {
  return addNativeMessageListener((raw) => {
    const msg = raw as BridgeEvent<'NATIVE_METRONOME_STATE'>;
    if (msg.type === 'NATIVE_METRONOME_STATE' && msg.data) {
      callback(msg.data);
    }
  });
}
