'use client';

import type { TuningPreset } from '@tempo-tune/shared/types';
import { ALL_TUNING_PRESETS } from '@tempo-tune/shared/constants';

type InstrumentSelectorProps = {
  currentPreset: TuningPreset;
  onPresetChange: (preset: TuningPreset) => void;
  disabled?: boolean;
};

const instruments = [
  { id: 'piano', label: '피아노', icon: '🎹', enabled: false },
  { id: 'guitar', label: '기타', icon: '🎸', enabled: true },
  { id: 'bass', label: '베이스', icon: '🎸', enabled: true },
  { id: 'violin', label: '바이올린', icon: '🎻', enabled: false },
  { id: 'more', label: '더보기', icon: '⋯', enabled: false },
] as const;

export function InstrumentSelector({
  currentPreset,
  onPresetChange,
  disabled = false,
}: InstrumentSelectorProps) {
  const handleSelect = (instrumentId: string) => {
    if (disabled) return;
    const preset = ALL_TUNING_PRESETS.find((p) => p.instrument === instrumentId);
    if (preset) onPresetChange(preset);
  };

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
      {instruments.map((inst) => {
        const isActive = inst.enabled && currentPreset.instrument === inst.id;
        return (
          <button
            key={inst.id}
            type="button"
            onClick={() => inst.enabled && handleSelect(inst.id)}
            disabled={!inst.enabled || disabled}
            className={`flex flex-col items-center gap-1 min-w-[56px] px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0 ${
              isActive
                ? 'bg-primary/20 text-primary border border-primary/40'
                : inst.enabled
                  ? 'bg-surface/50 text-text-secondary border border-primary/10 hover:bg-primary/10'
                  : 'bg-surface/30 text-text-muted/50 border border-transparent cursor-not-allowed'
            }`}
          >
            <span className="text-lg">{inst.icon}</span>
            <span>{inst.label}</span>
          </button>
        );
      })}
    </div>
  );
}
