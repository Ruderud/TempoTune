'use client';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function ToggleSwitch({ enabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-12 h-6 rounded-full relative transition-all ${
        enabled ? 'bg-primary' : 'bg-white/20'
      }`}
      aria-label="Toggle"
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
          enabled ? 'right-1 bg-white' : 'left-1 bg-white/60'
        }`}
      ></div>
    </button>
  );
}
