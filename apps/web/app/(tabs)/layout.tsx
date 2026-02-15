'use client';

import { TabNavigation } from '../../components/common/tab-navigation.component';
import { APP_VERSION, COPYRIGHT_YEAR, LEGAL_ENTITY } from '../../constants/app';

export default function TabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-col h-[100dvh] overflow-hidden bg-background-dark">
      <TabNavigation />
      <div className="flex-1 min-h-0 lg:grid-bg">
        {children}
      </div>

      {/* Desktop: Glass Footer Status Bar */}
      <footer className="hidden lg:flex glass-footer h-8 items-center justify-between px-6 text-xs text-text-muted tabular-nums shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-primary/40">● 시스템 정상</span>
          <span>샘플레이트: 48kHz / 24bit</span>
        </div>
        <div className="flex items-center gap-4">
          <span>v{APP_VERSION}</span>
          <span>&copy; {COPYRIGHT_YEAR} {LEGAL_ENTITY}</span>
        </div>
      </footer>
    </main>
  );
}
