import type { BridgeMessage } from '../types';

export type BridgeEventHandler<T = unknown> = (message: BridgeMessage<T>) => void;

export type BridgeEventMap = {
  message: BridgeEventHandler;
  error: (error: Error) => void;
  connected: () => void;
  disconnected: () => void;
};

export type NativeBridgeConfig = {
  timeout: number;
  retryCount: number;
  debug: boolean;
};

export const DEFAULT_BRIDGE_CONFIG: NativeBridgeConfig = {
  timeout: 5000,
  retryCount: 3,
  debug: false,
};
