'use client';

import { useMemo } from 'react';
import type { TunerNote, TuningString } from '@tempo-tune/shared/types';

type TuningTrendGraphProps = {
  detectedNote: TunerNote | null;
  targetString: TuningString | null;
  centsFromTarget: number;
  centsHistory: number[];
  isListening: boolean;
  hasSignal: boolean;
  confidence: number;
  confidenceGate: number;
  isLowConfidence: boolean;
  size?: 'compact' | 'large';
};

const MAX_POINTS = 90;
const MAX_ABS_CENTS = 50;
const GRAPH_TOP = 14;
const GRAPH_BOTTOM = 86;

function getTrendColor(cents: number): string {
  const abs = Math.abs(cents);
  if (abs < 5) return '#0df2f2';
  if (abs < 15) return '#0df2f2';
  return '#0df2f2';
}

function centsToY(cents: number): number {
  const clamped = Math.max(-MAX_ABS_CENTS, Math.min(MAX_ABS_CENTS, cents));
  const normalized = (clamped + MAX_ABS_CENTS) / (MAX_ABS_CENTS * 2);
  return GRAPH_BOTTOM - normalized * (GRAPH_BOTTOM - GRAPH_TOP);
}

export function TuningTrendGraph({
  detectedNote,
  targetString,
  centsFromTarget,
  centsHistory,
  isListening,
  hasSignal,
  confidence,
  confidenceGate,
  isLowConfidence,
  size = 'compact',
}: TuningTrendGraphProps) {
  const isLarge = size === 'large';
  const history = centsHistory.slice(-MAX_POINTS);
  const points = useMemo(() => {
    if (history.length === 0) return '';
    if (history.length === 1) return `0,${centsToY(history[0])}`;
    return history
      .map((value, index) => {
        const x = (index / (MAX_POINTS - 1)) * 100;
        const y = centsToY(value);
        return `${x},${y}`;
      })
      .join(' ');
  }, [history]);

  const currentCents = hasSignal ? Math.round(centsFromTarget) : 0;
  const trendColor = getTrendColor(centsFromTarget);
  const label = hasSignal
    ? `${currentCents > 0 ? '+' : ''}${currentCents} cents`
    : isListening
      ? '수음 대기 중'
      : '정지됨';
  const noteLabel = detectedNote ? `${detectedNote.name}${detectedNote.octave}` : '--';
  const targetLabel = targetString ? `${targetString.name}${targetString.octave}` : 'AUTO';
  const svgHeightClass = isLarge ? 'h-[32vh] min-h-[160px] max-h-[280px]' : 'h-14';
  const lineWidth = isLarge ? 2.2 : 1.6;
  const pointRadius = isLarge ? 2.2 : 1.8;
  const confidencePercent = Math.round(confidence * 100);
  const confidenceLabel = `${confidencePercent}%`;
  const confidenceColor =
    confidence >= confidenceGate ? 'text-primary border-primary/30 bg-primary/10'
      : confidence > 0.12 ? 'text-primary/60 border-primary/20 bg-primary/5'
      : 'text-gray-400 border-gray-700 bg-gray-900/70';

  const lastIndex = history.length - 1;
  const lastX = lastIndex <= 0 ? 0 : (lastIndex / (MAX_POINTS - 1)) * 100;
  const lastY = lastIndex >= 0 ? centsToY(history[lastIndex]) : centsToY(0);

  return (
    <div className={`rounded-2xl border border-primary/10 bg-surface/30 ${isLarge ? 'p-4' : 'p-2.5'}`}>
      {isLarge ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="text-sm font-semibold text-primary/80">음정 편차</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full border border-primary/20 bg-surface text-primary/60 tabular-nums">
              {noteLabel}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-full border border-primary/20 bg-surface text-primary/40 tabular-nums">
              {targetLabel}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full border tabular-nums ${confidenceColor}`}>
              {confidenceLabel}
            </span>
          </div>
          <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: hasSignal ? trendColor : '#6b7280' }}>
            {isLowConfidence && isListening ? '신뢰도 낮음' : label}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-primary/80">음정 편차</span>
          <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: hasSignal ? trendColor : '#6b7280' }}>
            {isLowConfidence && isListening ? '신뢰도 낮음' : label}
          </span>
        </div>
      )}

      <svg
        viewBox="0 0 100 100"
        className={`w-full ${isLarge ? 'mt-2' : 'mt-1'} ${svgHeightClass}`}
        role="img"
        aria-label="목표 음정 대비 실시간 편차 그래프"
      >
        <line x1="0" y1={centsToY(15)} x2="100" y2={centsToY(15)} stroke="rgba(13, 242, 242, 0.15)" strokeWidth="0.8" />
        <line x1="0" y1={centsToY(5)} x2="100" y2={centsToY(5)} stroke="rgba(13, 242, 242, 0.25)" strokeWidth="0.8" />
        <line x1="0" y1={centsToY(0)} x2="100" y2={centsToY(0)} stroke="rgba(13, 242, 242, 0.5)" strokeWidth="1" />
        <line x1="0" y1={centsToY(-5)} x2="100" y2={centsToY(-5)} stroke="rgba(13, 242, 242, 0.25)" strokeWidth="0.8" />
        <line x1="0" y1={centsToY(-15)} x2="100" y2={centsToY(-15)} stroke="rgba(13, 242, 242, 0.15)" strokeWidth="0.8" />

        {history.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke={trendColor}
            strokeWidth={lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {history.length > 0 && (
          <circle cx={lastX} cy={lastY} r={pointRadius} fill={trendColor} />
        )}
      </svg>

      {isLarge && (
        <div className="mt-1 flex items-center justify-between text-xs text-primary/40 tabular-nums">
          <span>-50c</span>
          <span>0c</span>
          <span>+50c</span>
        </div>
      )}
    </div>
  );
}
