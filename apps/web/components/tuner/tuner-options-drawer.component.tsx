'use client';

import { useState } from 'react';
import type { HeadstockLayout } from './guitar-headstock.component';

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
  headstockLayout: HeadstockLayout;
  onHeadstockLayoutChange: (layout: HeadstockLayout) => void;
  variant?: 'drawer' | 'inline';
};

const MIN_REFERENCE_FREQ = 432;
const MAX_REFERENCE_FREQ = 446;

export function TunerOptionsDrawer({
  referenceFrequency,
  onReferenceFrequencyChange,
  detectionSettings,
  onDetectionSettingsChange,
  sensitivityPreset,
  onSensitivityPresetChange,
  headstockLayout,
  onHeadstockLayoutChange,
  variant = 'drawer',
}: TunerOptionsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateReferenceFrequency = (value: number) => {
    const clamped = Math.max(MIN_REFERENCE_FREQ, Math.min(MAX_REFERENCE_FREQ, value));
    onReferenceFrequencyChange(clamped);
  };

  const presetButtonClass = (preset: Exclude<SensitivityPreset, 'custom'>) =>
    `px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
      sensitivityPreset === preset
        ? 'bg-primary/20 text-primary border-primary/50'
        : 'bg-surface text-gray-300 border-primary/20 hover:bg-surface/70'
    }`;

  const headstockButtonClass = (layout: HeadstockLayout) =>
    `p-2 rounded-lg border transition-colors text-left ${
      headstockLayout === layout
        ? 'bg-primary/20 text-primary border-primary/50'
        : 'bg-surface text-gray-300 border-primary/20 hover:bg-surface/70'
    }`;

  const optionsContent = (
    <div className="space-y-4">
      {/* A4 Reference Frequency */}
      <div>
        <div className="flex items-center justify-between text-xs text-primary/60 mb-2">
          <span>A4 기준 주파수</span>
          <span className="font-semibold text-primary tabular-nums">{referenceFrequency} Hz</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateReferenceFrequency(referenceFrequency - 1)}
            className="w-11 h-11 rounded-lg bg-surface text-primary border border-primary/20 hover:bg-primary/10 active:scale-95 shrink-0"
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
            className="flex-1 h-2 bg-surface rounded-full appearance-none cursor-pointer slider"
            aria-label="A4 기준 주파수"
          />
          <button
            type="button"
            onClick={() => updateReferenceFrequency(referenceFrequency + 1)}
            className="w-11 h-11 rounded-lg bg-surface text-primary border border-primary/20 hover:bg-primary/10 active:scale-95 shrink-0"
            aria-label="A4 기준 주파수 증가"
          >
            +
          </button>
        </div>
      </div>

      {/* Sensitivity Presets */}
      <div className="border-t border-primary/10 pt-3">
        <div className="flex items-center justify-between text-xs text-primary/60 mb-2">
          <span>입력 감도</span>
          <span className="text-xs text-primary/40">
            {sensitivityPreset === 'custom' ? '사용자 지정' : '프리셋 적용 중'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onSensitivityPresetChange('stable')} className={presetButtonClass('stable')}>안정형</button>
          <button type="button" onClick={() => onSensitivityPresetChange('balanced')} className={presetButtonClass('balanced')}>균형형</button>
          <button type="button" onClick={() => onSensitivityPresetChange('fast')} className={presetButtonClass('fast')}>빠른응답</button>
        </div>
      </div>

      {/* Detection Settings */}
      <div className="border-t border-primary/10 pt-3 space-y-3">
        <div className="flex items-center justify-between text-xs text-primary/60 mb-1">
          <span>노이즈 캔슬링</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted w-20">신뢰도 게이트</span>
          <input
            type="range"
            min={0.1}
            max={0.75}
            step={0.01}
            value={detectionSettings.confidenceGate}
            onChange={(e) => onDetectionSettingsChange({ confidenceGate: Number(e.target.value) })}
            className="flex-1 h-2 bg-surface rounded-full appearance-none cursor-pointer slider"
          />
          <span className="text-xs text-primary tabular-nums w-10 text-right">{detectionSettings.confidenceGate.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted w-20">RMS 게이트</span>
          <input
            type="range"
            min={0.001}
            max={0.05}
            step={0.001}
            value={detectionSettings.rmsThreshold}
            onChange={(e) => onDetectionSettingsChange({ rmsThreshold: Number(e.target.value) })}
            className="flex-1 h-2 bg-surface rounded-full appearance-none cursor-pointer slider"
          />
          <span className="text-xs text-primary tabular-nums w-10 text-right">{detectionSettings.rmsThreshold.toFixed(3)}</span>
        </div>
      </div>

      {/* Headstock Layout */}
      <div className="border-t border-primary/10 pt-3">
        <div className="text-xs text-primary/60 mb-2">헤드스톡 형태</div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onHeadstockLayoutChange('three-plus-three')} className={headstockButtonClass('three-plus-three')}>
            <span className="block text-xs font-semibold">3+3</span>
            <span className="block text-xs opacity-80">깁슨 스타일</span>
          </button>
          <button type="button" onClick={() => onHeadstockLayoutChange('six-inline')} className={headstockButtonClass('six-inline')}>
            <span className="block text-xs font-semibold">6-인라인</span>
            <span className="block text-xs opacity-80">펜더 스타일</span>
          </button>
        </div>
      </div>

      {/* Loudness (placeholder) */}
      <div className="border-t border-primary/10 pt-3">
        <div className="flex items-center justify-between text-xs text-primary/60">
          <span>라우드니스 보정</span>
          <div className="w-10 h-5 rounded-full bg-surface border border-primary/20 relative">
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-text-muted" />
          </div>
        </div>
      </div>
    </div>
  );

  // Inline mode for desktop sidebar
  if (variant === 'inline') {
    return optionsContent;
  }

  // Drawer mode for mobile
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-1 min-h-[44px] py-2.5 rounded-xl text-sm font-medium transition-all bg-surface text-primary/80 border border-primary/20 hover:bg-primary/10 active:bg-primary/20"
        aria-label="튜너 옵션 열기"
      >
        설정
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-primary/20 rounded-t-2xl max-h-[70vh] overflow-y-auto transition-transform duration-300">
            <div className="px-4 pt-4 bottom-sheet-safe-area">
              <div className="w-10 h-1 rounded-full bg-primary/40 mx-auto mb-3" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-primary">튜너 설정</h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-11 h-11 rounded-lg bg-surface text-primary hover:bg-primary/10 flex items-center justify-center border border-primary/20"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              {optionsContent}
            </div>
          </div>
        </>
      )}
    </>
  );
}
