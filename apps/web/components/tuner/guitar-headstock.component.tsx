'use client';

import Image from 'next/image';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { TuningString } from '@tempo-tune/shared/types';
import { getLayoutSpec } from './headstock-layout.config';

export type { HeadstockLayout } from './headstock-layout.config';

type GuitarHeadstockProps = {
  strings: TuningString[];
  targetString: TuningString | null;
  detectedString: TuningString | null;
  layout?: import('./headstock-layout.config').HeadstockLayout;
  onSelectString?: (string: TuningString) => void;
};

function isSameString(a: TuningString | null, b: TuningString | null): boolean {
  if (!a || !b) return false;
  return a.name === b.name && a.octave === b.octave;
}

function GuitarHeadstockInner({
  strings,
  targetString,
  detectedString,
  layout = 'three-plus-three',
  onSelectString,
}: GuitarHeadstockProps) {
  const searchParams = useSearchParams();
  const debugMode = searchParams.get('headstockDebug') === '1';
  const spec = getLayoutSpec(layout);

  const getButtonStyle = (string: TuningString): string => {
    const isTarget = isSameString(string, targetString);
    const isDetected = isSameString(string, detectedString);
    if (isTarget && isDetected) {
      return 'bg-primary/20 text-primary ring-2 ring-primary active-string-glow scale-105';
    }
    if (isTarget) {
      return 'bg-primary/10 text-primary ring-2 ring-primary/60 active-string-glow scale-105';
    }
    if (isDetected) {
      return 'bg-primary/10 text-primary/80 ring-2 ring-primary/40 shadow-lg shadow-primary/20';
    }
    return 'bg-surface text-gray-300 border border-primary/20 hover:bg-surface/80 hover:text-white';
  };

  // Fallback to simple button list if string count doesn't match anchor config
  const useOverlayMode = strings.length === spec.anchors.length && strings.length === spec.stringToAnchorMap.length;

  if (!useOverlayMode) {
    return (
      <div className="relative w-full max-w-[280px] mx-auto select-none">
        <div className="flex flex-col gap-2 p-4 bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-400 text-center mb-2">현재 프리셋은 기본 버튼 UI를 사용합니다</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {strings.map((string, index) => (
              <button
                key={`${string.name}-${string.octave}-${index}`}
                type="button"
                onClick={() => onSelectString?.(string)}
                className={`min-w-[44px] min-h-[44px] rounded-full flex flex-col items-center justify-center font-bold text-base transition-all duration-200 ${getButtonStyle(string)}`}
                aria-label={`목표 줄 선택 ${string.name}${string.octave}`}
              >
                <span>{string.name}</span>
                <span className="text-xs leading-none opacity-80">{string.octave}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-3 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" />목표</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />감지</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />일치</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[280px] mx-auto select-none">
      <div className="relative w-full aspect-[2/3]">
        <Image
          src={spec.imageSrc}
          alt={spec.imageAlt}
          fill
          sizes="(max-width: 640px) 72vw, 280px"
          className="object-contain pointer-events-none select-none"
        />

        {/* Debug overlay - show anchor points */}
        {debugMode && spec.anchors.map((anchor, index) => (
          <div
            key={`debug-anchor-${index}`}
            className="absolute z-50"
            style={{
              left: `${anchor.x * 100}%`,
              top: `${anchor.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full border border-white shadow-lg" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-1 rounded whitespace-nowrap">
              {index}
            </div>
          </div>
        ))}

        {/* String buttons positioned at anchors */}
        {strings.map((string, stringIndex) => {
          const anchorIndex = spec.stringToAnchorMap[stringIndex];
          const anchor = spec.anchors[anchorIndex];
          if (!anchor) return null;

          return (
            <div
              key={`${string.name}-${string.octave}-${stringIndex}`}
              className="absolute"
              style={{
                left: `${anchor.x * 100}%`,
                top: `${anchor.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <button
                type="button"
                onClick={() => onSelectString?.(string)}
                className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex flex-col items-center justify-center font-bold text-base transition-all duration-200 ${getButtonStyle(string)}`}
                aria-label={`목표 줄 선택 ${string.name}${string.octave}`}
              >
                <span>{string.name}</span>
                <span className="text-xs leading-none opacity-80">{string.octave}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3 text-xs text-primary/60">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />목표</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/60" />감지</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary glow-primary" />일치</span>
      </div>
    </div>
  );
}

export function GuitarHeadstock(props: GuitarHeadstockProps) {
  return (
    <Suspense fallback={<GuitarHeadstockFallback {...props} />}>
      <GuitarHeadstockInner {...props} />
    </Suspense>
  );
}

function GuitarHeadstockFallback({
  strings,
  targetString,
  detectedString,
  layout = 'three-plus-three',
  onSelectString,
}: GuitarHeadstockProps) {
  const spec = getLayoutSpec(layout);

  const getButtonStyle = (string: TuningString): string => {
    const isTarget = isSameString(string, targetString);
    const isDetected = isSameString(string, detectedString);
    if (isTarget && isDetected) {
      return 'bg-primary/20 text-primary ring-2 ring-primary active-string-glow scale-105';
    }
    if (isTarget) {
      return 'bg-primary/10 text-primary ring-2 ring-primary/60 active-string-glow scale-105';
    }
    if (isDetected) {
      return 'bg-primary/10 text-primary/80 ring-2 ring-primary/40 shadow-lg shadow-primary/20';
    }
    return 'bg-surface text-gray-300 border border-primary/20 hover:bg-surface/80 hover:text-white';
  };

  const useOverlayMode = strings.length === spec.anchors.length && strings.length === spec.stringToAnchorMap.length;

  if (!useOverlayMode) {
    return (
      <div className="relative w-full max-w-[280px] mx-auto select-none">
        <div className="flex flex-col gap-2 p-4 bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-400 text-center mb-2">현재 프리셋은 기본 버튼 UI를 사용합니다</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {strings.map((string, index) => (
              <button
                key={`${string.name}-${string.octave}-${index}`}
                type="button"
                onClick={() => onSelectString?.(string)}
                className={`min-w-[44px] min-h-[44px] rounded-full flex flex-col items-center justify-center font-bold text-base transition-all duration-200 ${getButtonStyle(string)}`}
                aria-label={`목표 줄 선택 ${string.name}${string.octave}`}
              >
                <span>{string.name}</span>
                <span className="text-xs leading-none opacity-80">{string.octave}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-3 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" />목표</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />감지</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />일치</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[280px] mx-auto select-none">
      <div className="relative w-full aspect-[2/3]">
        <Image
          src={spec.imageSrc}
          alt={spec.imageAlt}
          fill
          sizes="(max-width: 640px) 72vw, 280px"
          className="object-contain pointer-events-none select-none"
        />

        {strings.map((string, stringIndex) => {
          const anchorIndex = spec.stringToAnchorMap[stringIndex];
          const anchor = spec.anchors[anchorIndex];
          if (!anchor) return null;

          return (
            <div
              key={`${string.name}-${string.octave}-${stringIndex}`}
              className="absolute"
              style={{
                left: `${anchor.x * 100}%`,
                top: `${anchor.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <button
                type="button"
                onClick={() => onSelectString?.(string)}
                className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex flex-col items-center justify-center font-bold text-base transition-all duration-200 ${getButtonStyle(string)}`}
                aria-label={`목표 줄 선택 ${string.name}${string.octave}`}
              >
                <span>{string.name}</span>
                <span className="text-xs leading-none opacity-80">{string.octave}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3 text-xs text-primary/60">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />목표</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/60" />감지</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary glow-primary" />일치</span>
      </div>
    </div>
  );
}
