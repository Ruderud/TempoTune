'use client';

import type { TuningString } from '@tempo-tune/shared/types';

type StringIndicatorProps = {
  strings: TuningString[];
  activeString: TuningString | null;
};

export function StringIndicator({ strings, activeString }: StringIndicatorProps) {
  return (
    <div className="w-full max-w-md mx-auto py-6">
      <div className="flex justify-around items-center">
        {strings.map((string, index) => {
          const isActive =
            activeString &&
            string.name === activeString.name &&
            string.octave === activeString.octave;

          return (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/50'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {string.name}
              </div>
              <div className="text-xs text-gray-500">{string.octave}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
