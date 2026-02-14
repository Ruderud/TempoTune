'use client';

import type { TuningPreset } from '@tempo-tune/shared/types';
import { ALL_TUNING_PRESETS } from '@tempo-tune/shared/constants';

type TuningMode = 'auto' | 'manual';

type TunerControlProps = {
  currentPreset: TuningPreset;
  tuningMode: TuningMode;
  isListening: boolean;
  onPresetChange: (preset: TuningPreset) => void;
  onTuningModeChange: (mode: TuningMode) => void;
  onStart: () => void;
  onStop: () => void;
};

export function TunerControl({
  currentPreset,
  tuningMode,
  isListening,
  onPresetChange,
  onTuningModeChange,
  onStart,
  onStop,
}: TunerControlProps) {
  const presetLabel = currentPreset.instrument === 'guitar' ? '기타' : '베이스';
  const stringCount = currentPreset.strings.length;
  const modeButtonBaseClass =
    'px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200';

  return (
    <div className="px-4 py-3 border-b border-gray-800/50 space-y-3">
      <div className="flex items-center justify-between gap-2">
        {/* Preset info */}
        <div className="flex items-center gap-2 min-w-0">
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
              bg-transparent text-white text-sm font-bold
              border-none outline-none cursor-pointer max-w-[130px]
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
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {presetLabel} {stringCount}현
          </span>
        </div>

        {/* Start/Stop */}
        <button
          onClick={isListening ? onStop : onStart}
          className={`
            relative shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200
            ${
              isListening
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

      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full bg-gray-900/80 p-0.5 border border-gray-800">
          <button
            type="button"
            onClick={() => onTuningModeChange('auto')}
            className={`${modeButtonBaseClass} ${
              tuningMode === 'auto'
                ? 'bg-sky-400/30 text-sky-200'
                : 'text-gray-400 hover:text-gray-100'
            }`}
          >
            자동
          </button>
          <button
            type="button"
            onClick={() => onTuningModeChange('manual')}
            className={`${modeButtonBaseClass} ${
              tuningMode === 'manual'
                ? 'bg-sky-400/30 text-sky-200'
                : 'text-gray-400 hover:text-gray-100'
            }`}
          >
            수동
          </button>
        </div>

        <span className="text-[11px] text-gray-400">
          {tuningMode === 'auto' ? '음정 자동 추적' : '줄 직접 지정'}
        </span>
      </div>
    </div>
  );
}
