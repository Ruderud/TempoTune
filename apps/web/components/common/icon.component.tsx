import {
  ArrowLeft,
  Clock3,
  Menu,
  Music2,
  Pause,
  Play,
  Settings2,
  SlidersHorizontal,
  Waves,
  type LucideIcon,
} from 'lucide-react';

export type IconName =
  | 'back'
  | 'clock'
  | 'controls'
  | 'menu'
  | 'metronome'
  | 'pause'
  | 'play'
  | 'settings'
  | 'tuner';

const ICONS: Record<IconName, LucideIcon> = {
  back: ArrowLeft,
  clock: Clock3,
  controls: SlidersHorizontal,
  menu: Menu,
  metronome: Music2,
  pause: Pause,
  play: Play,
  settings: Settings2,
  tuner: Waves,
};

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  label?: string;
  strokeWidth?: number;
};

export function Icon({
  name,
  size = 20,
  className,
  label,
  strokeWidth = 2,
}: IconProps) {
  const LucideIcon = ICONS[name];

  return (
    <LucideIcon
      size={size}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      className={['inline-block shrink-0 align-middle', className].filter(Boolean).join(' ')}
    />
  );
}
