'use client';

type SessionStatsProps = {
  isPlaying: boolean;
  bpm: number;
  currentBeat: number;
};

export function SessionStats({ isPlaying, bpm, currentBeat }: SessionStatsProps) {
  return (
    <div className="space-y-4">
      {/* Recent History */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-primary">최근 기록</h4>
          <span className="text-xs text-text-muted">전체 보기</span>
        </div>
        <div className="space-y-2">
          {[
            { bpm: 128, label: '오전 11시34', sub: '20분30초 11,234', },
            { bpm: 95, label: '오후 4시분09', sub: '26분 11,234', },
            { bpm: 144, label: '오후 6시40', sub: '12분 8,640', },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-primary/5 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white tabular-nums">{item.bpm}</span>
                <span className="text-xs text-primary">BPM</span>
              </div>
              <span className="text-xs text-text-muted">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <span className="text-xs text-text-muted block mb-1">총 시간</span>
          <span className="text-lg font-bold text-primary tabular-nums">02:45:12</span>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <span className="text-xs text-text-muted block mb-1">총 비트 수</span>
          <span className="text-lg font-bold text-primary tabular-nums">19,420</span>
        </div>
      </div>
    </div>
  );
}
