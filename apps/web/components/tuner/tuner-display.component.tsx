'use client';

import type { TunerNote, TuningString } from '@tempo-tune/shared/types';

type TunerDisplayProps = {
  detectedNote: TunerNote | null;
  closestString: TuningString | null;
  centsFromTarget: number;
  isListening: boolean;
};

export function TunerDisplay({
  detectedNote,
  closestString,
  centsFromTarget,
  isListening,
}: TunerDisplayProps) {
  const clampedCents = Math.max(-50, Math.min(50, centsFromTarget));
  const needlePosition = detectedNote ? ((clampedCents + 50) / 100) * 100 : 50;

  const isInTune = detectedNote !== null && Math.abs(centsFromTarget) < 5;
  const isClose = detectedNote !== null && Math.abs(centsFromTarget) < 15;

  const getTone = () => {
    if (!detectedNote) {
      return {
        color: 'var(--color-text-muted)',
        background: 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
        shadow: 'none',
        noteColor: 'var(--color-text-strong)',
      };
    }

    if (isInTune) {
      return {
        color: 'var(--color-primary)',
        background: 'color-mix(in srgb, var(--color-primary) 16%, transparent)',
        shadow: '0 0 16px color-mix(in srgb, var(--color-primary) 34%, transparent)',
        noteColor: 'var(--color-primary)',
      };
    }

    if (isClose) {
      return {
        color: 'var(--color-text-secondary)',
        background: 'color-mix(in srgb, var(--color-text-secondary) 16%, transparent)',
        shadow: '0 0 14px color-mix(in srgb, var(--color-text-secondary) 24%, transparent)',
        noteColor: 'var(--color-text-strong)',
      };
    }

    return {
      color: 'var(--color-danger)',
      background: 'color-mix(in srgb, var(--color-danger) 16%, transparent)',
      shadow: '0 0 16px color-mix(in srgb, var(--color-danger) 34%, transparent)',
      noteColor: 'var(--color-danger)',
    };
  };

  const tone = getTone();

  const directionHint = !detectedNote
    ? isListening ? '소리를 감지하는 중...' : ''
    : isInTune
      ? '완벽!'
      : centsFromTarget < 0
        ? '음조 올리기'
        : '음조 내리기';

  const displayNote = detectedNote ? detectedNote.name : '--';
  const displayOctave = detectedNote ? detectedNote.octave : null;
  const displayFrequency = detectedNote
    ? `${detectedNote.frequency.toFixed(1)} Hz`
    : '';

  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-2">
      {/* Needle Indicator Bar */}
      <div className="w-full max-w-sm relative">
        <div className="relative h-20 flex items-center">
          {/* Flat / Sharp labels */}
          <span className="absolute left-0 top-2 text-2xl text-text-muted select-none">&#9837;</span>
          <span className="absolute right-0 top-2 text-2xl text-text-muted select-none">&#9839;</span>

          {/* Bar area */}
          <div className="w-full mx-10 relative h-full flex items-center">
            {/* Grid lines */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between items-center">
              {Array.from({ length: 21 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-px ${
                    i === 10
                      ? 'h-8 bg-text-secondary/45'
                      : i % 5 === 0
                        ? 'h-5 bg-border-subtle'
                        : 'h-3 bg-border-subtle/60'
                  }`}
                />
              ))}
            </div>

            {/* Center target line */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-10 rounded-full bg-text-secondary/30" />

            {/* Needle bubble */}
            {detectedNote && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-100 ease-out z-10"
                style={{ left: `${needlePosition}%` }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 backdrop-blur-sm transition-colors duration-150"
                  style={{
                    borderColor: tone.color,
                    backgroundColor: tone.background,
                    color: tone.color,
                    boxShadow: tone.shadow,
                  }}
                >
                  {centsFromTarget > 0 ? '+' : ''}
                  {Math.round(centsFromTarget)}
                </div>
                {/* Trail line from bubble down */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-3 rounded-full transition-colors duration-150"
                  style={{ backgroundColor: tone.color }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Direction hint */}
        <div className="text-center h-5">
          <span
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: tone.color }}
          >
            {directionHint}
          </span>
        </div>
      </div>

      {/* Detected Note */}
      <div className="mt-6 text-center">
        <div className="flex items-start justify-center">
          <span
            className="text-7xl font-bold tracking-tight transition-colors duration-300"
            style={{ color: tone.noteColor }}
          >
            {displayNote}
          </span>
          {displayOctave !== null && (
            <span className="mt-2 ml-0.5 text-2xl font-bold text-text-muted">
              {displayOctave}
            </span>
          )}
        </div>
        {displayFrequency && (
          <div className="mt-1 text-sm tabular-nums text-text-muted">
            {displayFrequency}
          </div>
        )}
      </div>

      {/* Target string info */}
      {closestString && detectedNote && (
        <div className="mt-2 rounded-full border border-border-subtle bg-card-soft px-3 py-1">
          <span className="text-xs tabular-nums text-text-muted">
            목표: {closestString.name}
            {closestString.octave} ({closestString.frequency.toFixed(1)} Hz)
          </span>
        </div>
      )}
    </div>
  );
}
