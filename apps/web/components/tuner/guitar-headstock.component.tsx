'use client';

import type { TuningString } from '@tempo-tune/shared/types';

type GuitarHeadstockProps = {
  strings: TuningString[];
  targetString: TuningString | null;
  detectedString: TuningString | null;
  onSelectString?: (string: TuningString) => void;
};

function isSameString(a: TuningString | null, b: TuningString | null): boolean {
  if (!a || !b) return false;
  return a.name === b.name && a.octave === b.octave;
}

function getPegYPositions(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [205];
  const start = 130;
  const end = 280;
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + step * i);
}

function getStringXPositions(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [140];
  const start = 115;
  const end = 165;
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + step * i);
}

export function GuitarHeadstock({
  strings,
  targetString,
  detectedString,
  onSelectString,
}: GuitarHeadstockProps) {
  const splitIndex = Math.ceil(strings.length / 2);
  const leftStrings = strings.slice(0, splitIndex);
  const rightStrings = strings.slice(splitIndex);
  const leftPegYPositions = getPegYPositions(leftStrings.length);
  const rightPegYPositions = getPegYPositions(rightStrings.length);
  const stringXPositions = getStringXPositions(strings.length);

  const getStringStroke = (string: TuningString): string => {
    const isTarget = isSameString(string, targetString);
    const isDetected = isSameString(string, detectedString);
    if (isTarget && isDetected) return '#22c55e';
    if (isTarget) return '#38bdf8';
    if (isDetected) return '#f59e0b';
    return '#C0C0C0';
  };

  const getButtonStyle = (string: TuningString): string => {
    const isTarget = isSameString(string, targetString);
    const isDetected = isSameString(string, detectedString);
    if (isTarget && isDetected) {
      return 'bg-green-500/20 text-green-300 ring-2 ring-green-400 shadow-lg shadow-green-500/30 scale-105';
    }
    if (isTarget) {
      return 'bg-sky-500/20 text-sky-300 ring-2 ring-sky-400 shadow-lg shadow-sky-500/30 scale-105';
    }
    if (isDetected) {
      return 'bg-amber-500/20 text-amber-300 ring-2 ring-amber-400 shadow-lg shadow-amber-500/30';
    }
    return 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 hover:text-white';
  };

  return (
    <div className="relative w-full max-w-[280px] mx-auto select-none">
      <svg
        viewBox="0 0 280 400"
        className="w-full h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 380 L100 100 Q100 50 140 30 Q180 50 180 100 L180 380"
          fill="#5C3A1E"
          stroke="#3D2510"
          strokeWidth="2"
        />
        <path
          d="M108 375 L108 105 Q108 60 140 38 Q172 60 172 105 L172 375"
          fill="#7A4E2D"
        />

        <line x1="140" y1="50" x2="140" y2="380" stroke="#6B4226" strokeWidth="0.5" opacity="0.5" />
        <line x1="130" y1="60" x2="130" y2="380" stroke="#6B4226" strokeWidth="0.3" opacity="0.3" />
        <line x1="150" y1="60" x2="150" y2="380" stroke="#6B4226" strokeWidth="0.3" opacity="0.3" />

        <rect x="105" y="365" width="70" height="8" rx="2" fill="#F5F0E8" stroke="#D4C9B8" strokeWidth="1" />

        {strings.map((string, index) => {
          const x = stringXPositions[index] ?? 140;
          const thickness = Math.max(1.2, 2.6 - index * 0.22);
          return (
            <line
              key={`${string.name}-${string.octave}-${index}`}
              x1={x}
              y1="60"
              x2={x}
              y2="365"
              stroke={getStringStroke(string)}
              strokeWidth={thickness}
              opacity={0.95}
            />
          );
        })}

        {leftPegYPositions.map((y, i) => (
          <g key={`left-${i}`}>
            <rect x="70" y={y - 4} width="38" height="8" rx="3" fill="#888" stroke="#666" strokeWidth="1" />
            <ellipse cx="58" cy={y} rx="14" ry="10" fill="#AAA" stroke="#777" strokeWidth="1.5" />
            <ellipse cx="58" cy={y} rx="9" ry="6" fill="#CCC" />
          </g>
        ))}

        {rightPegYPositions.map((y, i) => (
          <g key={`right-${i}`}>
            <rect x="172" y={y - 4} width="38" height="8" rx="3" fill="#888" stroke="#666" strokeWidth="1" />
            <ellipse cx="222" cy={y} rx="14" ry="10" fill="#AAA" stroke="#777" strokeWidth="1.5" />
            <ellipse cx="222" cy={y} rx="9" ry="6" fill="#CCC" />
          </g>
        ))}
      </svg>

      {leftStrings.map((string, i) => {
        const topPercent = ((leftPegYPositions[i] ?? 205) / 400) * 100;
        return (
          <div
            key={`left-btn-${string.name}-${string.octave}-${i}`}
            className="absolute flex items-center justify-center"
            style={{
              left: '3%',
              top: `${topPercent}%`,
              transform: 'translateY(-50%)',
              width: '18%',
              height: '8%',
            }}
          >
            <button
              type="button"
              onClick={() => onSelectString?.(string)}
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center font-bold text-lg transition-all duration-200 ${getButtonStyle(string)}`}
              aria-label={`목표 줄 선택 ${string.name}${string.octave}`}
            >
              <span>{string.name}</span>
              <span className="text-[10px] leading-none opacity-80">{string.octave}</span>
            </button>
          </div>
        );
      })}

      {rightStrings.map((string, i) => {
        const topPercent = ((rightPegYPositions[i] ?? 205) / 400) * 100;
        return (
          <div
            key={`right-btn-${string.name}-${string.octave}-${i}`}
            className="absolute flex items-center justify-center"
            style={{
              right: '3%',
              top: `${topPercent}%`,
              transform: 'translateY(-50%)',
              width: '18%',
              height: '8%',
            }}
          >
            <button
              type="button"
              onClick={() => onSelectString?.(string)}
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center font-bold text-lg transition-all duration-200 ${getButtonStyle(string)}`}
              aria-label={`목표 줄 선택 ${string.name}${string.octave}`}
            >
              <span>{string.name}</span>
              <span className="text-[10px] leading-none opacity-80">{string.octave}</span>
            </button>
          </div>
        );
      })}

      <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-gray-400">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" />목표</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />감지</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />일치</span>
      </div>
    </div>
  );
}
