'use client';

import { MetronomeDisplay, MetronomeControl, TapTempo, SessionStats } from '../../../components/metronome';
import { useMetronome } from '../../../hooks/use-metronome';
import { MetronomeHeader } from './components/header';

export default function MetronomePage() {
  const metronome = useMetronome();

  return (
    <div className="h-full overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* ── Mobile Layout ── */}
      <div className="lg:hidden h-full flex flex-col px-6 py-4">
        <MetronomeHeader />

        {/* Display + Controls grouped and centered */}
        <div className="flex-1 flex flex-col items-stretch justify-center min-h-0 gap-4">
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

      {/* ── Desktop Layout: grid-cols-12 ── */}
      <div className="hidden lg:grid grid-cols-12 gap-8 h-full p-8 overflow-hidden">
        {/* Left 8 cols: Main controls */}
        <div className="col-span-8 flex flex-col gap-6 overflow-y-auto">
          {/* Beat strip card */}
          <div className="glass-card rounded-xl p-6">
            <MetronomeDisplay
              bpm={metronome.bpm}
              currentBeat={metronome.currentBeat}
              timeSignature={metronome.timeSignature}
              isPlaying={metronome.isPlaying}
            />
          </div>

          {/* BPM control card */}
          <div className="glass-card rounded-xl p-6">
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

        {/* Right 4 cols: Tap tempo + history + stats */}
        <div className="col-span-4 flex flex-col gap-6 overflow-y-auto">
          <TapTempo onBpmDetected={metronome.setBpm} />
          <SessionStats
            isPlaying={metronome.isPlaying}
            bpm={metronome.bpm}
            currentBeat={metronome.currentBeat}
          />
        </div>
      </div>
    </div>
  );
}
