import type { AudioSessionState, AudioSessionStatus } from '@tempo-tune/shared/types';

/**
 * Simple state holder for the singleton capture session.
 */
export class AudioInputSessionStore {
  private state: AudioSessionState = {
    status: 'idle',
    timestampSource: 'monotonic',
  };

  private listeners = new Set<(state: AudioSessionState) => void>();

  getState(): AudioSessionState {
    return this.state;
  }

  getStatus(): AudioSessionStatus {
    return this.state.status;
  }

  isCapturing(): boolean {
    return this.state.status === 'running';
  }

  update(partial: Partial<AudioSessionState>): void {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  onChange(listener: (state: AudioSessionState) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  reset(): void {
    this.state = { status: 'idle', timestampSource: 'monotonic' };
  }

  dispose(): void {
    this.listeners.clear();
  }
}
