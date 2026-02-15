import Link from 'next/link';
import { APP_NAME, APP_VERSION, COPYRIGHT_YEAR, LEGAL_ENTITY } from '../../constants/app';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background-dark scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(13,242,242,0.3)]">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-background-dark"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {APP_NAME}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#features"
            >
              기능
            </a>
            <button
              type="button"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              가격
            </button>
            <button
              type="button"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              라이브러리
            </button>
            <button
              type="button"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              커뮤니티
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              className="hidden sm:block px-5 sm:px-6 py-2.5 rounded-lg border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/10 transition-all"
            >
              로그인
            </button>
            <Link
              href="/metronome"
              className="px-5 sm:px-6 py-2.5 rounded-lg bg-primary text-background-dark text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-40 pb-16 sm:pb-24 overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(13, 242, 242, 0.15) 0%, rgba(10, 17, 18, 0) 70%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Version {APP_VERSION}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.15] text-white mb-6 sm:mb-8">
              음악의 완벽한 템포, <br />
              <span className="text-primary">{APP_NAME}</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 mb-8 sm:mb-10 leading-relaxed max-w-xl">
              전문 연주자와 작곡가를 위한 고정밀 튜닝 엔진과 스마트 메트로놈.
              소수점 단위의 정밀함으로 당신의 연주를 완벽하게 서포트합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/metronome"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-background-dark rounded-xl font-bold text-base sm:text-lg hover:brightness-110 transition-all group"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
                </svg>
                앱 다운로드
              </Link>
              <Link
                href="/metronome"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-white/10 transition-all border border-white/10"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
                </svg>
                웹에서 시작
              </Link>
            </div>
            <div className="mt-8 sm:mt-12 flex items-center gap-6 sm:gap-8 grayscale opacity-50">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span className="text-xs font-medium">App Store</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
                <span className="text-xs font-medium">Google Play</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
                </svg>
                <span className="text-xs font-medium">macOS / Win</span>
              </div>
            </div>
          </div>
          <div className="relative hidden sm:block">
            <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-surface to-background-dark flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-24 h-24 mx-auto text-primary/50 mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
                  </svg>
                  <div className="text-primary text-sm font-bold tracking-widest uppercase mb-2">
                    Live Pitch Analysis
                  </div>
                  <div className="text-slate-400 text-xs">440.0 Hz</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-6 rounded-xl glass-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-primary tracking-widest uppercase">
                    Live Pitch Analysis
                  </span>
                  <span className="text-xs text-slate-400">440.0 Hz</span>
                </div>
                <div className="h-12 flex items-end gap-1">
                  <div className="flex-1 bg-primary/20 h-4 rounded-t-sm" />
                  <div className="flex-1 bg-primary/40 h-8 rounded-t-sm" />
                  <div className="flex-1 bg-primary/60 h-12 rounded-t-sm" />
                  <div className="flex-1 bg-primary h-10 rounded-t-sm" />
                  <div className="flex-1 bg-primary/80 h-6 rounded-t-sm" />
                  <div className="flex-1 bg-primary/50 h-9 rounded-t-sm" />
                  <div className="flex-1 bg-primary/30 h-5 rounded-t-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Icons Section */}
      <section className="py-8 sm:py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 lg:gap-24">
            <div className="flex items-center gap-3 text-slate-400">
              <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
              </svg>
              <span className="font-medium tracking-tight text-sm">iOS Mobile</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.28-.55-.37-.84-.22-.3.16-.42.54-.26.85l1.84 3.18C4.8 10.85 3.5 12.62 3 14.5h18c-.5-1.88-1.8-3.65-3.4-5.02z" />
              </svg>
              <span className="font-medium tracking-tight text-sm">Android App</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
              </svg>
              <span className="font-medium tracking-tight text-sm">Windows Native</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-slate-400">
              <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
              </svg>
              <span className="font-medium tracking-tight text-sm">macOS Silicon</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-slate-400">
              <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
              </svg>
              <span className="font-medium tracking-tight text-sm">Cloud Web</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-4">
              핵심 기능
            </h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              프로를 위한 완벽한 도구
            </h3>
            <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              {APP_NAME}은 단순한 도구를 넘어 연주자의 감각을 극대화하는
              파트너입니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="p-8 sm:p-10 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 sm:mb-8 group-hover:bg-primary transition-colors">
                <svg
                  className="w-8 h-8 text-primary group-hover:text-background-dark"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11 5v5.59H7.5l4.5 4.5 4.5-4.5H13V5h-2zm-5 9c0 3.53 2.61 6.43 6 6.92V21h2v-.08c3.39-.49 6-3.39 6-6.92h-2c0 2.76-2.24 5-5 5s-5-2.24-5-5H6z" />
                </svg>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">정밀 튜너</h4>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                0.1센트 단위의 초정밀 피치 분석 엔진을 탑재했습니다. 어떤
                환경에서도 빠르고 정확한 튜닝이 가능합니다.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="p-8 sm:p-10 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 sm:mb-8 group-hover:bg-primary transition-colors">
                <svg
                  className="w-8 h-8 text-primary group-hover:text-background-dark"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                </svg>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                프로 메트로놈
              </h4>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                단순 비트를 넘어 복합 박자와 리듬 시각화 기능을 제공합니다.
                곡의 감정적 템포를 완벽하게 제어하세요.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="p-8 sm:p-10 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 sm:mb-8 group-hover:bg-primary transition-colors">
                <svg
                  className="w-8 h-8 text-primary group-hover:text-background-dark"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                하이브리드 앱
              </h4>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                모바일에서 연습하던 세팅 그대로 데스크톱에서 이어가세요.
                클라우드 동기화로 어디서든 음악에 집중할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[280px] sm:aspect-[21/9] flex items-center bg-gradient-to-br from-surface to-background-dark border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-background-dark/80 via-background-dark/40 to-transparent" />
            <div className="relative z-10 px-8 sm:px-12 md:px-24 py-10 sm:py-0">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                당신의 소리를
                <br />더 선명하게.
              </h2>
              <p className="text-base sm:text-lg text-slate-300 max-w-md mb-6 sm:mb-8">
                전 세계 100만 명 이상의 뮤지션이 선택한 {APP_NAME}과 함께
                최상의 퍼포먼스를 완성하세요.
              </p>
              <Link
                href="/metronome"
                className="inline-block px-8 py-3 bg-primary text-background-dark rounded-lg font-bold hover:scale-105 transition-transform"
              >
                무료로 시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-dark border-t border-white/5 pt-12 sm:pt-20 pb-8 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-12 mb-12 sm:mb-20">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-background-dark"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">{APP_NAME}</span>
              </div>
              <p className="text-slate-500 max-w-xs leading-relaxed text-sm">
                우리는 기술을 통해 음악적 정밀함을 재정의합니다. 모든 뮤지션이
                완벽한 템포를 찾을 수 있도록 끊임없이 혁신합니다.
              </p>
            </div>
            <div>
              <h5 className="text-white font-bold mb-4 sm:mb-6 text-sm">제품</h5>
              <ul className="space-y-3 sm:space-y-4 text-slate-500 text-sm">
                <li>
                  <a className="hover:text-primary transition-colors" href="#features">
                    주요 기능
                  </a>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="/tuner">
                    튜너 엔진
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="/metronome">
                    메트로놈 설정
                  </Link>
                </li>
                <li>
                  <button type="button" className="hover:text-primary transition-colors">
                    업데이트 소식
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold mb-4 sm:mb-6 text-sm">지원</h5>
              <ul className="space-y-3 sm:space-y-4 text-slate-500 text-sm">
                <li>
                  <button type="button" className="hover:text-primary transition-colors">
                    고객 센터
                  </button>
                </li>
                <li>
                  <button type="button" className="hover:text-primary transition-colors">
                    이용 약관
                  </button>
                </li>
                <li>
                  <button type="button" className="hover:text-primary transition-colors">
                    개인정보 처리방침
                  </button>
                </li>
                <li>
                  <button type="button" className="hover:text-primary transition-colors">
                    자주 묻는 질문
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold mb-4 sm:mb-6 text-sm">소셜</h5>
              <div className="flex gap-3 sm:gap-4">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 sm:pt-10 border-t border-white/5 text-slate-600 text-sm gap-4">
            <p>&copy; {COPYRIGHT_YEAR} {LEGAL_ENTITY}. All rights reserved.</p>
            <div className="flex gap-6 sm:gap-8 items-center">
              <span className="flex items-center gap-1 text-xs">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
                </svg>
                한국어 (KR)
              </span>
              <button type="button" className="hover:text-white text-xs transition-colors">
                Status
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
