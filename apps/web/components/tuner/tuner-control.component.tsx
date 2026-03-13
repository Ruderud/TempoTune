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
        <button type="button" aria-label="메뉴" className="p-2 rounded-lg bg-card-soft border border-border-subtle flex items-center justify-center text-primary/70">
          <Icon name="menu" size={18} label="메뉴" />
        </button>
        <span className="text-lg font-bold tracking-[0.1em] text-primary">
          TEMPOTUNE
        </span>
        <button type="button" aria-label="설정" className="p-2 rounded-lg bg-card-soft border border-border-subtle flex items-center justify-center text-primary/70">
          <Icon name="settings" size={20} label="설정" />
        </button>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Preset selector button */}
        <button
          className="flex-1 flex items-center justify-center gap-2 bg-surface border border-primary/20 min-h-[44px] py-2.5 rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors"
          disabled={isListening}
        >
          <Icon name="controls" size={16} className="text-primary" label="프리셋 옵션" />
          <select
            data-testid="tuner-preset-select"
            value={`${currentPreset.instrument}-${currentPreset.name}`}
            onChange={(e) => {
              const preset = ALL_TUNING_PRESETS.find(
                (p) => `${p.instrument}-${p.name}` === e.target.value,
              );
              if (preset) onPresetChange(preset);
            }}
            disabled={isListening}
            className="bg-transparent text-text-primary text-sm font-medium border-none outline-none cursor-pointer"
          >
            {ALL_TUNING_PRESETS.map((preset) => (
              <option
                key={`${preset.instrument}-${preset.name}`}
                value={`${preset.instrument}-${preset.name}`}
                className="bg-surface text-text-primary"
              >
                {preset.instrument === 'guitar' ? '기타' : '베이스'} {preset.name}
              </option>
            ))}
          </select>
        </button>

        {/* Mode toggle */}
        <div className="flex-1 bg-surface border border-primary/20 p-1 rounded-lg flex items-center">
          <button
            data-testid="tuner-mode-auto"
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
            data-testid="tuner-mode-manual"
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
          data-testid="tuner-play-stop"
          onClick={isListening ? onStop : onStart}
          className="px-5 min-h-[44px] rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition-all bg-primary text-background-dark shadow-primary/20"
        >
          <Icon
            name={isListening ? 'pause' : 'play'}
            size={16}
            className="text-background-dark"
            label={isListening ? '중지' : '시작'}
          />
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
