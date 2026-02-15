'use client';

import type { TunerNote, TuningString } from '@tempo-tune/shared/types';

type CircularDialProps = {
  detectedNote: TunerNote | null;
  targetString: TuningString | null;
  centsFromTarget: number;
  isListening: boolean;
  hasSignal: boolean;
};

function getStatusLabel(cents: number, hasSignal: boolean, isListening: boolean): { text: string; color: string } {
  if (!isListening) return { text: '정지됨', color: 'text-text-muted' };
  if (!hasSignal) return { text: '수음 대기 중', color: 'text-text-muted' };
  const abs = Math.abs(cents);
  if (abs < 5) return { text: '정확함', color: 'text-primary' };
  if (cents > 0) return { text: '약간 높음', color: 'text-amber-400' };
  return { text: '약간 낮음', color: 'text-amber-400' };
}

export function CircularDial({
  detectedNote,
  targetString,
  centsFromTarget,
  isListening,
  hasSignal,
}: CircularDialProps) {
  const note = detectedNote;
  const noteName = note ? note.name : '--';
  const octave = note ? note.octave : '';
  const frequency = note ? `${note.frequency.toFixed(1)} Hz` : '--- Hz';
  const status = getStatusLabel(centsFromTarget, hasSignal, isListening);

  // Arc calculation: map cents (-50 to +50) to arc progress (0 to 1)
  const normalizedCents = hasSignal ? Math.max(-50, Math.min(50, centsFromTarget)) : 0;
  const progress = (normalizedCents + 50) / 100; // 0 = -50c, 0.5 = 0c, 1 = +50c
  const isInTune = hasSignal && Math.abs(centsFromTarget) < 5;

  // SVG arc parameters
  const cx = 144;
  const cy = 144;
  const r = 130;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle; // 240 degrees
  const needleAngle = startAngle + progress * totalAngle;

  const arcPath = (start: number, end: number) => {
    const s = (start * Math.PI) / 180;
    const e = (end * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const largeArc = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle tip position
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleTipX = cx + (r - 8) * Math.cos(needleRad);
  const needleTipY = cy + (r - 8) * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-72 h-72">
        <svg viewBox="0 0 288 288" className="w-full h-full">
          {/* Background arc track */}
          <path
            d={arcPath(startAngle, endAngle)}
            fill="none"
            stroke="rgba(13, 242, 242, 0.1)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Active arc */}
          {hasSignal && (
            <path
              d={arcPath(startAngle, needleAngle)}
              fill="none"
              stroke={isInTune ? '#0df2f2' : 'rgba(13, 242, 242, 0.5)'}
              strokeWidth="6"
              strokeLinecap="round"
            />
          )}

          {/* Center tick at 0 cents */}
          {(() => {
            const zeroAngle = (startAngle + totalAngle * 0.5) * Math.PI / 180;
            const outerX = cx + (r + 4) * Math.cos(zeroAngle);
            const outerY = cy + (r + 4) * Math.sin(zeroAngle);
            const innerX = cx + (r - 10) * Math.cos(zeroAngle);
            const innerY = cy + (r - 10) * Math.sin(zeroAngle);
            return (
              <line
                x1={outerX} y1={outerY} x2={innerX} y2={innerY}
                stroke="#0df2f2" strokeWidth="2" strokeLinecap="round"
              />
            );
          })()}

          {/* Minor ticks at -25 and +25 */}
          {[0.25, 0.75].map((p) => {
            const angle = (startAngle + totalAngle * p) * Math.PI / 180;
            const outerX = cx + (r + 2) * Math.cos(angle);
            const outerY = cy + (r + 2) * Math.sin(angle);
            const innerX = cx + (r - 6) * Math.cos(angle);
            const innerY = cy + (r - 6) * Math.sin(angle);
            return (
              <line
                key={p}
                x1={outerX} y1={outerY} x2={innerX} y2={innerY}
                stroke="rgba(13, 242, 242, 0.3)" strokeWidth="1.5" strokeLinecap="round"
              />
            );
          })}

          {/* Needle indicator dot */}
          {hasSignal && (
            <circle
              cx={needleTipX}
              cy={needleTipY}
              r="5"
              fill={isInTune ? '#0df2f2' : 'rgba(13, 242, 242, 0.7)'}
              className={isInTune ? 'drop-shadow-[0_0_6px_rgba(13,242,242,0.8)]' : ''}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-text-muted mb-1">현재 음악대</span>
          <div className="flex items-baseline">
            <span className={`text-7xl font-black tracking-tight leading-none ${isInTune ? 'text-primary glow-text' : 'text-white'}`}>
              {noteName}
            </span>
            {octave !== '' && (
              <span className="text-3xl font-bold text-text-secondary ml-1 -translate-y-4">
                {octave}
              </span>
            )}
          </div>
          <span className={`text-sm font-semibold mt-2 ${status.color}`}>
            {status.text}
          </span>
          <span className="text-xs text-text-muted mt-1 tabular-nums">
            {frequency}
          </span>
        </div>
      </div>
    </div>
  );
}
