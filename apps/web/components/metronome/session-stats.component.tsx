'use client';

type SessionStatsProps = {
  isPlaying: boolean;
  bpm: number;
  currentBeat: number;
};

// TODO: 실제 세션 기록 저장 및 집계 기능 구현 후 활성화
export function SessionStats({ isPlaying: _isPlaying, bpm: _bpm, currentBeat: _currentBeat }: SessionStatsProps) {
  return (
    <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center min-h-[120px]">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/30">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span className="text-xs text-text-muted">세션 기록은 준비 중입니다.</span>
    </div>
  );
}
