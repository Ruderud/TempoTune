'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TabNavigation() {
  const pathname = usePathname();
  const isTuner = pathname.startsWith('/tuner');

  return (
    <nav className="w-full bg-gray-950 pt-4 pb-3 px-4">
      <div className="max-w-md mx-auto relative bg-gray-800/50 rounded-full p-1 backdrop-blur-sm border border-gray-700/50">
        {/* Sliding background indicator */}
        <div
          className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-blue-600 rounded-full transition-all duration-300 ease-out shadow-lg shadow-blue-500/30"
          style={{
            left: isTuner ? 'calc(50% + 0.25rem)' : '0.25rem',
          }}
        />

        {/* Tab links */}
        <div className="relative flex">
          <Link
            href="/metronome"
            className={`flex-1 py-3 px-6 text-center font-medium rounded-full transition-all duration-300 ${
              !isTuner
                ? 'text-white scale-[1.02]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            메트로놈
          </Link>
          <Link
            href="/tuner"
            className={`flex-1 py-3 px-6 text-center font-medium rounded-full transition-all duration-300 ${
              isTuner
                ? 'text-white scale-[1.02]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            튜너
          </Link>
        </div>
      </div>
    </nav>
  );
}
