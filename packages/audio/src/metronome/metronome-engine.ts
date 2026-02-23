import type { MetronomeEvent, TimeSignature } from '@tempo-tune/shared/types';
import { DEFAULT_BPM, DEFAULT_TIME_SIGNATURE, MIN_BPM, MAX_BPM } from '@tempo-tune/shared/constants';
import { bpmToMs, clamp } from '@tempo-tune/shared/utils';
import type { MetronomeEngineConfig, MetronomeTickCallback } from './metronome-engine.types';
import { MetronomeScheduler } from './metronome-scheduler';

export class MetronomeEngine {
  private config: MetronomeEngineConfig;
  private scheduler: MetronomeScheduler;
  private callbacks: Set<MetronomeTickCallback> = new Set();
  private currentBeat = 0;
  private currentSubdivision = 0;
  private nextTickTime = 0;
  private isRunning = false;
  private isFirstTick = false;

  constructor(config?: Partial<MetronomeEngineConfig>) {
    this.config = {
      bpm: config?.bpm ?? DEFAULT_BPM,
      timeSignature: config?.timeSignature ?? DEFAULT_TIME_SIGNATURE,
      accentFirst: config?.accentFirst ?? true,
      subdivision: config?.subdivision ?? 1,
    };
    this.scheduler = new MetronomeScheduler();
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentBeat = 0;
    this.currentSubdivision = 0;
    this.isFirstTick = true;
    this.scheduler.start(() => this.processTick());
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.scheduler.stop();
    this.currentBeat = 0;
    this.currentSubdivision = 0;
  }

  setTempo(bpm: number): void {
    this.config.bpm = clamp(bpm, MIN_BPM, MAX_BPM);
  }

  setTimeSignature(timeSignature: TimeSignature): void {
    this.config.timeSignature = timeSignature;
    if (this.currentBeat >= timeSignature[0]) {
      this.currentBeat = 0;
    }
  }

  setAccentFirst(accent: boolean): void {
    this.config.accentFirst = accent;
  }

  setSubdivision(subdivision: number): void {
    this.config.subdivision = Math.max(1, subdivision);
  }

  onTick(callback: MetronomeTickCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  getTempo(): number {
    return this.config.bpm;
  }

  getTimeSignature(): TimeSignature {
    return this.config.timeSignature;
  }

  getIsPlaying(): boolean {
    return this.isRunning;
  }

  getCurrentBeat(): number {
    return this.currentBeat;
  }

  dispose(): void {
    this.stop();
    this.callbacks.clear();
  }

  private processTick(): void {
    const now = performance.now();

    if (this.isFirstTick) {
      this.nextTickTime = now;
      this.isFirstTick = false;
    }

    const subdivisionInterval = bpmToMs(this.config.bpm) / this.config.subdivision;

    // If the gap is larger than 3 beat intervals (e.g. tab was backgrounded),
    // reset scheduling from now instead of catching up.
    const maxGapMs = subdivisionInterval * 3;
    if (now - this.nextTickTime > maxGapMs) {
      this.nextTickTime = now;
    }

    // Cap burst recovery: process at most 3 ticks per scheduling cycle.
    const MAX_TICKS_PER_CYCLE = 3;
    let ticksThisCycle = 0;

    while (this.nextTickTime <= now && ticksThisCycle < MAX_TICKS_PER_CYCLE) {
      const isMainBeat = this.currentSubdivision === 0;
      const isAccent = isMainBeat && this.currentBeat === 0 && this.config.accentFirst;

      const event: MetronomeEvent = {
        beatIndex: this.currentBeat,
        isAccent,
        timestamp: this.nextTickTime,
        subdivision: this.currentSubdivision,
      };

      this.emitTick(event);

      this.currentSubdivision++;
      if (this.currentSubdivision >= this.config.subdivision) {
        this.currentSubdivision = 0;
        this.currentBeat = (this.currentBeat + 1) % this.config.timeSignature[0];
      }

      this.nextTickTime += subdivisionInterval;
      ticksThisCycle++;
    }
  }

  private emitTick(event: MetronomeEvent): void {
    for (const callback of this.callbacks) {
      callback(event);
    }
  }
}
