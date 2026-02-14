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
  if (abs < 5) return '#22c55e';
  if (abs < 15) return '#eab308';
  return '#ef4444';
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
  const svgHeightClass = isLarge ? 'h-[44vh] min-h-[280px] max-h-[420px]' : 'h-24';
  const lineWidth = isLarge ? 2.2 : 1.6;
  const pointRadius = isLarge ? 2.2 : 1.8;
  const confidencePercent = Math.round(confidence * 100);
  const confidenceLabel = `${confidencePercent}%`;
  const confidenceColor =
    confidence >= confidenceGate ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
      : confidence > 0.12 ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
      : 'text-gray-400 border-gray-700 bg-gray-900/70';

  const lastIndex = history.length - 1;
  const lastX = lastIndex <= 0 ? 0 : (lastIndex / (MAX_POINTS - 1)) * 100;
  const lastY = lastIndex >= 0 ? centsToY(history[lastIndex]) : centsToY(0);

  return (
    <div className={`rounded-2xl border border-gray-800 bg-gray-900/40 ${isLarge ? 'p-4' : 'p-3'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`${isLarge ? 'text-sm' : 'text-xs'} font-semibold text-gray-300`}>실시간 음정 편차</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-700 bg-gray-900/70 text-gray-400">
            {noteLabel}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-700 bg-gray-900/70 text-gray-500">
            목표 {targetLabel}
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full border tabular-nums ${confidenceColor}`}>
            신뢰도 {confidenceLabel}
          </span>
        </div>
        <span className="text-xs font-semibold tabular-nums" style={{ color: hasSignal ? trendColor : '#6b7280' }}>
          {isLowConfidence && isListening ? '신뢰도 낮음' : label}
        </span>
      </div>

      <svg
        viewBox="0 0 100 100"
        className={`w-full mt-2 ${svgHeightClass}`}
        role="img"
        aria-label="목표 음정 대비 실시간 편차 그래프"
      >
        <line x1="0" y1={centsToY(15)} x2="100" y2={centsToY(15)} stroke="rgba(239, 68, 68, 0.25)" strokeWidth="0.8" />
        <line x1="0" y1={centsToY(5)} x2="100" y2={centsToY(5)} stroke="rgba(234, 179, 8, 0.3)" strokeWidth="0.8" />
        <line x1="0" y1={centsToY(0)} x2="100" y2={centsToY(0)} stroke="rgba(94, 234, 212, 0.5)" strokeWidth="1" />
        <line x1="0" y1={centsToY(-5)} x2="100" y2={centsToY(-5)} stroke="rgba(234, 179, 8, 0.3)" strokeWidth="0.8" />
        <line x1="0" y1={centsToY(-15)} x2="100" y2={centsToY(-15)} stroke="rgba(239, 68, 68, 0.25)" strokeWidth="0.8" />

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

      <div className={`mt-1 flex items-center justify-between ${isLarge ? 'text-xs' : 'text-[10px]'} text-gray-500 tabular-nums`}>
        <span>-50c</span>
        <span>0c</span>
        <span>+50c</span>
      </div>
    </div>
  );
}
