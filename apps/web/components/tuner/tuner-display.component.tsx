'use client';

import type { TunerNote, TuningString } from '@tempo-tune/shared/types';
import { CircularGauge } from '../common/circular-gauge.component';

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
  const displayNote = detectedNote
    ? `${detectedNote.name}${detectedNote.octave}`
    : '--';

  const displayFrequency = detectedNote
    ? `${detectedNote.frequency.toFixed(1)} Hz`
    : '-- Hz';

  const targetString = closestString
    ? `${closestString.name}${closestString.octave}`
    : '--';

  const isInTune = detectedNote && Math.abs(centsFromTarget) < 5;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-6">
      {/* Detected Note */}
      <div className="text-center">
        <div className={`text-8xl font-bold tabular-nums tracking-tight transition-colors duration-300 ${
          isInTune ? 'text-green-400' : 'text-white'
        }`}>
          {displayNote}
        </div>
        <div className="text-base text-gray-500 mt-1 font-medium">{displayFrequency}</div>
      </div>

      {/* Circular Gauge */}
      <div className="my-2">
        <CircularGauge value={detectedNote ? centsFromTarget : 0} maxValue={50} size={220} />
      </div>

      {/* Cents Offset */}
      {detectedNote && (
        <div className={`text-sm font-bold transition-colors duration-300 ${
          isInTune ? 'text-green-400' : Math.abs(centsFromTarget) < 15 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {centsFromTarget > 0 ? '+' : ''}{centsFromTarget.toFixed(0)} cents
        </div>
      )}

      {/* Target String */}
      <div className="text-center">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">목표 줄</div>
        <div className="text-2xl font-bold text-gray-300 mt-1">{targetString}</div>
      </div>
    </div>
  );
}
