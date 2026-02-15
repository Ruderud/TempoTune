'use client';

import { useState } from 'react';
import { ToggleSwitch } from '../../../components/settings/toggle-switch.component';
import { APP_NAME, APP_VERSION, COPYRIGHT_YEAR, LEGAL_ENTITY } from '../../../constants/app';

type Sensitivity = 'stable' | 'balanced' | 'fast';

export default function SettingsPage() {
  const [a4Frequency, setA4Frequency] = useState(440);
  const [sensitivity, setSensitivity] = useState<Sensitivity>('balanced');
  const [noiseGate, setNoiseGate] = useState(33);
  const [signalGain, setSignalGain] = useState(60);
  const [visualFlash, setVisualFlash] = useState(true);
  const [backgroundPlay, setBackgroundPlay] = useState(false);

  const adjustFrequency = (delta: number) => {
    setA4Frequency(prev => Math.max(400, Math.min(480, prev + delta)));
  };

  return (
    <div className="h-full overflow-y-auto pb-4 lg:flex lg:overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-primary/10 bg-background-dark/40 backdrop-blur-md shrink-0">
        <div className="p-6 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-primary">환경 설정</h2>
            <span className="text-xs text-primary/40 bg-primary/10 px-2 py-0.5 rounded-full">SYSTEM</span>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary border border-primary/20 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            <span className="font-medium text-sm">일반</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary/60 hover:text-primary hover:bg-white/5 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="9" width="3" height="6" rx="1" />
              <rect x="8" y="5" width="3" height="14" rx="1" />
              <rect x="13" y="7" width="3" height="10" rx="1" />
              <rect x="18" y="10" width="3" height="4" rx="1" />
            </svg>
            <span className="font-medium text-sm">튜너</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary/60 hover:text-primary hover:bg-white/5 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 22h12L14 4h-4L6 22z" />
              <path d="M12 14l4-6" />
            </svg>
            <span className="font-medium text-sm">메트로놈</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary/60 hover:text-primary hover:bg-white/5 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M9 9h6M9 15h6" />
            </svg>
            <span className="font-medium text-sm">단축키</span>
          </button>

          {/* Desktop: User badge at bottom */}
          <div className="!mt-8 glass-card rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Premium User</span>
              <span className="text-xs text-primary/60">PRO LICENSE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto lg:px-0">
        <div className="px-5 lg:px-10 pt-4 lg:pt-8 space-y-4 lg:space-y-6 lg:max-w-4xl">
          {/* Mobile header */}
          <div className="flex items-center gap-3 lg:hidden">
            <button type="button" onClick={() => window.history.back()} className="w-8 h-8 rounded-lg bg-surface border border-primary/10 flex items-center justify-center text-primary/60">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">설정</h1>
          </div>

          {/* A4 Reference Frequency */}
          <section>
            <h2 className="px-1 mb-1 text-xs font-semibold uppercase tracking-widest text-primary/60">
              A4 기준 주파수
            </h2>
            <p className="px-1 mb-3 text-xs text-text-muted hidden lg:block">
              표준 피치를 설정하여 튜너의 기준점을 조정합니다.
            </p>
            <div className="glass-card rounded-xl p-3 flex flex-col items-center">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => adjustFrequency(-1)}
                  className="w-11 h-11 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center hover:bg-primary/30 active:scale-95 transition-all"
                  aria-label="Decrease frequency"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <div className="text-center">
                  <span className="text-5xl font-bold text-white tabular-nums">{a4Frequency}</span>
                  <span className="text-primary font-medium ml-1">Hz</span>
                </div>
                <button
                  onClick={() => adjustFrequency(1)}
                  className="w-11 h-11 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center hover:bg-primary/30 active:scale-95 transition-all"
                  aria-label="Increase frequency"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          {/* Tuner Sensitivity */}
          <section>
            <h2 className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/60">
              튜너 민감도
            </h2>
            <div className="glass-card p-1 rounded-xl flex">
              {(['stable', 'balanced', 'fast'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSensitivity(preset)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    sensitivity === preset
                      ? 'bg-primary text-background-dark font-bold shadow-[0_0_15px_rgba(13,242,242,0.3)]'
                      : 'text-slate-400'
                  }`}
                >
                  {preset === 'stable' ? '안정형' : preset === 'balanced' ? '균형형' : '빠른응답'}
                </button>
              ))}
            </div>
          </section>

          {/* Advanced Detection Settings */}
          <section>
            <h2 className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/60">
              고급 감지 설정
            </h2>
            <div className="glass-card rounded-xl divide-y divide-white/5">
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">노이즈 게이트</span>
                  <span className="text-xs font-bold text-primary">-{Math.round(60 - noiseGate * 0.6)}dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={noiseGate}
                  onChange={(e) => setNoiseGate(parseInt(e.target.value))}
                  className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer slider"
                />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">신호 게인</span>
                  <span className="text-xs font-bold text-primary">+{(signalGain * 0.24).toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={signalGain}
                  onChange={(e) => setSignalGain(parseInt(e.target.value))}
                  className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </section>

          {/* Metronome Options */}
          <section>
            <h2 className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/60">
              메트로놈 옵션
            </h2>
            <div className="glass-card rounded-xl divide-y divide-white/5">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span className="text-sm font-medium">시각적 플래시</span>
                </div>
                <ToggleSwitch enabled={visualFlash} onChange={setVisualFlash} />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                  <span className="text-sm font-medium">백그라운드 재생</span>
                </div>
                <ToggleSwitch enabled={backgroundPlay} onChange={setBackgroundPlay} />
              </div>
            </div>
          </section>

          {/* Desktop: Keyboard Shortcuts */}
          <section className="hidden lg:block">
            <h2 className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/60">
              키보드 단축키
            </h2>
            <div className="glass-card rounded-xl divide-y divide-white/5">
              {[
                { action: '재생 / 일시정지', key: 'Space' },
                { action: '템포 직접 입력 (Tap)', key: 'T' },
                { action: 'A4 주파수 리셋', key: 'Ctrl + R' },
              ].map((shortcut) => (
                <div key={shortcut.action} className="flex items-center justify-between p-4">
                  <span className="text-sm text-text-secondary">{shortcut.action}</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-primary/10 text-xs text-primary font-mono">{shortcut.key}</kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Visuals & Theme */}
          <section>
            <h2 className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/60">
              가독성 및 테마
            </h2>
            <div className="glass-card rounded-xl divide-y divide-white/5">
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span className="text-sm font-medium">다크 모드</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">항상 켬</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                  <span className="text-sm font-medium">텍스트 크기</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">표준</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            </div>
          </section>

          {/* About Block */}
          <section className="pt-2 pb-6">
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/40 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-background-dark">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base">{APP_NAME} Pro</h3>
                  <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    PREMIUM
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">버전 v{APP_VERSION}</p>
              </div>
            </div>
            <div className="mt-4 text-center space-y-1">
              <p className="text-xs text-slate-600 font-medium">Developed by {LEGAL_ENTITY}</p>
              <div className="flex justify-center gap-4 text-xs text-primary/60 uppercase tracking-tighter">
                <button type="button" className="hover:text-primary transition-colors">이용약관</button>
                <span className="w-1 h-1 bg-slate-700 rounded-full my-auto" />
                <button type="button" className="hover:text-primary transition-colors">개인정보처리방침</button>
                <span className="w-1 h-1 bg-slate-700 rounded-full my-auto" />
                <button type="button" className="hover:text-primary transition-colors">라이선스</button>
              </div>
            </div>
          </section>

          {/* Background Decorative Gradient */}
          <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[80px]" />
          </div>
        </div>
      </div>

      {/* Desktop: Right utility panel */}
      <aside className="hidden xl:block w-72 border-l border-primary/10 bg-background-dark/40 backdrop-blur-md p-5 overflow-y-auto shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-4">유틸리티 및 분석</h3>

        {/* Data management */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs text-text-muted font-semibold">데이터 관리</h4>
          <button type="button" className="w-full min-h-[44px] rounded-lg bg-surface border border-primary/10 text-sm text-text-secondary hover:bg-primary/10 transition-colors">
            데이터 가져오기
          </button>
          <button type="button" className="w-full min-h-[44px] rounded-lg bg-surface border border-primary/10 text-sm text-text-secondary hover:bg-primary/10 transition-colors">
            데이터 내보내기
          </button>
          <button type="button" className="w-full min-h-[44px] rounded-lg bg-red-900/20 border border-red-700/20 text-sm text-red-400 hover:bg-red-900/30 transition-colors">
            설정 초기화
          </button>
        </div>

        {/* System info card */}
        <div className="glass-card rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            시스템 정보
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">앱 버전</span>
              <span className="text-text-secondary">v{APP_VERSION}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">연결 상태</span>
              <span className="text-primary">● Operational</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">CPU 사용량</span>
              <span className="text-text-secondary">0.3%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-text-muted">&copy; {COPYRIGHT_YEAR} {LEGAL_ENTITY}</p>
        </div>
      </aside>
    </div>
  );
}
