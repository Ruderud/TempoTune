'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Monitor, MoonStar, SunMedium } from 'lucide-react';
import { useThemePreference } from '../../hooks/use-theme-preference';
import type { ThemePreference } from '../../lib/theme';
import { Icon } from './icon.component';

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Monitor;
}> = [
  { value: 'system', label: '시스템 설정', icon: Monitor },
  { value: 'light', label: '라이트 모드', icon: SunMedium },
  { value: 'dark', label: '다크 모드', icon: MoonStar },
];

function getThemeTriggerIcon(preference: ThemePreference) {
  if (preference === 'light') return SunMedium;
  if (preference === 'dark') return MoonStar;
  return Monitor;
}

export function ThemeModeMenu() {
  const { preference, setPreference } = useThemePreference();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const TriggerIcon = getThemeTriggerIcon(preference);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="테마 선택"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-testid="theme-menu-trigger"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-card-soft text-primary/80 transition-colors hover:border-primary/30 hover:text-primary"
      >
        <Icon icon={TriggerIcon} size={18} label="테마 선택" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="테마 모드"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-40 min-w-[176px] rounded-2xl border border-border-subtle bg-overlay/95 p-1.5 shadow-2xl shadow-background-dark/30 backdrop-blur-xl"
        >
          {THEME_OPTIONS.map((option) => {
            const isActive = option.value === preference;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                data-testid={`theme-option-${option.value}`}
                onClick={() => {
                  setPreference(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/12 text-primary'
                    : 'text-text-primary hover:bg-card-soft'
                }`}
              >
                <Icon icon={option.icon} size={16} className={isActive ? 'text-primary' : 'text-text-muted'} />
                <span className="flex-1">{option.label}</span>
                {isActive ? <Icon icon={Check} size={15} className="text-primary" /> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
