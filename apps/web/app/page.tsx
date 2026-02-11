'use client';

import { useState } from 'react';
import { TabNavigation } from '../components/common/tab-navigation.component';
import { MetronomeDisplay, MetronomeControl } from '../components/metronome';
import { TunerDisplay, TunerControl, StringIndicator } from '../components/tuner';
import { useMetronome } from '../hooks/use-metronome';
import { useTuner } from '../hooks/use-tuner';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'metronome' | 'tuner'>('metronome');

  const metronome = useMetronome();
  const tuner = useTuner();

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-gray-950">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto flex items-center">
        <div className="w-full max-w-md mx-auto px-4 py-8">
          {activeTab === 'metronome' ? (
            <div
              key="metronome"
              className="animate-[fadeIn_0.3s_ease-out]"
            >
              <MetronomeDisplay
                bpm={metronome.bpm}
                currentBeat={metronome.currentBeat}
                timeSignature={metronome.timeSignature}
                isPlaying={metronome.isPlaying}
              />
              <MetronomeControl
                bpm={metronome.bpm}
                timeSignature={metronome.timeSignature}
                isPlaying={metronome.isPlaying}
                onBpmChange={metronome.setBpm}
                onTimeSignatureChange={metronome.setTimeSignature}
                onStart={metronome.start}
                onStop={metronome.stop}
                onLoadCustomSound={metronome.loadCustomSound}
              />
            </div>
          ) : (
            <div
              key="tuner"
              className="animate-[fadeIn_0.3s_ease-out]"
            >
              <TunerDisplay
                detectedNote={tuner.detectedNote}
                closestString={tuner.closestString}
                centsFromTarget={tuner.centsFromTarget}
                isListening={tuner.isListening}
              />
              <StringIndicator
                strings={tuner.currentPreset.strings}
                activeString={tuner.closestString}
              />
              <TunerControl
                currentPreset={tuner.currentPreset}
                referenceFrequency={tuner.referenceFrequency}
                isListening={tuner.isListening}
                onPresetChange={tuner.setPreset}
                onReferenceFrequencyChange={tuner.setReferenceFrequency}
                onStart={tuner.start}
                onStop={tuner.stop}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
