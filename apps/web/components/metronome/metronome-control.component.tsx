'use client';

import { COMMON_TIME_SIGNATURES, MAX_BPM, MIN_BPM } from '@tempo-tune/shared/constants';

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
    const clampedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
    onBpmChange(clampedBpm);
  };

  return (
    <div className="w-full space-y-4">
      {/* BPM Precision Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => handleBpmChange(bpm - 1)}
          disabled={isPlaying}
          className={`
            w-11 h-11 rounded-lg flex items-center justify-center transition-all shrink-0
            ${isPlaying
              ? 'bg-surface/30 border border-primary/5 text-primary/30 cursor-not-allowed'
              : 'bg-surface border border-primary/10 text-primary hover:border-primary/30 active:scale-95'
            }
          `}
        >
          <span className="text-xl font-light">&minus;</span>
        </button>

        <div className="flex-1">
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            disabled={isPlaying}
            className="w-full h-1.5 bg-surface rounded-full appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(13, 242, 242) 0%, rgb(13, 242, 242) ${((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100}%, rgb(26, 46, 46) ${((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100}%, rgb(26, 46, 46) 100%)`
            }}
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
          onClick={() => handleBpmChange(bpm + 1)}
          disabled={isPlaying}
          className={`
            w-11 h-11 rounded-lg flex items-center justify-center transition-all shrink-0
            ${isPlaying
              ? 'bg-surface/30 border border-primary/5 text-primary/30 cursor-not-allowed'
              : 'bg-surface border border-primary/10 text-primary hover:border-primary/30 active:scale-95'
            }
          `}
        >
          <span className="text-xl font-light">+</span>
        </button>
      </div>

      {/* Time Signature Chips */}
      <div className="space-y-1.5">
        <span className="text-xs text-text-muted font-medium ml-1">박자 선택</span>
        <div className="flex gap-2">
          {COMMON_TIME_SIGNATURES.map((ts) => {
            const [beats, noteValue] = ts;
            const isActive = timeSignature[0] === beats && timeSignature[1] === noteValue;

            return (
              <button
                key={`${beats}/${noteValue}`}
                onClick={() => onTimeSignatureChange(ts)}
                disabled={isPlaying}
                className={`
                  flex-1 h-11 rounded-lg font-medium text-sm transition-all
                  ${isActive
                    ? 'bg-primary text-background-dark font-bold shadow-lg shadow-primary/20'
                    : 'bg-surface border border-primary/20 text-white/80 hover:border-primary/50'
                  }
                  ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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
        <span className="text-xs text-text-muted font-medium ml-1">사운드 설정</span>
        <div className="flex gap-2">
          <button
            disabled
            className="flex-1 h-11 rounded-lg bg-surface border border-primary/10 text-xs text-white/40 cursor-not-allowed"
          >
            나무 (Wood)
          </button>
          <button
            disabled
            className="flex-1 h-11 rounded-lg bg-primary/20 border border-primary/50 text-primary text-xs cursor-not-allowed"
          >
            전자음 (Digital)
          </button>
        </div>
      </div>

      {/* Play/Stop Action */}
      <button
        onClick={isPlaying ? onStop : onStart}
        className={`
          w-full h-14 rounded-xl flex items-center justify-center gap-3 transition-all font-bold text-lg tracking-wider
          ${isPlaying
            ? 'bg-background-dark border-2 border-primary text-primary breathing-glow active:scale-[0.98]'
            : 'bg-primary text-background-dark glow-primary-strong active:scale-[0.98] shadow-2xl shadow-primary/10'
          }
        `}
      >
        <span className="text-2xl">{isPlaying ? '■' : '▶'}</span>
        <span>{isPlaying ? '정지' : '시작'}</span>
      </button>
    </div>
  );
}
