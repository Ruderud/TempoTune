'use client';

import { COMMON_TIME_SIGNATURES, MAX_BPM, MIN_BPM } from '@tempo-tune/shared/constants';

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
    <div className="flex flex-col items-center space-y-6">
      {/* BPM Slider */}
      <div className="w-full max-w-sm">
        <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBpmChange(bpm - 1)}
              disabled={isPlaying}
              className={`
                w-11 h-11 shrink-0 rounded-xl font-bold text-lg transition-all duration-150
                ${isPlaying
                  ? 'bg-gray-800/40 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:scale-95 shadow-sm'
                }
              `}
            >
              −
            </button>

            <input
              type="range"
              min={MIN_BPM}
              max={MAX_BPM}
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="flex-1 min-w-0 h-2 bg-gray-800 rounded-full appearance-none cursor-pointer slider"
            />

            <button
              onClick={() => handleBpmChange(bpm + 1)}
              disabled={isPlaying}
              className={`
                w-11 h-11 shrink-0 rounded-xl font-bold text-lg transition-all duration-150
                ${isPlaying
                  ? 'bg-gray-800/40 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:scale-95 shadow-sm'
                }
              `}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Time Signature Buttons */}
      <div className="w-full max-w-sm">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">
          박자
        </div>
        <div className="flex gap-2 justify-center">
          {COMMON_TIME_SIGNATURES.map((ts) => {
            const [beats, noteValue] = ts;
            const isActive = timeSignature[0] === beats && timeSignature[1] === noteValue;

            return (
              <button
                key={`${beats}/${noteValue}`}
                onClick={() => onTimeSignatureChange(ts)}
                disabled={isPlaying}
                className={`
                  px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-[1.02]'
                    : 'bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-gray-300 active:scale-95'
                  }
                  ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {beats}/{noteValue}
              </button>
            );
          })}
        </div>
      </div>

      {/* Play/Stop Button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={isPlaying ? onStop : onStart}
          className={`
            relative w-24 h-24 rounded-full font-bold text-base transition-all duration-300
            ${isPlaying
              ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 shadow-xl shadow-red-600/40'
              : 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 active:scale-95 shadow-xl shadow-green-600/40'
            }
          `}
        >
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-200" />
          <span className="relative z-10 text-white drop-shadow-lg">
            {isPlaying ? '정지' : '시작'}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isPlaying ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-gray-700'
            }`}
          />
          <span className="text-xs text-gray-500 font-medium">
            {isPlaying ? '재생 중...' : '대기 중'}
          </span>
        </div>
      </div>

      {/* Custom Sound Upload */}
      {onLoadCustomSound && (
        <div className="flex gap-2">
          <label className="min-h-[44px] flex items-center justify-center px-4 text-xs font-medium bg-gray-800/40 hover:bg-gray-800/70 active:scale-95 rounded-xl cursor-pointer transition-all duration-150 text-gray-500 hover:text-gray-300 border border-gray-800/50">
            강세음 업로드
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleFileUpload(e, 'accent')}
              className="hidden"
            />
          </label>
          <label className="min-h-[44px] flex items-center justify-center px-4 text-xs font-medium bg-gray-800/40 hover:bg-gray-800/70 active:scale-95 rounded-xl cursor-pointer transition-all duration-150 text-gray-500 hover:text-gray-300 border border-gray-800/50">
            일반음 업로드
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
