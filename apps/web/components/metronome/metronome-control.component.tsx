'use client';

import type { CSSProperties } from 'react';
import { Minus, Play, Plus, Square } from 'lucide-react';
import {
  COMMON_TIME_SIGNATURES,
  MAX_BPM,
  MIN_BPM,
} from '@tempo-tune/shared/constants';
import { clamp } from '@tempo-tune/shared/utils';
import { Icon } from '../common/icon.component';

type MetronomeControlProps = {
  bpm: number;
  timeSignature: [number, number];
  isPlaying: boolean;
  onBpmChange: (bpm: number) => void;
  onTimeSignatureChange: (ts: [number, number]) => void;
  onStart: () => void;
  onStop: () => void;
  onLoadCustomSound?: (file: File, type: 'accent' | 'normal') => void;
};

export function MetronomeControl({
  bpm,
  timeSignature,
  isPlaying,
  onBpmChange,
  onTimeSignatureChange,
  onStart,
  onStop,
}: MetronomeControlProps) {
  const handleBpmChange = (newBpm: number) => {
    const clampedBpm = clamp(newBpm, MIN_BPM, MAX_BPM);
    onBpmChange(clampedBpm);
  };
  const sliderProgress = `${((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100}%`;

  return (
    <div className="w-full space-y-4">
      {/* BPM Precision Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          data-testid="bpm-decrement"
          onClick={() => handleBpmChange(bpm - 1)}
          className="w-14 h-14 rounded-xl flex items-center justify-center transition-all shrink-0 bg-card-soft border border-border-subtle text-primary hover:border-primary/30 active:scale-95"
        >
          <Icon icon={Minus} size={20} className="text-primary" />
        </button>

        <div className="flex-1">
          <input
            data-testid="bpm-slider"
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer slider"
            style={{ '--slider-progress': sliderProgress } as CSSProperties}
          />
          {/* Desktop: Tempo scale labels */}
          <div className="hidden lg:flex justify-between mt-1 text-xs text-text-muted px-1">
            <span>Largo</span>
            <span>Andante</span>
            <span>Moderato</span>
            <span>Allegro</span>
            <span>Presto</span>
          </div>
        </div>

        <button
          data-testid="bpm-increment"
          onClick={() => handleBpmChange(bpm + 1)}
          className="w-14 h-14 rounded-xl flex items-center justify-center transition-all shrink-0 bg-card-soft border border-border-subtle text-primary hover:border-primary/30 active:scale-95"
        >
          <Icon icon={Plus} size={20} className="text-primary" />
        </button>
      </div>

      {/* Time Signature Chips */}
      <div className="space-y-1.5">
        <div className="text-xs text-text-muted font-medium ml-1 mb-3">
          박자 선택
        </div>
        <div className="flex gap-2">
          {COMMON_TIME_SIGNATURES.map((ts) => {
            const [beats, noteValue] = ts;
            const isActive =
              timeSignature[0] === beats && timeSignature[1] === noteValue;

            return (
              <button
                key={`${beats}/${noteValue}`}
                data-testid={`time-sig-${beats}-${noteValue}`}
                onClick={() => onTimeSignatureChange(ts)}
                className={`
                  flex-1 h-11 rounded-lg font-medium text-sm transition-all cursor-pointer
                  ${
                    isActive
                      ? 'bg-primary text-background-dark font-bold shadow-lg shadow-primary/20'
                      : 'bg-surface border border-primary/20 text-text-primary hover:border-primary/50'
                  }
                `}
              >
                {beats}/{noteValue}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sound Presets */}
      <div className="space-y-1.5">
        <div className="text-xs text-text-muted font-medium ml-1 mb-3">
          사운드 설정
        </div>
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            disabled
            className="shrink-0 px-6 py-2.5 rounded-full bg-card-strong border border-border-subtle text-xs text-text-primary cursor-not-allowed"
          >
            나무 (Wood)
          </button>
          <button
            disabled
            className="shrink-0 px-6 py-2.5 rounded-full bg-primary/20 border border-primary/50 text-primary text-xs cursor-not-allowed"
          >
            전자음 (Digital)
          </button>
          <button
            disabled
            className="shrink-0 px-6 py-2.5 rounded-full bg-card-strong border border-border-subtle text-xs text-text-primary cursor-not-allowed"
          >
            박수 (Clap)
          </button>
          <button
            disabled
            className="shrink-0 px-6 py-2.5 rounded-full bg-card-strong border border-border-subtle text-xs text-text-primary cursor-not-allowed"
          >
            틱 (Tick)
          </button>
        </div>
      </div>

      {/* Play/Stop Action */}
      <button
        data-testid="metronome-play-stop"
        onClick={isPlaying ? onStop : onStart}
        className={`
          w-full py-5 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold text-lg tracking-wider
          ${
            isPlaying
              ? 'bg-background-dark border-2 border-primary text-primary breathing-glow active:scale-[0.98]'
              : 'bg-primary border-2 border-transparent text-background-dark shadow-lg shadow-primary/20 active:scale-[0.98]'
          }
        `}
      >
        <Icon
          icon={isPlaying ? Square : Play}
          size={20}
          className={isPlaying ? 'text-primary' : 'text-background-dark'}
        />
        <span>{isPlaying ? '정지' : '시작'}</span>
      </button>
    </div>
  );
}
