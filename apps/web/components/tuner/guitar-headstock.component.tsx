'use client';

import Image from 'next/image';
import type { TuningString } from '@tempo-tune/shared/types';

export type HeadstockLayout = 'three-plus-three' | 'six-inline';

type GuitarHeadstockProps = {
  strings: TuningString[];
  targetString: TuningString | null;
  detectedString: TuningString | null;
  layout?: HeadstockLayout;
  onSelectString?: (string: TuningString) => void;
};

type ButtonSlot = {
  side: 'left' | 'right';
  string: TuningString;
  yPercent: number;
};

const HEADSTOCK_LAYOUT_CONFIG: Record<
  HeadstockLayout,
  { imageSrc: string; imageAlt: string; startPercent: number; endPercent: number; splitSides: boolean }
> = {
  'three-plus-three': {
    imageSrc: '/images/tuner/headstock-3-plus-3.png',
    imageAlt: '3+3 기타 헤드스톡',
    startPercent: 22,
    endPercent: 39,
    splitSides: true,
  },
  'six-inline': {
    imageSrc: '/images/tuner/headstock-6-inline.png',
    imageAlt: '6-인라인 기타 헤드스톡',
    startPercent: 22,
    endPercent: 52,
    splitSides: false,
  },
};

function isSameString(a: TuningString | null, b: TuningString | null): boolean {
  if (!a || !b) return false;
  return a.name === b.name && a.octave === b.octave;
}

function getLinearPositions(count: number, startPercent: number, endPercent: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [(startPercent + endPercent) / 2];
  const step = (endPercent - startPercent) / (count - 1);
  return Array.from({ length: count }, (_, i) => startPercent + step * i);
}

function buildButtonSlots(strings: TuningString[], layout: HeadstockLayout): ButtonSlot[] {
  const config = HEADSTOCK_LAYOUT_CONFIG[layout];

  if (!config.splitSides) {
    const yPositions = getLinearPositions(strings.length, config.startPercent, config.endPercent);
    return strings.map((string, index) => ({
      side: 'left',
      string,
      yPercent: yPositions[index] ?? config.startPercent,
    }));
  }

  const splitIndex = Math.ceil(strings.length / 2);
  const leftStrings = strings.slice(0, splitIndex);
  const rightStrings = strings.slice(splitIndex);
  const leftPositions = getLinearPositions(leftStrings.length, config.startPercent, config.endPercent);
  const rightPositions = getLinearPositions(rightStrings.length, config.startPercent, config.endPercent);

  return [
    ...leftStrings.map((string, index) => ({
      side: 'left' as const,
      string,
      yPercent: leftPositions[index] ?? config.startPercent,
    })),
    ...rightStrings.map((string, index) => ({
      side: 'right' as const,
      string,
      yPercent: rightPositions[index] ?? config.startPercent,
    })),
  ];
}

export function GuitarHeadstock({
  strings,
  targetString,
  detectedString,
  layout = 'three-plus-three',
  onSelectString,
}: GuitarHeadstockProps) {
  const layoutConfig = HEADSTOCK_LAYOUT_CONFIG[layout];
  const buttonSlots = buildButtonSlots(strings, layout);

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
      <div className="relative w-full aspect-[2/3]">
        <Image
          src={layoutConfig.imageSrc}
          alt={layoutConfig.imageAlt}
          fill
          sizes="(max-width: 640px) 72vw, 280px"
          className="object-contain pointer-events-none select-none"
        />

        {buttonSlots.map((slot, index) => (
          <div
            key={`${slot.side}-${slot.string.name}-${slot.string.octave}-${index}`}
            className="absolute flex items-center justify-center"
            style={{
              left: slot.side === 'left' ? (layout === 'six-inline' ? '3%' : '4%') : undefined,
              right: slot.side === 'right' ? '4%' : undefined,
              top: `${slot.yPercent}%`,
              transform: 'translateY(-50%)',
              width: '18%',
              height: '8%',
            }}
          >
            <button
              type="button"
              onClick={() => onSelectString?.(slot.string)}
              className={`w-11 h-11 rounded-full flex flex-col items-center justify-center font-bold text-base transition-all duration-200 ${getButtonStyle(slot.string)}`}
              aria-label={`목표 줄 선택 ${slot.string.name}${slot.string.octave}`}
            >
              <span>{slot.string.name}</span>
              <span className="text-[10px] leading-none opacity-80">{slot.string.octave}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-gray-400">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" />목표</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />감지</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />일치</span>
      </div>
    </div>
  );
}
