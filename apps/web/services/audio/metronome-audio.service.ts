import type { MetronomeEvent, TimeSignature } from '@tempo-tune/shared/types';
import { MetronomeEngine } from '@tempo-tune/audio/metronome';
import { resumeAudioContext, getAudioContext } from './audio-context.service';
import { playSynthesizedClick, loadSoundFromFile, playAudioBuffer } from './sound-loader.service';

export class MetronomeAudioService {
  private engine: MetronomeEngine;
  private customAccentSound: AudioBuffer | null = null;
  private customNormalSound: AudioBuffer | null = null;
  private tickCallbacks: Set<(event: MetronomeEvent) => void> = new Set();
  private pendingTickCallbacks: Set<ReturnType<typeof setTimeout>> = new Set();
  private pendingAudioSources: Set<AudioScheduledSourceNode> = new Set();

  constructor() {
    this.engine = new MetronomeEngine();
    this.engine.onTick((event) => this.handleTick(event));
  }

  async start(): Promise<void> {
    await resumeAudioContext();
    this.engine.start();
  }

  stop(): void {
    this.engine.stop();
    this.clearPendingTickCallbacks();
    this.clearPendingAudioSources();
  }

  setTempo(bpm: number): void {
    this.engine.setTempo(bpm);
  }

  setTimeSignature(timeSignature: TimeSignature): void {
    this.engine.setTimeSignature(timeSignature);
  }

  async loadCustomSound(file: File, type: 'accent' | 'normal'): Promise<void> {
    const buffer = await loadSoundFromFile(file);
    if (type === 'accent') {
      this.customAccentSound = buffer;
    } else {
      this.customNormalSound = buffer;
    }
  }

  clearCustomSounds(): void {
    this.customAccentSound = null;
    this.customNormalSound = null;
  }

  onTick(callback: (event: MetronomeEvent) => void): () => void {
    this.tickCallbacks.add(callback);
    return () => { this.tickCallbacks.delete(callback); };
  }

  getTempo(): number {
    return this.engine.getTempo();
  }

  getIsPlaying(): boolean {
    return this.engine.getIsPlaying();
  }

  dispose(): void {
    this.engine.dispose();
    this.clearPendingTickCallbacks();
    this.clearPendingAudioSources();
    this.tickCallbacks.clear();
  }

  private handleTick(event: MetronomeEvent): void {
    // 메인 비트에서만 소리 재생 (subdivision 0)
    if (event.subdivision === 0) {
      // Convert the monotonic performance timestamp to AudioContext time by
      // sampling both clocks together. Their epochs are unrelated; the delta
      // is the only value that crosses the clock boundary.
      const ctx = getAudioContext();
      const offsetSec = (event.timestamp - performance.now()) / 1000;
      // Clamp to ctx.currentTime in case the tick is already overdue.
      const audioScheduledTime = Math.max(ctx.currentTime, ctx.currentTime + offsetSec);

      let source: AudioScheduledSourceNode;
      if (event.isAccent && this.customAccentSound) {
        source = playAudioBuffer(this.customAccentSound, 0.8, audioScheduledTime);
      } else if (!event.isAccent && this.customNormalSound) {
        source = playAudioBuffer(this.customNormalSound, 0.8, audioScheduledTime);
      } else {
        source = playSynthesizedClick(event.isAccent, 0.8, audioScheduledTime);
      }
      this.trackAudioSource(source);
    }

    const callbackDelayMs = event.timestamp - performance.now();
    if (callbackDelayMs <= 0) {
      this.emitTickCallbacks(event);
      return;
    }

    const timerId = setTimeout(() => {
      this.pendingTickCallbacks.delete(timerId);
      this.emitTickCallbacks(event);
    }, callbackDelayMs);
    this.pendingTickCallbacks.add(timerId);
  }

  private emitTickCallbacks(event: MetronomeEvent): void {
    for (const callback of this.tickCallbacks) callback(event);
  }

  private clearPendingTickCallbacks(): void {
    for (const timerId of this.pendingTickCallbacks) clearTimeout(timerId);
    this.pendingTickCallbacks.clear();
  }

  private trackAudioSource(source: AudioScheduledSourceNode): void {
    this.pendingAudioSources.add(source);
    source.addEventListener('ended', () => this.pendingAudioSources.delete(source), { once: true });
  }

  private clearPendingAudioSources(): void {
    for (const source of this.pendingAudioSources) {
      try {
        source.stop();
      } catch {
        // The source may already have reached its scheduled stop time.
      }
    }
    this.pendingAudioSources.clear();
  }
}
