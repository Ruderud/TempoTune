'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TabNavigation() {
  const pathname = usePathname();
  const isTuner = pathname.startsWith('/tuner');

  return (
    <nav className="w-full bg-gray-950/90 backdrop-blur-lg border-t border-gray-800/60 tab-bar-safe-area">
      <div className="relative flex max-w-md mx-auto">
        {/* Active indicator line */}
        <div
          className="absolute top-0 h-[2px] w-1/2 bg-blue-500 transition-all duration-300 ease-out"
          style={{ left: isTuner ? '50%' : '0%' }}
        />
        <Link
          href="/metronome"
          className={`flex-1 flex items-center justify-center min-h-[48px] text-sm font-semibold transition-colors duration-200 ${
            !isTuner ? 'text-blue-400' : 'text-gray-500 active:text-gray-300'
          }`}
        >
          메트로놈
        </Link>
        <Link
          href="/tuner"
          className={`flex-1 flex items-center justify-center min-h-[48px] text-sm font-semibold transition-colors duration-200 ${
            isTuner ? 'text-blue-400' : 'text-gray-500 active:text-gray-300'
          }`}
        >
          튜너
        </Link>
      </div>
    </nav>
  );
}
