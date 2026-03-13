'use client';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function ToggleSwitch({ enabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-12 h-6 rounded-full relative transition-all border ${
        enabled ? 'bg-primary border-primary/40' : 'bg-card-strong border-border-subtle'
      }`}
      aria-label="Toggle"
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
          enabled ? 'right-1 bg-background-dark' : 'left-1 bg-surface'
        }`}
      ></div>
    </button>
  );
}
