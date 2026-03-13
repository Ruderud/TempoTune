'use client';

import { Clock3 } from 'lucide-react';
import { Icon } from '../common/icon.component';

type SessionStatsProps = {
  isPlaying: boolean;
  bpm: number;
  currentBeat: number;
};

// TODO: 실제 세션 기록 저장 및 집계 기능 구현 후 활성화
export function SessionStats({ isPlaying: _isPlaying, bpm: _bpm, currentBeat: _currentBeat }: SessionStatsProps) {
  return (
    <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center min-h-[120px]">
      <Icon icon={Clock3} size={24} strokeWidth={1.75} className="text-primary/30" />
      <span className="text-xs text-text-muted">세션 기록은 준비 중입니다.</span>
    </div>
  );
}
