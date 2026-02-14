'use client';

import { MetronomeDisplay, MetronomeControl } from '../../../components/metronome';
import { useMetronome } from '../../../hooks/use-metronome';

export default function MetronomePage() {
  const metronome = useMetronome();

  return (
    <div className="h-full flex items-center">
      <div className="w-full max-w-md mx-auto px-4 py-4 animate-[fadeIn_0.3s_ease-out]">
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
    </div>
  );
}
