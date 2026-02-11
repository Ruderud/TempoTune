'use client';

type CircularGaugeProps = {
  value: number; // -50 ~ +50 cents
  maxValue?: number;
  size?: number;
};

export function CircularGauge({ value, maxValue = 50, size = 200 }: CircularGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = radius * Math.PI;
  const center = size / 2;

  // Normalize value to 0-1 range (left half for negative, right half for positive)
  const normalizedValue = (value + maxValue) / (maxValue * 2);
  const angle = -180 + normalizedValue * 180; // -180deg to 0deg

  // Color based on accuracy
  const getColor = () => {
    const absValue = Math.abs(value);
    if (absValue <= 5) return '#10b981'; // green - accurate
    if (absValue <= 15) return '#eab308'; // yellow - close
    return '#ef4444'; // red - off
  };

  const color = getColor();

  // Calculate arc path
  const startAngle = -180;
  const endAngle = angle;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = center + radius * Math.cos(startRad);
  const y1 = center + radius * Math.sin(startRad);
  const x2 = center + radius * Math.cos(endRad);
  const y2 = center + radius * Math.sin(endRad);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke="#374151"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Center indicator */}
        <line
          x1={center}
          y1={center - radius - 10}
          x2={center}
          y2={center - radius + 5}
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Value text */}
        <text
          x={center}
          y={center - 10}
          textAnchor="middle"
          className="text-4xl font-bold fill-white"
        >
          {value > 0 ? '+' : ''}{value.toFixed(0)}
        </text>
        <text
          x={center}
          y={center + 15}
          textAnchor="middle"
          className="text-sm fill-gray-400"
        >
          cents
        </text>
      </svg>

      {/* Labels */}
      <div className="flex justify-between w-full max-w-[180px] mt-2 text-xs text-gray-500">
        <span>-{maxValue}</span>
        <span>0</span>
        <span>+{maxValue}</span>
      </div>
    </div>
  );
}
