'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { TunerControl, GuitarHeadstock, TuningTrendGraph, TunerOptionsDrawer } from '../../../components/tuner';
import type { HeadstockLayout } from '../../../components/tuner/guitar-headstock.component';
import { useTuner } from '../../../hooks/use-tuner';

const HEADSTOCK_LAYOUT_STORAGE_KEY = 'tempo_tuner_headstock_layout_v1';
const DEFAULT_LAYOUT: HeadstockLayout = 'three-plus-three';

const layoutSubscribers = new Set<() => void>();

function subscribeLayout(callback: () => void) {
  layoutSubscribers.add(callback);
  return () => { layoutSubscribers.delete(callback); };
}

function getLayoutSnapshot(): HeadstockLayout {
  const saved = window.localStorage.getItem(HEADSTOCK_LAYOUT_STORAGE_KEY);
  if (saved === 'three-plus-three' || saved === 'six-inline') return saved;
  return DEFAULT_LAYOUT;
}

function getServerLayoutSnapshot(): HeadstockLayout {
  return DEFAULT_LAYOUT;
}

export default function TunerPage() {
  const tuner = useTuner();
  const activeTarget = tuner.targetString ?? tuner.closestString;

  const headstockLayout = useSyncExternalStore(
    subscribeLayout,
    getLayoutSnapshot,
    getServerLayoutSnapshot,
  );

  const handleHeadstockLayoutChange = useCallback((layout: HeadstockLayout) => {
    window.localStorage.setItem(HEADSTOCK_LAYOUT_STORAGE_KEY, layout);
    layoutSubscribers.forEach((cb) => cb());
  }, []);

  return (
    <div
      className="h-full overflow-hidden animate-[fadeIn_0.3s_ease-out]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(55,65,81,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(55,65,81,0.18) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto_auto]">
        {/* Row 1: Compact header */}
        <TunerControl
          currentPreset={tuner.currentPreset}
          tuningMode={tuner.tuningMode}
          isListening={tuner.isListening}
          onPresetChange={tuner.setPreset}
          onTuningModeChange={tuner.setTuningMode}
          onStart={tuner.start}
          onStop={tuner.stop}
        />

        {/* Row 2: Graph area (flexible, takes remaining space) */}
        <div className="relative min-h-0 overflow-hidden px-3">
          <TuningTrendGraph
            detectedNote={tuner.detectedNote}
            targetString={activeTarget}
            centsFromTarget={tuner.centsFromTarget}
            centsHistory={tuner.centsHistory}
            isListening={tuner.isListening}
            hasSignal={tuner.hasSignal}
            confidence={tuner.pitchConfidence}
            confidenceGate={tuner.confidenceGate}
            isLowConfidence={tuner.isLowConfidence}
            size="large"
          />
          {tuner.error && (
            <div className="absolute inset-x-3 top-2 p-3 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-xs break-all">
              {tuner.error}
            </div>
          )}
        </div>

        {/* Row 3: Headstock section */}
        <div className="px-3 py-1">
          <p className="mb-1 text-center text-xs text-gray-500">
            {tuner.tuningMode === 'auto'
              ? '울리는 줄을 자동으로 감지합니다'
              : '헤드머신 버튼으로 목표 줄을 선택하세요'}
          </p>
          <GuitarHeadstock
            strings={tuner.currentPreset.strings}
            targetString={tuner.targetString}
            detectedString={tuner.closestString}
            layout={headstockLayout}
            onSelectString={tuner.setTargetString}
          />
        </div>

        {/* Row 4: Options trigger (minimal bottom area) */}
        <div className="px-3 pb-2">
          <TunerOptionsDrawer
            referenceFrequency={tuner.referenceFrequency}
            onReferenceFrequencyChange={tuner.setReferenceFrequency}
            detectionSettings={tuner.detectionSettings}
            onDetectionSettingsChange={tuner.setDetectionSettings}
            sensitivityPreset={tuner.sensitivityPreset}
            onSensitivityPresetChange={tuner.applySensitivityPreset}
            headstockLayout={headstockLayout}
            onHeadstockLayoutChange={handleHeadstockLayoutChange}
          />
        </div>
      </div>
    </div>
  );
}
