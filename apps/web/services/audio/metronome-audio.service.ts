import type { MetronomeEvent, TimeSignature } from '@tempo-tune/shared/types';
import { MetronomeEngine } from '@tempo-tune/audio/metronome';
import { resumeAudioContext, getAudioContext } from './audio-context.service';
import { playSynthesizedClick, loadSoundFromFile, playAudioBuffer } from './sound-loader.service';

export class MetronomeAudioService {
  private engine: MetronomeEngine;
  private customAccentSound: AudioBuffer | null = null;
  private customNormalSound: AudioBuffer | null = null;
  private tickCallbacks: Set<(event: MetronomeEvent) => void> = new Set();

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
    this.tickCallbacks.clear();
  }

  private handleTick(event: MetronomeEvent): void {
    // 메인 비트에서만 소리 재생 (subdivision 0)
    if (event.subdivision === 0) {
      // Convert the engine's performance.now() timestamp to AudioContext time.
      // AudioContext.currentTime and performance.now() share the same epoch, so
      // the delta gives us precise scheduling even when the callback fires late.
      const ctx = getAudioContext();
      const offsetSec = (event.timestamp - performance.now()) / 1000;
      // Clamp to ctx.currentTime in case the tick is already overdue.
      const audioScheduledTime = Math.max(ctx.currentTime, ctx.currentTime + offsetSec);

      if (event.isAccent && this.customAccentSound) {
        playAudioBuffer(this.customAccentSound, 0.8, audioScheduledTime);
      } else if (!event.isAccent && this.customNormalSound) {
        playAudioBuffer(this.customNormalSound, 0.8, audioScheduledTime);
      } else {
        playSynthesizedClick(event.isAccent, 0.8, audioScheduledTime);
      }
    }

    for (const callback of this.tickCallbacks) {
      callback(event);
    }
  }
}
