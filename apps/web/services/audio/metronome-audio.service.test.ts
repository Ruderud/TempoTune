import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MetronomeEvent } from '@tempo-tune/shared/types';

const audioMocks = vi.hoisted(() => ({
  playSynthesizedClick: vi.fn(),
  playAudioBuffer: vi.fn(),
}));

vi.mock('./audio-context.service', () => ({
  getAudioContext: () => ({ currentTime: 10 }),
  resumeAudioContext: vi.fn(),
}));

vi.mock('./sound-loader.service', () => ({
  ...audioMocks,
  loadSoundFromFile: vi.fn(),
}));

import { MetronomeAudioService } from './metronome-audio.service';

describe('MetronomeAudioService scheduled audio', () => {
  let service: MetronomeAudioService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(performance, 'now').mockReturnValue(1_000);
    service = new MetronomeAudioService();
  });

  afterEach(() => {
    service.dispose();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('stop 시 lookahead로 예약된 Web Audio source와 UI callback을 취소해야 한다', () => {
    const source = {
      addEventListener: vi.fn(),
      stop: vi.fn(),
    } as unknown as AudioScheduledSourceNode;
    audioMocks.playSynthesizedClick.mockReturnValue(source);
    const callback = vi.fn();
    service.onTick(callback);

    const event: MetronomeEvent = {
      beatIndex: 0,
      isAccent: true,
      timestamp: 1_080,
      subdivision: 0,
    };
    (
      service as unknown as { handleTick: (scheduledEvent: MetronomeEvent) => void }
    ).handleTick(event);

    expect(audioMocks.playSynthesizedClick).toHaveBeenCalledWith(true, 0.8, 10.08);
    expect(callback).not.toHaveBeenCalled();

    service.stop();
    vi.advanceTimersByTime(100);

    expect(source.stop).toHaveBeenCalledOnce();
    expect(callback).not.toHaveBeenCalled();
  });

  it('lookahead UI callback은 예약 timestamp에 한 번만 전달해야 한다', () => {
    const source = {
      addEventListener: vi.fn(),
      stop: vi.fn(),
    } as unknown as AudioScheduledSourceNode;
    audioMocks.playSynthesizedClick.mockReturnValue(source);
    const callback = vi.fn();
    service.onTick(callback);
    const event: MetronomeEvent = {
      beatIndex: 1,
      isAccent: false,
      timestamp: 1_080,
      subdivision: 0,
    };

    (
      service as unknown as { handleTick: (scheduledEvent: MetronomeEvent) => void }
    ).handleTick(event);

    vi.advanceTimersByTime(79);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(event);
  });

  it('재생이 끝난 source는 pending 목록에서 제거해야 한다', () => {
    let onEnded: (() => void) | undefined;
    const source = {
      addEventListener: vi.fn((_event: string, callback: EventListenerOrEventListenerObject) => {
        onEnded = callback as () => void;
      }),
      stop: vi.fn(),
    } as unknown as AudioScheduledSourceNode;
    audioMocks.playSynthesizedClick.mockReturnValue(source);

    (
      service as unknown as { handleTick: (scheduledEvent: MetronomeEvent) => void }
    ).handleTick({
      beatIndex: 0,
      isAccent: true,
      timestamp: 1_080,
      subdivision: 0,
    });
    onEnded?.();
    service.stop();

    expect(source.stop).not.toHaveBeenCalled();
  });
});
