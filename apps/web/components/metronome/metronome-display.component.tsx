'use client';

type MetronomeDisplayProps = {
  bpm: number;
  currentBeat: number;
  timeSignature: [number, number];
  isPlaying: boolean;
};

export function MetronomeDisplay({
  bpm,
  currentBeat,
  timeSignature,
  isPlaying,
}: MetronomeDisplayProps) {
  const [beatsPerMeasure] = timeSignature;
  const beats = Array.from({ length: beatsPerMeasure }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 mb-6">
      {/* BPM Display */}
      <div className="text-center">
        <div className="text-8xl font-bold text-white tabular-nums tracking-tight">{bpm}</div>
        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">BPM</div>
      </div>

      {/* Beat Indicators */}
      <div className="flex items-center gap-3">
        {beats.map((beat) => {
          const isCurrentBeat = isPlaying && beat === currentBeat;
          const isAccent = beat === 1;

          return (
            <div
              key={beat}
              className={`
                w-13 h-13 rounded-full transition-all duration-100 flex items-center justify-center
                ${isCurrentBeat
                  ? isAccent
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 scale-125 shadow-xl shadow-blue-500/50'
                    : 'bg-gradient-to-br from-green-500 to-green-600 scale-125 shadow-xl shadow-green-500/50'
                  : isAccent
                    ? 'bg-gray-800 border-2 border-blue-400/60'
                    : 'bg-gray-800'
                }
              `}
            >
              <span className={`text-sm font-bold ${isCurrentBeat ? 'text-white' : 'text-gray-400'}`}>
                {beat}
              </span>
            </div>
          );
        })}
      </div>

      {/* Time Signature */}
      <div className="text-xl font-medium text-gray-500">
        {timeSignature[0]}/{timeSignature[1]}
      </div>
    </div>
  );
}
