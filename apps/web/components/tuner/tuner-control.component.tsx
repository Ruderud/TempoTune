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
    <div className="flex flex-col items-center space-y-6 pb-8">
      {/* Preset Selection */}
      <div className="w-full max-w-sm">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">
          튜닝 프리셋
        </div>
        <div className="bg-gray-900/50 rounded-2xl p-3 border border-gray-800">
          <div className="grid grid-cols-2 gap-2">
            {ALL_TUNING_PRESETS.map((preset) => {
              const isActive = preset.name === currentPreset.name;

              return (
                <button
                  key={preset.name}
                  onClick={() => onPresetChange(preset)}
                  disabled={isListening}
                  className={`
                    relative px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-[1.02]'
                      : 'bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-gray-300 active:scale-95'
                    }
                    ${isListening ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-bold">{preset.name}</span>
                    <span className="text-[10px] opacity-70">
                      {preset.instrument === 'guitar' ? '기타' : '베이스'}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl ring-2 ring-blue-400/50 ring-offset-2 ring-offset-gray-950 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reference Frequency */}
      <div className="w-full max-w-sm">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">
          기준 주파수 (A4)
        </div>
        <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
              {referenceFrequency}
            </div>
            <div className="text-sm text-gray-500 font-medium">Hz</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleFrequencyChange(referenceFrequency - 1)}
              disabled={isListening || referenceFrequency <= 430}
              className={`
                w-11 h-11 shrink-0 rounded-xl font-bold text-lg transition-all duration-150
                ${isListening || referenceFrequency <= 430
                  ? 'bg-gray-800/40 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:scale-95 shadow-sm'
                }
              `}
            >
              −
            </button>

            <div className="flex-1 min-w-0 relative">
              <input
                type="range"
                min={430}
                max={450}
                value={referenceFrequency}
                onChange={(e) => handleFrequencyChange(Number(e.target.value))}
                disabled={isListening}
                className={`
                  w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer slider
                  ${isListening ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              />
              <div className="flex justify-between mt-1.5 px-1">
                <span className="text-[10px] text-gray-600 font-medium">430</span>
                <span className="text-[10px] text-gray-600 font-medium">440</span>
                <span className="text-[10px] text-gray-600 font-medium">450</span>
              </div>
            </div>

            <button
              onClick={() => handleFrequencyChange(referenceFrequency + 1)}
              disabled={isListening || referenceFrequency >= 450}
              className={`
                w-11 h-11 shrink-0 rounded-xl font-bold text-lg transition-all duration-150
                ${isListening || referenceFrequency >= 450
                  ? 'bg-gray-800/40 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:scale-95 shadow-sm'
                }
              `}
            >
              +
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => handleFrequencyChange(440)}
              disabled={isListening || referenceFrequency === 440}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                ${isListening || referenceFrequency === 440
                  ? 'bg-gray-800/40 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300 active:scale-95'
                }
              `}
            >
              기본값 (440Hz)
            </button>
          </div>
        </div>
      </div>

      {/* Start/Stop Button */}
      <div className="flex flex-col items-center gap-3 mt-2">
        <button
          onClick={isListening ? onStop : onStart}
          className={`
            relative w-28 h-28 rounded-full font-bold text-lg transition-all duration-300
            ${isListening
              ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 shadow-xl shadow-red-600/40'
              : 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-95 shadow-xl shadow-blue-600/40'
            }
          `}
        >
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-200" />
          <span className="relative z-10 text-white drop-shadow-lg">
            {isListening ? '정지' : '시작'}
          </span>
          {isListening && (
            <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-red-600" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isListening ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-gray-700'
            }`}
          />
          <span className="text-xs text-gray-500 font-medium">
            {isListening ? '청취 중...' : '대기 중'}
          </span>
        </div>
      </div>
    </div>
  );
}
