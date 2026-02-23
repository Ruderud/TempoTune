'use client';

import { useCallback, useRef, useState } from 'react';
import { Icon } from '../common/icon.component';

type TapTempoProps = {
  onBpmDetected: (bpm: number) => void;
};

const MIN_TAPS = 3;
const MAX_TAP_INTERVAL_MS = 3000;

export function TapTempo({ onBpmDetected }: TapTempoProps) {
  const tapTimesRef = useRef<number[]>([]);
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  const [tapCount, setTapCount] = useState(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const taps = tapTimesRef.current;

    // Reset if last tap was too long ago
    if (taps.length > 0 && now - taps[taps.length - 1] > MAX_TAP_INTERVAL_MS) {
      tapTimesRef.current = [];
    }

    tapTimesRef.current.push(now);
    setTapCount(tapTimesRef.current.length);

    if (tapTimesRef.current.length >= MIN_TAPS) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avgInterval);
      const clampedBpm = Math.max(20, Math.min(300, bpm));
      setDetectedBpm(clampedBpm);
      onBpmDetected(clampedBpm);
    }
  }, [onBpmDetected]);

  const handleReset = useCallback(() => {
    tapTimesRef.current = [];
    setDetectedBpm(null);
    setTapCount(0);
  }, []);

  return (
    <div className="glass-card rounded-xl p-5 flex flex-col items-center gap-4">
      <h4 className="text-sm font-bold text-primary uppercase tracking-widest">탭 템포</h4>
      <p className="text-xs text-text-muted text-center">리듬에 맞춰 버튼을 눌러주세요</p>

      <button
        type="button"
        onClick={handleTap}
        className="w-24 h-24 rounded-full bg-surface border-2 border-primary/30 flex items-center justify-center transition-all hover:border-primary/60 active:scale-95 active:bg-primary/20"
      >
        <Icon src="/assets/icons/clock.svg" size={32} className="text-primary" label="탭 템포" />
      </button>

      <div className="text-center">
        {detectedBpm !== null ? (
          <span className="text-2xl font-bold text-primary tabular-nums">{detectedBpm} <span className="text-xs text-text-muted">BPM</span></span>
        ) : (
          <span className="text-xs text-text-muted">{tapCount > 0 ? `${tapCount}회 탭...` : '탭을 시작하세요'}</span>
        )}
      </div>

      {tapCount > 0 && (
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-text-muted hover:text-primary transition-colors"
        >
          초기화
        </button>
      )}
    </div>
  );
}
