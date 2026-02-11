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
  onStart,
  onStop,
}: TunerControlProps) {
  const presetLabel = currentPreset.instrument === 'guitar' ? '기타' : '베이스';
  const stringCount = currentPreset.strings.length;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800/50">
      {/* Preset info */}
      <div className="flex items-center gap-2">
        <select
          value={`${currentPreset.instrument}-${currentPreset.name}`}
          onChange={(e) => {
            const preset = ALL_TUNING_PRESETS.find(
              (p) => `${p.instrument}-${p.name}` === e.target.value,
            );
            if (preset) onPresetChange(preset);
          }}
          disabled={isListening}
          className={`
            bg-transparent text-white text-base font-bold
            border-none outline-none cursor-pointer
            ${isListening ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          {ALL_TUNING_PRESETS.map((preset) => (
            <option
              key={`${preset.instrument}-${preset.name}`}
              value={`${preset.instrument}-${preset.name}`}
              className="bg-gray-900 text-white"
            >
              {preset.instrument === 'guitar' ? '기타' : '베이스'} {preset.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          {presetLabel} {stringCount}현 &middot; {referenceFrequency}Hz
        </span>
      </div>

      {/* Start/Stop */}
      <button
        onClick={isListening ? onStop : onStart}
        className={`
          relative px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200
          ${isListening
            ? 'bg-red-600/90 text-white hover:bg-red-500 active:scale-95'
            : 'bg-green-600/90 text-white hover:bg-green-500 active:scale-95'
          }
        `}
      >
        {isListening ? '정지' : '시작'}
        {isListening && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />
        )}
      </button>
    </div>
  );
}
