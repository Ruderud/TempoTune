'use client';

type MetronomeDisplayProps = {
  bpm: number;
  currentBeat: number;
  timeSignature: [number, number];
  isPlaying: boolean;
};

function getTempoMarking(bpm: number): string {
  if (bpm < 40) return 'GRAVE';
  if (bpm < 55) return 'LARGO';
  if (bpm < 70) return 'ADAGIO';
  if (bpm < 85) return 'ANDANTE';
  if (bpm < 100) return 'MODERATO';
  if (bpm < 130) return 'ALLEGRO';
  if (bpm < 170) return 'VIVACE';
  if (bpm < 210) return 'PRESTO';
  return 'PRESTISSIMO';
}

export function MetronomeDisplay({
  bpm,
  currentBeat,
  timeSignature,
  isPlaying,
}: MetronomeDisplayProps) {
  const [beatsPerMeasure] = timeSignature;
  const beats = Array.from({ length: beatsPerMeasure }, (_, i) => i + 1);
  const tempoMarking = getTempoMarking(bpm);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 lg:space-y-8">
      {/* Beat Indicators */}
      <div className="flex items-center gap-3 lg:gap-6 py-1">
        {beats.map((beat) => {
          const isCurrentBeat = isPlaying && beat === currentBeat;
          const isAccent = beat === 1;

          return (
            <div key={beat} className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-4 h-4 lg:w-6 lg:h-6 rounded-full transition-all duration-100
                  ${isCurrentBeat
                    ? 'bg-primary glow-beat ring-4 ring-primary/20'
                    : isAccent
                      ? 'bg-surface border-2 border-primary/40'
                      : 'bg-surface border border-primary/20'
                  }
                `}
              />
              {isAccent && isCurrentBeat && (
                <span className="text-xs text-primary font-semibold hidden lg:block">DOWNBEAT</span>
              )}
            </div>
          );
        })}
      </div>

      {/* BPM Display */}
      <div className="flex flex-col items-center">
        <span className="text-8xl lg:text-[160px] font-bold tracking-tighter tabular-nums leading-none text-primary glow-text">
          {bpm}
        </span>
        <span className="text-primary tracking-[0.4em] font-medium text-sm lg:text-xl mt-2 opacity-60">BPM</span>
        <span className="text-xs lg:text-sm font-semibold tracking-[0.3em] text-text-muted mt-1">{tempoMarking}</span>
      </div>
    </div>
  );
}
