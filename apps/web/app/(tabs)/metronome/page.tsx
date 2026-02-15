'use client';

import { MetronomeDisplay, MetronomeControl, TapTempo, SessionStats } from '../../../components/metronome';
import { useMetronome } from '../../../hooks/use-metronome';

export default function MetronomePage() {
  const metronome = useMetronome();

  return (
    <div className="h-full overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* ── Mobile Layout ── */}
      <div className="lg:hidden h-full flex flex-col px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button type="button" className="w-8 h-8 rounded-lg bg-surface border border-primary/10 flex items-center justify-center text-primary/60">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">TEMPOTUNE</span>
          </div>
          <button type="button" className="w-8 h-8 rounded-lg bg-surface border border-primary/10 flex items-center justify-center text-primary/60">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </button>
        </div>

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
