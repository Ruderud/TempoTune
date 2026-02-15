'use client';

type PermissionPromptProps = {
  status?: 'undetermined' | 'denied';
  onRequest?: () => void;
};

export function PermissionPrompt({ status = 'undetermined', onRequest }: PermissionPromptProps) {
  const isDenied = status === 'denied';

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-20 h-20 rounded-2xl bg-surface border border-primary/20 flex items-center justify-center mb-6">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-white mb-2">
        {isDenied ? '마이크 접근이 차단됨' : '마이크 권한 필요'}
      </h2>
      <p className="text-sm text-text-muted text-center max-w-sm mb-6 leading-relaxed">
        {isDenied
          ? '튜너를 사용하려면 브라우저 설정에서 마이크 권한을 허용해주세요.'
          : '실시간 음정 분석을 위해 마이크 접근 권한이 필요합니다. 마이크 데이터는 기기 내에서만 처리됩니다.'}
      </p>

      {isDenied ? (
        <div className="text-center space-y-3">
          <p className="text-xs text-text-muted">
            브라우저 주소창 좌측의 자물쇠 아이콘을 클릭하여 마이크 권한을 변경할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 min-h-[44px] rounded-lg bg-surface border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
          >
            새로고침
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onRequest}
          className="px-8 min-h-[48px] rounded-xl bg-primary text-background-dark font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
        >
          마이크 허용
        </button>
      )}
    </div>
  );
}
