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
                ? 'bg-primary/15 text-primary ring-2 ring-primary shadow-lg shadow-primary/20 scale-110'
                : 'bg-card-soft text-text-muted border border-border-subtle hover:bg-card-strong'
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
