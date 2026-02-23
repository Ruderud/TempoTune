'use client';

import type { TuningPreset } from '@tempo-tune/shared/types';
import { ALL_TUNING_PRESETS } from '@tempo-tune/shared/constants';
import { Icon } from '../common/icon.component';

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
  return (
    <div className="px-4 py-2 space-y-2">
      {/* Mobile: Top bar */}
      <div className="flex items-center justify-between lg:hidden px-2 py-5">
        <button type="button" className="p-2 rounded-lg bg-white/5 flex items-center justify-center text-primary/60">
          <Icon src="/assets/icons/menu.svg" size={18} label="메뉴" />
        </button>
        <span className="text-lg font-bold tracking-[0.1em] text-primary">
          TEMPOTUNE
        </span>
        <button type="button" className="p-2 rounded-lg bg-white/5 flex items-center justify-center text-primary/60">
          <Icon src="/assets/icons/settings.svg" size={20} label="설정" />
        </button>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Preset selector button */}
        <button
          className="flex-1 flex items-center justify-center gap-2 bg-surface border border-primary/20 min-h-[44px] py-2.5 rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors"
          disabled={isListening}
        >
          <span className="text-xs text-primary">⚙</span>
          <select
            value={`${currentPreset.instrument}-${currentPreset.name}`}
            onChange={(e) => {
              const preset = ALL_TUNING_PRESETS.find(
                (p) => `${p.instrument}-${p.name}` === e.target.value,
              );
              if (preset) onPresetChange(preset);
            }}
            disabled={isListening}
            className="bg-transparent text-white text-sm font-medium border-none outline-none cursor-pointer"
          >
            {ALL_TUNING_PRESETS.map((preset) => (
              <option
                key={`${preset.instrument}-${preset.name}`}
                value={`${preset.instrument}-${preset.name}`}
                className="bg-surface text-white"
              >
                {preset.instrument === 'guitar' ? '기타' : '베이스'} {preset.name}
              </option>
            ))}
          </select>
        </button>

        {/* Mode toggle */}
        <div className="flex-1 bg-surface border border-primary/20 p-1 rounded-lg flex items-center">
          <button
            type="button"
            onClick={() => onTuningModeChange('auto')}
            className={`flex-1 min-h-[36px] rounded-md text-xs font-bold transition-colors ${
              tuningMode === 'auto'
                ? 'bg-primary text-background-dark'
                : 'text-primary/40 hover:text-primary'
            }`}
          >
            자동
          </button>
          <button
            type="button"
            onClick={() => onTuningModeChange('manual')}
            className={`flex-1 min-h-[36px] rounded-md text-xs font-bold transition-colors ${
              tuningMode === 'manual'
                ? 'bg-primary text-background-dark'
                : 'text-primary/40 hover:text-primary'
            }`}
          >
            수동
          </button>
        </div>

        {/* Start/Stop button */}
        <button
          onClick={isListening ? onStop : onStart}
          className="px-5 min-h-[44px] rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition-all bg-primary text-background-dark shadow-primary/20"
        >
          <span className="text-sm">{isListening ? '⏸' : '▶'}</span>
          <span>{isListening ? '중지' : '시작'}</span>
        </button>
      </div>

      {/* Manual mode indicator */}
      {tuningMode === 'manual' && (
        <div className="lg:hidden text-center">
          <span className="text-xs font-medium text-primary/60">수동 모드 활성</span>
        </div>
      )}
    </div>
  );
}
