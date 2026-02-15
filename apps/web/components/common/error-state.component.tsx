'use client';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = '오류가 발생했습니다',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-16 h-16 rounded-2xl bg-red-900/30 border border-red-700/30 flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-text-muted text-center max-w-sm mb-6 leading-relaxed break-all">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-6 min-h-[44px] rounded-lg bg-surface border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors active:scale-95"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
