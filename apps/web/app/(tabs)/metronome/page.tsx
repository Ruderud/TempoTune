'use client';

import Link from 'next/link';
import { MetronomeDisplay, MetronomeControl, TapTempo } from '../../../components/metronome';
import { useMetronome } from '../../../hooks/use-metronome';
import { MetronomeHeader } from './components/header';

function PracticeShortcutCard() {
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-xs uppercase tracking-[0.28em] text-primary/80">Rhythm Practice</p>
      <h3 className="mt-2 text-lg font-bold text-text-strong">박자 연습은 새 탭에서 진행합니다</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        하단의 <span className="font-semibold text-primary">박자</span> 탭에서 입력 장치 선택, 카운트다운, 정확도 피드백을 한 화면에서 볼 수 있습니다.
      </p>
      <Link
        href="/rhythm"
        className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary px-4 text-sm font-bold text-background-dark transition-all hover:brightness-105"
      >
        박자 연습으로 이동
      </Link>
    </div>
  );
}

export default function MetronomePage() {
  const metronome = useMetronome();

  return (
    <div className="h-full overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      <div className="lg:hidden h-full flex flex-col overflow-hidden px-6 py-4">
        <MetronomeHeader />

        <div className="mt-3 flex min-h-0 flex-1 flex-col justify-center gap-4">
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

      <div className="hidden lg:grid grid-cols-12 gap-8 h-full p-8 overflow-hidden">
        <div className="col-span-8 flex flex-col gap-6 overflow-y-auto">
          <div className="glass-card rounded-xl p-6">
            <MetronomeDisplay
              bpm={metronome.bpm}
              currentBeat={metronome.currentBeat}
              timeSignature={metronome.timeSignature}
              isPlaying={metronome.isPlaying}
            />
          </div>

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

        <div className="col-span-4 flex flex-col gap-6 overflow-y-auto">
          <TapTempo onBpmDetected={metronome.setBpm} />
          <PracticeShortcutCard />
        </div>
      </div>
    </div>
  );
}
