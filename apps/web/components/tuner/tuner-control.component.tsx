'use client';

import type { TuningPreset } from '@tempo-tune/shared/types';
import { ALL_TUNING_PRESETS } from '@tempo-tune/shared/constants';

type TunerControlProps = {
  currentPreset: TuningPreset;
  referenceFrequency: number;
  isListening: boolean;
  onPresetChange: (preset: TuningPreset) => void;
  onReferenceFrequencyChange: (freq: number) => void;
  onStart: () => void;
  onStop: () => void;
};

export function TunerControl({
  currentPreset,
  referenceFrequency,
  isListening,
  onPresetChange,
  onReferenceFrequencyChange,
  onStart,
  onStop,
}: TunerControlProps) {
  const handleFrequencyChange = (freq: number) => {
    const clampedFreq = Math.max(430, Math.min(450, freq));
    onReferenceFrequencyChange(clampedFreq);
  };

  return (
    <div className="flex flex-col items-center space-y-8 pb-8">
      {/* Preset Selection */}
      <div className="w-full max-w-sm space-y-3">
        <div className="text-sm text-gray-400 text-center">Tuning Preset</div>
        <div className="flex flex-col gap-2">
          {ALL_TUNING_PRESETS.map((preset) => {
            const isActive = preset.name === currentPreset.name;

            return (
              <button
                key={preset.name}
                onClick={() => onPresetChange(preset)}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reference Frequency */}
      <div className="w-full max-w-sm space-y-3">
        <div className="text-sm text-gray-400 text-center">
          A4 Reference: {referenceFrequency} Hz
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleFrequencyChange(referenceFrequency - 1)}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 active:bg-gray-600 transition-colors flex items-center justify-center text-xl font-bold"
          >
            −
          </button>

          <input
            type="range"
            min={430}
            max={450}
            value={referenceFrequency}
            onChange={(e) => handleFrequencyChange(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />

          <button
            onClick={() => handleFrequencyChange(referenceFrequency + 1)}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 active:bg-gray-600 transition-colors flex items-center justify-center text-xl font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* Start/Stop Button */}
      <button
        onClick={isListening ? onStop : onStart}
        className={`w-24 h-24 rounded-full font-bold text-xl transition-all ${
          isListening
            ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-lg shadow-red-600/50'
            : 'bg-green-600 hover:bg-green-500 active:bg-green-700 shadow-lg shadow-green-600/50'
        }`}
      >
        {isListening ? '정지' : '시작'}
      </button>
    </div>
  );
}
