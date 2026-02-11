'use client';

import { COMMON_TIME_SIGNATURES, MAX_BPM, MIN_BPM } from '@tempo-tune/domain/constants';

type MetronomeControlProps = {
  bpm: number;
  timeSignature: [number, number];
  isPlaying: boolean;
  onBpmChange: (bpm: number) => void;
  onTimeSignatureChange: (ts: [number, number]) => void;
  onStart: () => void;
  onStop: () => void;
  onLoadCustomSound?: (file: File, type: 'accent' | 'normal') => void;
};

export function MetronomeControl({
  bpm,
  timeSignature,
  isPlaying,
  onBpmChange,
  onTimeSignatureChange,
  onStart,
  onStop,
  onLoadCustomSound,
}: MetronomeControlProps) {
  const handleBpmChange = (newBpm: number) => {
    const clampedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
    onBpmChange(clampedBpm);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'accent' | 'normal') => {
    const file = e.target.files?.[0];
    if (file && onLoadCustomSound) {
      onLoadCustomSound(file, type);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 pb-8">
      {/* BPM Controls */}
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => handleBpmChange(bpm - 1)}
            className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 active:bg-gray-600 transition-colors flex items-center justify-center text-2xl font-bold"
          >
            −
          </button>

          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />

          <button
            onClick={() => handleBpmChange(bpm + 1)}
            className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 active:bg-gray-600 transition-colors flex items-center justify-center text-2xl font-bold"
          >
            +
          </button>
        </div>

        {/* Time Signature Buttons */}
        <div className="flex gap-2 justify-center">
          {COMMON_TIME_SIGNATURES.map((ts) => {
            const [beats, noteValue] = ts;
            const isActive = timeSignature[0] === beats && timeSignature[1] === noteValue;

            return (
              <button
                key={`${beats}/${noteValue}`}
                onClick={() => onTimeSignatureChange(ts)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                }`}
              >
                {beats}/{noteValue}
              </button>
            );
          })}
        </div>
      </div>

      {/* Play/Stop Button */}
      <button
        onClick={isPlaying ? onStop : onStart}
        className={`w-24 h-24 rounded-full font-bold text-xl transition-all ${
          isPlaying
            ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-lg shadow-red-600/50'
            : 'bg-green-600 hover:bg-green-500 active:bg-green-700 shadow-lg shadow-green-600/50'
        }`}
      >
        {isPlaying ? '정지' : '시작'}
      </button>

      {/* Custom Sound Upload */}
      {onLoadCustomSound && (
        <div className="flex gap-2">
          <label className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-lg cursor-pointer transition-colors">
            강세음
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleFileUpload(e, 'accent')}
              className="hidden"
            />
          </label>
          <label className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-lg cursor-pointer transition-colors">
            일반음
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleFileUpload(e, 'normal')}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}
