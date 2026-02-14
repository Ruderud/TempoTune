'use client';

import { TunerControl, GuitarHeadstock, TuningTrendGraph, TunerOptionsDrawer } from '../../../components/tuner';
import { useTuner } from '../../../hooks/use-tuner';

export default function TunerPage() {
  const tuner = useTuner();
  const activeTarget = tuner.targetString ?? tuner.closestString;

  return (
    <div
      className="flex flex-col h-full overflow-y-auto animate-[fadeIn_0.3s_ease-out]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(55,65,81,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(55,65,81,0.18) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Compact header: preset + start/stop */}
      <TunerControl
        currentPreset={tuner.currentPreset}
        tuningMode={tuner.tuningMode}
        isListening={tuner.isListening}
        onPresetChange={tuner.setPreset}
        onTuningModeChange={tuner.setTuningMode}
        onStart={tuner.start}
        onStop={tuner.stop}
      />

      <div className="px-4 pt-3">
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
      </div>

      {tuner.error && (
        <div className="mx-4 mt-2 p-3 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-xs break-all">
          {tuner.error}
        </div>
      )}

      {/* Bottom: guitar headstock with string buttons */}
      <div className="px-4 pb-2 pt-2">
        <p className="mb-2 text-center text-xs text-gray-400">
          {tuner.tuningMode === 'auto'
            ? '자동 모드: 현재 울리는 줄을 감지해 실시간으로 목표 음정을 추적합니다.'
            : '수동 모드: 헤드머신 버튼으로 목표 줄을 고르고 같은 줄을 튕겨 0 cents에 맞추세요.'}
        </p>
        <GuitarHeadstock
          strings={tuner.currentPreset.strings}
          targetString={tuner.targetString}
          detectedString={tuner.closestString}
          onSelectString={tuner.setTargetString}
        />
      </div>

      <div className="px-4 pb-5 pt-2">
        <TunerOptionsDrawer
          referenceFrequency={tuner.referenceFrequency}
          onReferenceFrequencyChange={tuner.setReferenceFrequency}
          detectionSettings={tuner.detectionSettings}
          onDetectionSettingsChange={tuner.setDetectionSettings}
          sensitivityPreset={tuner.sensitivityPreset}
          onSensitivityPresetChange={tuner.applySensitivityPreset}
        />
      </div>
    </div>
  );
}
