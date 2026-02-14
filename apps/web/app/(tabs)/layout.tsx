'use client';

import { TabNavigation } from '../../components/common/tab-navigation.component';

export default function TabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-col h-[100dvh] overflow-hidden bg-gray-950">
      <div className="flex-1 min-h-0">
        {children}
      </div>
      <TabNavigation />
    </main>
  );
}
