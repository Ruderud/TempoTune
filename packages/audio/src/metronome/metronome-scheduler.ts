import type { SchedulerConfig } from './metronome-engine.types';
import { DEFAULT_SCHEDULER_CONFIG } from './metronome-engine.types';

/**
 * 정밀 타이밍 스케줄러
 * Web Audio lookahead 패턴 기반, 플랫폼 독립적
 * setTimeout 기반 lookahead로 정밀한 타이밍 제공
 */
export class MetronomeScheduler {
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private config: SchedulerConfig;
  private callback: (() => void) | null = null;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
  }

  start(callback: () => void): void {
    this.callback = callback;
    this.schedule();
  }

  stop(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.callback = null;
  }

  isRunning(): boolean {
    return this.timerId !== null;
  }

  private schedule(): void {
    this.timerId = setTimeout(() => {
      if (this.callback) {
        this.callback();
        this.schedule();
      }
    }, this.config.lookaheadMs);
  }
}
