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

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
      {/* Detected Note */}
      <div className="text-center">
        <div className="text-8xl font-bold text-white">{displayNote}</div>
        <div className="text-lg text-gray-400 mt-2">{displayFrequency}</div>
      </div>

      {/* Circular Gauge */}
      <div className="my-4">
        <CircularGauge value={detectedNote ? centsFromTarget : 0} maxValue={50} size={240} />
      </div>

      {/* Target String */}
      <div className="text-center">
        <div className="text-sm text-gray-500">Target</div>
        <div className="text-2xl font-medium text-gray-300">{targetString}</div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-600'
          }`}
        />
        <span className="text-sm text-gray-400">
          {isListening ? 'Listening...' : 'Stopped'}
        </span>
      </div>
    </div>
  );
}
