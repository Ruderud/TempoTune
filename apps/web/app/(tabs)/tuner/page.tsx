'use client';

import { TunerControl, NeedleGauge, GuitarHeadstock } from '../../../components/tuner';
import { useTuner } from '../../../hooks/use-tuner';

export default function TunerPage() {
  const tuner = useTuner();

  return (
    <div
      className="flex flex-col min-h-full animate-[fadeIn_0.3s_ease-out]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(55,65,81,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(55,65,81,0.18) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Compact header: preset + start/stop */}
      <TunerControl
        currentPreset={tuner.currentPreset}
        referenceFrequency={tuner.referenceFrequency}
        isListening={tuner.isListening}
        onPresetChange={tuner.setPreset}
        onReferenceFrequencyChange={tuner.setReferenceFrequency}
        onStart={tuner.start}
        onStop={tuner.stop}
      />

      {/* Full-screen gauge + note display */}
      <div className="flex-1 flex flex-col px-4 min-h-0">
        <NeedleGauge
          detectedNote={tuner.detectedNote}
          closestString={tuner.closestString}
          centsFromTarget={tuner.centsFromTarget}
          isListening={tuner.isListening}
        />
      </div>

      {tuner.error && (
        <div className="mx-4 mb-2 p-3 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-xs break-all">
          {tuner.error}
        </div>
      )}

      {/* Bottom: guitar headstock with string buttons */}
      <div className="px-4 pb-6 pt-2">
        <GuitarHeadstock
          strings={tuner.currentPreset.strings}
          activeString={tuner.closestString}
        />
      </div>
    </div>
  );
}
