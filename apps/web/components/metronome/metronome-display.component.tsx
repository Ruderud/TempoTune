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
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      {/* BPM Display */}
      <div className="text-center">
        <div className="text-8xl font-bold text-white">{bpm}</div>
        <div className="text-xl text-gray-400 mt-2">BPM</div>
      </div>

      {/* Beat Indicators */}
      <div className="flex items-center gap-4">
        {beats.map((beat) => {
          const isCurrentBeat = isPlaying && beat === currentBeat;
          const isAccent = beat === 1;

          return (
            <div
              key={beat}
              className={`w-12 h-12 rounded-full transition-all duration-100 ${
                isCurrentBeat
                  ? isAccent
                    ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50'
                    : 'bg-green-500 scale-125 shadow-lg shadow-green-500/50'
                  : isAccent
                  ? 'bg-gray-700 border-2 border-blue-400'
                  : 'bg-gray-700'
              }`}
            >
              <div className="w-full h-full flex items-center justify-center text-sm font-medium">
                {beat}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Signature */}
      <div className="text-2xl text-gray-400">
        {timeSignature[0]}/{timeSignature[1]}
      </div>
    </div>
  );
}
