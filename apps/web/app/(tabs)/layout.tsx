'use client';

import { TabNavigation } from '../../components/common/tab-navigation.component';

export default function TabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-col h-screen overflow-hidden bg-gray-950">
      <TabNavigation />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </main>
  );
}
