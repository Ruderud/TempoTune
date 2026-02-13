'use client';

import type { TuningString } from '@tempo-tune/shared/types';

type GuitarHeadstockProps = {
  strings: TuningString[];
  activeString: TuningString | null;
};

export function GuitarHeadstock({ strings, activeString }: GuitarHeadstockProps) {
  // Standard 6-string: strings[0]=E2 ... strings[5]=E4
  // Left pegs (bass): E2, A2, D3 — indices 0, 1, 2
  // Right pegs (treble): G3, B3, E4 — indices 3, 4, 5
  const leftStrings = strings.slice(0, 3);
  const rightStrings = strings.slice(3, 6);

  // Peg Y positions (relative to SVG viewBox 0 0 280 400)
  const pegYPositions = [135, 205, 275];

  const isActive = (s: TuningString) =>
    activeString &&
    s.name === activeString.name &&
    s.octave === activeString.octave;

  return (
    <div className="relative w-full max-w-[280px] mx-auto select-none">
      <svg
        viewBox="0 0 280 400"
        className="w-full h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Headstock body */}
        <path
          d="M100 380 L100 100 Q100 50 140 30 Q180 50 180 100 L180 380"
          fill="#5C3A1E"
          stroke="#3D2510"
          strokeWidth="2"
        />
        {/* Headstock face (lighter wood) */}
        <path
          d="M108 375 L108 105 Q108 60 140 38 Q172 60 172 105 L172 375"
          fill="#7A4E2D"
        />
        {/* Center wood grain lines */}
        <line x1="140" y1="50" x2="140" y2="380" stroke="#6B4226" strokeWidth="0.5" opacity="0.5" />
        <line x1="130" y1="60" x2="130" y2="380" stroke="#6B4226" strokeWidth="0.3" opacity="0.3" />
        <line x1="150" y1="60" x2="150" y2="380" stroke="#6B4226" strokeWidth="0.3" opacity="0.3" />

        {/* Nut (white bar at bottom of headstock) */}
        <rect x="105" y="365" width="70" height="8" rx="2" fill="#F5F0E8" stroke="#D4C9B8" strokeWidth="1" />

        {/* Strings (6 lines from nut upward) */}
        {strings.map((s, i) => {
          const x = 115 + i * 10;
          const thickness = 2.5 - i * 0.3;
          const active = isActive(s);
          return (
            <line
              key={i}
              x1={x}
              y1="60"
              x2={x}
              y2="365"
              stroke={active ? '#22c55e' : '#C0C0C0'}
              strokeWidth={thickness}
              opacity={active ? 1 : 0.6}
            />
          );
        })}

        {/* Tuning machine shafts — left side */}
        {pegYPositions.map((y, i) => (
          <g key={`left-${i}`}>
            {/* Shaft going left */}
            <rect x="70" y={y - 4} width="38" height="8" rx="3" fill="#888" stroke="#666" strokeWidth="1" />
            {/* Machine head (knob) */}
            <ellipse cx="58" cy={y} rx="14" ry="10" fill="#AAA" stroke="#777" strokeWidth="1.5" />
            <ellipse cx="58" cy={y} rx="9" ry="6" fill="#CCC" />
          </g>
        ))}

        {/* Tuning machine shafts — right side */}
        {pegYPositions.map((y, i) => (
          <g key={`right-${i}`}>
            {/* Shaft going right */}
            <rect x="172" y={y - 4} width="38" height="8" rx="3" fill="#888" stroke="#666" strokeWidth="1" />
            {/* Machine head (knob) */}
            <ellipse cx="222" cy={y} rx="14" ry="10" fill="#AAA" stroke="#777" strokeWidth="1.5" />
            <ellipse cx="222" cy={y} rx="9" ry="6" fill="#CCC" />
          </g>
        ))}
      </svg>

      {/* Overlay buttons — left side (E, A, D) */}
      {leftStrings.map((s, i) => {
        const active = isActive(s);
        const topPercent = (pegYPositions[i] / 400) * 100;
        return (
          <div
            key={`left-btn-${i}`}
            className="absolute flex items-center justify-center"
            style={{
              left: '4%',
              top: `${topPercent}%`,
              transform: 'translateY(-50%)',
              width: '15%',
              height: '8%',
            }}
          >
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center
                font-bold text-lg transition-all duration-200 cursor-pointer
                ${active
                  ? 'bg-green-500/20 text-green-400 ring-2 ring-green-400 shadow-lg shadow-green-500/30 scale-110'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 hover:text-white'
                }
              `}
            >
              {s.name}
            </div>
          </div>
        );
      })}

      {/* Overlay buttons — right side (G, B, E) */}
      {rightStrings.map((s, i) => {
        const active = isActive(s);
        const topPercent = (pegYPositions[i] / 400) * 100;
        return (
          <div
            key={`right-btn-${i}`}
            className="absolute flex items-center justify-center"
            style={{
              right: '4%',
              top: `${topPercent}%`,
              transform: 'translateY(-50%)',
              width: '15%',
              height: '8%',
            }}
          >
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center
                font-bold text-lg transition-all duration-200 cursor-pointer
                ${active
                  ? 'bg-green-500/20 text-green-400 ring-2 ring-green-400 shadow-lg shadow-green-500/30 scale-110'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 hover:text-white'
                }
              `}
            >
              {s.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
