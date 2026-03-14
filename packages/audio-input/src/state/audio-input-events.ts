import type { AudioSessionState, PitchDetectionEvent, RhythmHitEvent, AudioInputDevice } from '@tempo-tune/shared/types';

type Callback<T> = (data: T) => void;

/**
 * Simple typed event emitter for audio input events.
 * Provides fan-out from a single adapter to multiple consumers.
 */
export class AudioInputEventBus {
  private sessionStateCallbacks = new Set<Callback<AudioSessionState>>();
  private pitchCallbacks = new Set<Callback<PitchDetectionEvent>>();
  private rhythmCallbacks = new Set<Callback<RhythmHitEvent>>();
  private routeCallbacks = new Set<Callback<AudioInputDevice[]>>();
  private errorCallbacks = new Set<Callback<Error>>();

  onSessionStateChanged(cb: Callback<AudioSessionState>): () => void {
    this.sessionStateCallbacks.add(cb);
    return () => { this.sessionStateCallbacks.delete(cb); };
  }

  onPitchDetected(cb: Callback<PitchDetectionEvent>): () => void {
    this.pitchCallbacks.add(cb);
    return () => { this.pitchCallbacks.delete(cb); };
  }

  onRhythmHitDetected(cb: Callback<RhythmHitEvent>): () => void {
    this.rhythmCallbacks.add(cb);
    return () => { this.rhythmCallbacks.delete(cb); };
  }

  onRouteChanged(cb: Callback<AudioInputDevice[]>): () => void {
    this.routeCallbacks.add(cb);
    return () => { this.routeCallbacks.delete(cb); };
  }

  onError(cb: Callback<Error>): () => void {
    this.errorCallbacks.add(cb);
    return () => { this.errorCallbacks.delete(cb); };
  }

  emitSessionState(state: AudioSessionState): void {
    for (const cb of this.sessionStateCallbacks) cb(state);
  }

  emitPitch(event: PitchDetectionEvent): void {
    for (const cb of this.pitchCallbacks) cb(event);
  }

  emitRhythmHit(event: RhythmHitEvent): void {
    for (const cb of this.rhythmCallbacks) cb(event);
  }

  emitRouteChanged(devices: AudioInputDevice[]): void {
    for (const cb of this.routeCallbacks) cb(devices);
  }

  emitError(error: Error): void {
    for (const cb of this.errorCallbacks) cb(error);
  }

  dispose(): void {
    this.sessionStateCallbacks.clear();
    this.pitchCallbacks.clear();
    this.rhythmCallbacks.clear();
    this.routeCallbacks.clear();
    this.errorCallbacks.clear();
  }
}
