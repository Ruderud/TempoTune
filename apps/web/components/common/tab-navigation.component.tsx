'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon.component';

const tabs = [
  {
    href: '/metronome',
    label: '메트로놈',
    iconSrc: '/assets/icons/metronome.svg',
    match: (p: string) => p.startsWith('/metronome') || p === '/',
  },
  {
    href: '/tuner',
    label: '튜너',
    iconSrc: '/assets/icons/tuner.svg',
    match: (p: string) => p.startsWith('/tuner'),
  },
  {
    href: '/settings',
    label: '설정',
    iconSrc: '/assets/icons/settings.svg',
    match: (p: string) => p.startsWith('/settings'),
  },
] as const;

export function TabNavigation() {
  const pathname = usePathname();
  const settingsTab = tabs[2];
  const navTabs = tabs.slice(0, 2);

  return (
    <>
      {/* Mobile: Bottom Tab Bar */}
      <nav className="order-last glass-nav tab-bar-safe-area lg:hidden">
        <div className="flex justify-around max-w-md mx-auto px-4 pt-2 pb-2">
          {tabs.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 min-h-[48px] min-w-[64px] transition-colors duration-200 ${
                  active
                    ? 'text-primary'
                    : 'text-primary/40 active:text-primary/60'
                }`}
              >
                <Icon src={tab.iconSrc} size={20} className={active ? 'glow-text' : ''} label={tab.label} />
                <span className="text-xs font-semibold">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: Top Header Bar */}
      <header className="hidden lg:block h-14 border-b border-primary/10 glass-nav">
        <div className="h-full max-w-[1800px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(13,242,242,0.3)]">
                <Icon src="/assets/icons/metronome.svg" size={20} className="text-background-dark" label="TempoTune" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-primary">TempoTune</h1>
            </div>
            <div className="h-5 w-px bg-primary/20" />
            <nav className="flex items-center gap-1">
              {navTabs.map((tab) => {
                const active = tab.match(pathname);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all text-sm font-medium ${
                      active
                        ? 'text-primary bg-primary/10 border border-primary/20'
                        : 'text-primary/60 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Icon src={tab.iconSrc} size={20} className={active ? 'glow-text' : ''} label={tab.label} />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={settingsTab.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${
                settingsTab.match(pathname)
                  ? 'text-primary bg-primary/10'
                  : 'text-primary/40 hover:text-primary hover:bg-primary/5'
              }`}
            >
              <Icon src={settingsTab.iconSrc} size={18} label="설정" />
              <span>{settingsTab.label}</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
