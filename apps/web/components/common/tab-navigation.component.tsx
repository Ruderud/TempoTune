'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  {
    href: '/metronome',
    label: '메트로놈',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22h12L14 4h-4L6 22z" />
        <path d="M12 14l4-6" />
      </svg>
    ),
    match: (p: string) => p.startsWith('/metronome') || p === '/',
  },
  {
    href: '/tuner',
    label: '튜너',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="9" width="3" height="6" rx="1" />
        <rect x="8" y="5" width="3" height="14" rx="1" />
        <rect x="13" y="7" width="3" height="10" rx="1" />
        <rect x="18" y="10" width="3" height="4" rx="1" />
      </svg>
    ),
    match: (p: string) => p.startsWith('/tuner'),
  },
  {
    href: '/settings',
    label: '설정',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
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
                <span className={active ? 'glow-text' : ''}>{tab.icon}</span>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-background-dark">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
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
                    <span className={active ? 'glow-text' : ''}>{tab.icon}</span>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
              <span>{settingsTab.label}</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
