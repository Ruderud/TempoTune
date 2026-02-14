'use client';

import { useState } from 'react';

type TunerDetectionSettings = {
  confidenceGate: number;
  confidenceSmoothingAlpha: number;
  probabilityThreshold: number;
  rmsThreshold: number;
  detectorSmoothingAlpha: number;
  maxJumpCents: number;
};

type SensitivityPreset = 'stable' | 'balanced' | 'fast' | 'custom';

type TunerOptionsDrawerProps = {
  referenceFrequency: number;
  onReferenceFrequencyChange: (freq: number) => void;
  detectionSettings: TunerDetectionSettings;
  onDetectionSettingsChange: (patch: Partial<TunerDetectionSettings>) => void;
  sensitivityPreset: SensitivityPreset;
  onSensitivityPresetChange: (preset: Exclude<SensitivityPreset, 'custom'>) => void;
};

const MIN_REFERENCE_FREQ = 432;
const MAX_REFERENCE_FREQ = 446;
const MIN_CONFIDENCE_GATE = 0.1;
const MAX_CONFIDENCE_GATE = 0.75;
const MIN_CONFIDENCE_SMOOTHING = 0.05;
const MAX_CONFIDENCE_SMOOTHING = 0.8;
const MIN_PROBABILITY_THRESHOLD = 0.05;
const MAX_PROBABILITY_THRESHOLD = 0.8;
const MIN_RMS_THRESHOLD = 0.001;
const MAX_RMS_THRESHOLD = 0.05;
const MIN_DETECTOR_SMOOTHING = 0.05;
const MAX_DETECTOR_SMOOTHING = 0.6;
const MIN_MAX_JUMP_CENTS = 30;
const MAX_MAX_JUMP_CENTS = 300;

export function TunerOptionsDrawer({
  referenceFrequency,
  onReferenceFrequencyChange,
  detectionSettings,
  onDetectionSettingsChange,
  sensitivityPreset,
  onSensitivityPresetChange,
}: TunerOptionsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateReferenceFrequency = (value: number) => {
    const clamped = Math.max(MIN_REFERENCE_FREQ, Math.min(MAX_REFERENCE_FREQ, value));
    onReferenceFrequencyChange(clamped);
  };

  const updateDetectionSetting = (patch: Partial<TunerDetectionSettings>) => {
    onDetectionSettingsChange(patch);
  };

  const presetButtonClass = (preset: Exclude<SensitivityPreset, 'custom'>) =>
    `px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
      sensitivityPreset === preset
        ? 'bg-sky-500/25 text-sky-200 border-sky-400/50'
        : 'bg-gray-800/70 text-gray-300 border-gray-700 hover:bg-gray-700/70'
    }`;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            isOpen
              ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40'
              : 'bg-gray-900/70 text-gray-300 border border-gray-700 hover:bg-gray-800/80'
          }`}
          aria-expanded={isOpen}
          aria-label="튜너 옵션 열기"
        >
          옵션
        </button>
      </div>

      <div
        className={`grid transition-all duration-200 ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="bg-gray-900/60 rounded-xl border border-gray-800 px-3 py-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>A4 기준 주파수</span>
              <span className="font-semibold text-gray-200 tabular-nums">{referenceFrequency} Hz</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateReferenceFrequency(referenceFrequency - 1)}
                className="w-8 h-8 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 active:scale-95"
                aria-label="A4 기준 주파수 감소"
              >
                -
              </button>

              <input
                type="range"
                min={MIN_REFERENCE_FREQ}
                max={MAX_REFERENCE_FREQ}
                step={1}
                value={referenceFrequency}
                onChange={(e) => updateReferenceFrequency(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-800 rounded-full appearance-none cursor-pointer slider"
                aria-label="A4 기준 주파수"
              />

              <button
                type="button"
                onClick={() => updateReferenceFrequency(referenceFrequency + 1)}
                className="w-8 h-8 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 active:scale-95"
                aria-label="A4 기준 주파수 증가"
              >
                +
              </button>
            </div>

            <div className="mt-4 border-t border-gray-800 pt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>추천 감도 프리셋</span>
                <span className="text-[11px] text-gray-500">
                  {sensitivityPreset === 'custom' ? '사용자 지정' : '프리셋 적용 중'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSensitivityPresetChange('stable')}
                  className={presetButtonClass('stable')}
                >
                  안정형
                </button>
                <button
                  type="button"
                  onClick={() => onSensitivityPresetChange('balanced')}
                  className={presetButtonClass('balanced')}
                >
                  균형형
                </button>
                <button
                  type="button"
                  onClick={() => onSensitivityPresetChange('fast')}
                  className={presetButtonClass('fast')}
                >
                  빠른응답
                </button>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-800 pt-3 space-y-3">
              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>락 신뢰도 게이트</span>
                  <span className="tabular-nums text-gray-300">
                    {detectionSettings.confidenceGate.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_CONFIDENCE_GATE}
                  max={MAX_CONFIDENCE_GATE}
                  step={0.01}
                  value={detectionSettings.confidenceGate}
                  onChange={(e) =>
                    updateDetectionSetting({ confidenceGate: Number(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer slider"
                  aria-label="락 신뢰도 게이트"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>신뢰도 스무딩 알파</span>
                  <span className="tabular-nums text-gray-300">
                    {detectionSettings.confidenceSmoothingAlpha.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_CONFIDENCE_SMOOTHING}
                  max={MAX_CONFIDENCE_SMOOTHING}
                  step={0.01}
                  value={detectionSettings.confidenceSmoothingAlpha}
                  onChange={(e) =>
                    updateDetectionSetting({ confidenceSmoothingAlpha: Number(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer slider"
                  aria-label="신뢰도 스무딩 알파"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>YIN 확률 임계값</span>
                  <span className="tabular-nums text-gray-300">
                    {detectionSettings.probabilityThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_PROBABILITY_THRESHOLD}
                  max={MAX_PROBABILITY_THRESHOLD}
                  step={0.01}
                  value={detectionSettings.probabilityThreshold}
                  onChange={(e) =>
                    updateDetectionSetting({ probabilityThreshold: Number(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer slider"
                  aria-label="YIN 확률 임계값"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>RMS 노이즈 게이트</span>
                  <span className="tabular-nums text-gray-300">
                    {detectionSettings.rmsThreshold.toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_RMS_THRESHOLD}
                  max={MAX_RMS_THRESHOLD}
                  step={0.001}
                  value={detectionSettings.rmsThreshold}
                  onChange={(e) =>
                    updateDetectionSetting({ rmsThreshold: Number(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer slider"
                  aria-label="RMS 노이즈 게이트"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>검출 스무딩 알파</span>
                  <span className="tabular-nums text-gray-300">
                    {detectionSettings.detectorSmoothingAlpha.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_DETECTOR_SMOOTHING}
                  max={MAX_DETECTOR_SMOOTHING}
                  step={0.01}
                  value={detectionSettings.detectorSmoothingAlpha}
                  onChange={(e) =>
                    updateDetectionSetting({ detectorSmoothingAlpha: Number(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer slider"
                  aria-label="검출 스무딩 알파"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>최대 점프 제한(cents)</span>
                  <span className="tabular-nums text-gray-300">
                    {Math.round(detectionSettings.maxJumpCents)}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_MAX_JUMP_CENTS}
                  max={MAX_MAX_JUMP_CENTS}
                  step={1}
                  value={detectionSettings.maxJumpCents}
                  onChange={(e) =>
                    updateDetectionSetting({ maxJumpCents: Number(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer slider"
                  aria-label="최대 점프 제한"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
