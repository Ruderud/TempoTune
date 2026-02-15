'use client';

import { APP_NAME, APP_VERSION } from '../../constants/app';

interface LoadingScreenProps {
  status?: string;
  progress?: number;
  subStatus?: string;
}

export function LoadingScreen({
  status = '오디오 엔진 초기화 중...',
  progress = 66,
  subStatus = '마이크 연결 확인 중...'
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-background-dark overflow-hidden flex flex-col">
      {/* Desktop: Corner decorations */}
      <div className="hidden lg:block absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-primary/20 rounded-tl-lg" />
      <div className="hidden lg:block absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-primary/20 rounded-tr-lg" />
      <div className="hidden lg:block absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-primary/20 rounded-bl-lg" />
      <div className="hidden lg:block absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-primary/20 rounded-br-lg" />

      {/* Background Skeleton Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col items-center justify-center p-8 space-y-12">
        <div className="w-64 h-64 rounded-full border-4 border-neutral-dark flex items-center justify-center relative">
          <div className="absolute inset-4 rounded-full border border-neutral-dark/50" />
          <div className="w-1 h-32 bg-neutral-dark rounded-full origin-bottom -translate-y-16 rotate-45" />
        </div>
        <div className="w-full max-w-3xl h-32 flex items-end justify-between space-x-1">
          <div className="flex-1 bg-neutral-dark rounded-t h-12" />
          <div className="flex-1 bg-neutral-dark rounded-t h-20" />
          <div className="flex-1 bg-neutral-dark rounded-t h-32" />
          <div className="flex-1 bg-neutral-dark rounded-t h-24" />
          <div className="flex-1 bg-neutral-dark rounded-t h-16" />
          <div className="flex-1 bg-neutral-dark rounded-t h-28" />
          <div className="flex-1 bg-neutral-dark rounded-t h-14" />
          <div className="flex-1 bg-neutral-dark rounded-t h-8" />
          <div className="flex-1 bg-neutral-dark rounded-t h-20" />
          <div className="flex-1 bg-neutral-dark rounded-t h-32" />
          <div className="flex-1 bg-neutral-dark rounded-t h-24" />
          <div className="flex-1 bg-neutral-dark rounded-t h-12" />
        </div>
      </div>

      {/* Top Status Bar */}
      <div className="relative z-10 flex justify-between items-center w-full px-6 pt-8 pb-4">
        <div className="text-xs tracking-widest text-primary uppercase font-bold">
          {/* Mobile: simple label, Desktop: "INITIALIZING ENGINE" */}
          <span className="lg:hidden">엔진 초기화</span>
          <span className="hidden lg:inline">INITIALIZING ENGINE</span>
        </div>
        <div className="text-xs tracking-widest text-primary/60 uppercase font-medium">
          v{APP_VERSION}
        </div>
      </div>

      {/* Main Loading Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-grow space-y-8 px-6">
        {/* Logo */}
        <div className="relative flex flex-col items-center">
          <div className="w-20 h-20 rounded-xl bg-background-dark border-2 border-primary flex items-center justify-center glow-primary mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="8" x2="16" y2="8" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="8" y1="16" x2="12" y2="16" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-white glow-text">
            {APP_NAME.slice(0, 5)}<span className="text-primary">{APP_NAME.slice(5)}</span>
          </h1>
          {/* Desktop subtitle */}
          <span className="hidden lg:block text-xs tracking-[0.3em] text-text-muted uppercase mt-2">
            PROFESSIONAL AUDIO SUITE
          </span>
        </div>

        {/* Progress and Status */}
        <div className="w-full max-w-[280px] space-y-4">
          <div className="w-full h-1 bg-neutral-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-primary glow-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-col items-center space-y-1">
            <p className="text-sm font-medium text-white/90">{status}</p>
            <p className="text-xs text-primary/60">{subStatus}</p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="relative z-10 flex justify-between items-center w-full px-6 pt-4 pb-8 border-t border-neutral-dark/30">
        <button type="button" className="text-sm text-neutral-dark hover:text-primary transition-colors flex items-center space-x-2 py-2 px-4 rounded-lg bg-neutral-dark/50 min-h-[44px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>재시도</span>
        </button>
        <div className="flex space-x-6">
          <button type="button" className="text-sm text-neutral-dark hover:text-white transition-colors py-2 min-h-[44px]">
            도움말
          </button>
        </div>
      </div>
    </div>
  );
}
