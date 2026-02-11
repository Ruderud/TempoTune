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

  const getColor = () => {
    if (!detectedNote) return '#6b7280';
    if (isInTune) return '#22c55e';
    if (isClose) return '#eab308';
    return '#ef4444';
  };

  const color = getColor();

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
          <span className="absolute left-0 top-2 text-2xl text-gray-500 select-none">&#9837;</span>
          <span className="absolute right-0 top-2 text-2xl text-gray-500 select-none">&#9839;</span>

          {/* Bar area */}
          <div className="w-full mx-10 relative h-full flex items-center">
            {/* Grid lines */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between items-center">
              {Array.from({ length: 21 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-px ${
                    i === 10
                      ? 'h-8 bg-white/50'
                      : i % 5 === 0
                        ? 'h-5 bg-gray-600'
                        : 'h-3 bg-gray-700/60'
                  }`}
                />
              ))}
            </div>

            {/* Center target line */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-10 bg-white/30 rounded-full" />

            {/* Needle bubble */}
            {detectedNote && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-100 ease-out z-10"
                style={{ left: `${needlePosition}%` }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 backdrop-blur-sm transition-colors duration-150"
                  style={{
                    borderColor: color,
                    backgroundColor: `${color}25`,
                    color: color,
                    boxShadow: `0 0 16px ${color}50`,
                  }}
                >
                  {centsFromTarget > 0 ? '+' : ''}
                  {Math.round(centsFromTarget)}
                </div>
                {/* Trail line from bubble down */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-3 rounded-full transition-colors duration-150"
                  style={{ backgroundColor: color }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Direction hint */}
        <div className="text-center h-5">
          <span
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: detectedNote ? color : '#6b7280' }}
          >
            {directionHint}
          </span>
        </div>
      </div>

      {/* Detected Note */}
      <div className="mt-6 text-center">
        <div className="flex items-start justify-center">
          <span
            className={`text-7xl font-bold tracking-tight transition-colors duration-300 ${
              isInTune ? 'text-green-400' : 'text-white'
            }`}
          >
            {displayNote}
          </span>
          {displayOctave !== null && (
            <span className="text-2xl font-bold text-gray-400 mt-2 ml-0.5">
              {displayOctave}
            </span>
          )}
        </div>
        {displayFrequency && (
          <div className="text-sm text-gray-500 mt-1 tabular-nums">
            {displayFrequency}
          </div>
        )}
      </div>

      {/* Target string info */}
      {closestString && detectedNote && (
        <div className="mt-2 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
          <span className="text-xs text-gray-400 tabular-nums">
            목표: {closestString.name}
            {closestString.octave} ({closestString.frequency.toFixed(1)} Hz)
          </span>
        </div>
      )}
    </div>
  );
}
