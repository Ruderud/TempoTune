import {
  AudioLines,
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
  | 'rhythm'
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
  rhythm: AudioLines,
  settings: Settings2,
  tuner: Waves,
};

type SharedIconProps = {
  size?: number;
  className?: string;
  label?: string;
  strokeWidth?: number;
};

type IconProps =
  | (SharedIconProps & {
      name: IconName;
      icon?: never;
    })
  | (SharedIconProps & {
      icon: LucideIcon;
      name?: never;
    });

export function Icon({
  name,
  icon,
  size = 20,
  className,
  label,
  strokeWidth = 2,
}: IconProps) {
  const LucideIcon = icon ?? (name ? ICONS[name] : null);

  if (!LucideIcon) {
    return null;
  }

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
