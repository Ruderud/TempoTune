export type MetronomeBridgeInterface = {
  playClick(isAccent: boolean): Promise<void>;
  vibrate(duration?: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  dispose(): void;
};
