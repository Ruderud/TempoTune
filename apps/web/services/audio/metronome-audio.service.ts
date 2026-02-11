import type { MetronomeEvent, TimeSignature } from '@tempo-tune/shared/types';
import { MetronomeEngine } from '@tempo-tune/audio/metronome';
import { resumeAudioContext } from './audio-context.service';
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
      if (event.isAccent && this.customAccentSound) {
        playAudioBuffer(this.customAccentSound);
      } else if (!event.isAccent && this.customNormalSound) {
        playAudioBuffer(this.customNormalSound);
      } else {
        playSynthesizedClick(event.isAccent);
      }
    }

    for (const callback of this.tickCallbacks) {
      callback(event);
    }
  }
}
