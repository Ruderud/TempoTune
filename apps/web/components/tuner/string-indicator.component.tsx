'use client';

import type { TuningString } from '@tempo-tune/shared/types';

type StringIndicatorProps = {
  strings: TuningString[];
  activeString: TuningString | null;
};

export function StringIndicator({ strings, activeString }: StringIndicatorProps) {
  // Display from low to high (6th string at left, 1st at right) for horizontal layout
  const displayStrings = [...strings];

  return (
    <div className="flex items-center justify-center gap-3">
      {displayStrings.map((string, index) => {
        const isActive =
          activeString &&
          string.name === activeString.name &&
          string.octave === activeString.octave;

        return (
          <div
            key={index}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center
              font-bold text-lg transition-all duration-200
              ${isActive
                ? 'bg-gray-800 text-green-400 ring-2 ring-green-400 shadow-lg shadow-green-500/30 scale-110'
                : 'bg-gray-800/60 text-gray-400 hover:bg-gray-800'
              }
            `}
          >
            {string.name}
          </div>
        );
      })}
    </div>
  );
}
