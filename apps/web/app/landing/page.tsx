import Link from 'next/link';
import {
  Cloud,
  Clock3,
  Download,
  Facebook,
  Globe,
  Instagram,
  Laptop,
  Languages,
  Monitor,
  Music2,
  Smartphone,
  TabletSmartphone,
  Waves,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import { Icon } from '../../components/common/icon.component';
import { APP_NAME, APP_VERSION, COPYRIGHT_YEAR, LEGAL_ENTITY } from '../../constants/app';

const platformBadges: Array<{ label: string; icon: LucideIcon; hiddenOnMobile?: boolean }> = [
  { label: 'iOS Mobile', icon: Smartphone },
  { label: 'Android App', icon: TabletSmartphone },
  { label: 'Windows Native', icon: Monitor },
  { label: 'macOS Silicon', icon: Laptop, hiddenOnMobile: true },
  { label: 'Cloud Web', icon: Globe, hiddenOnMobile: true },
];

const featureCards: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: '정밀 튜너',
    description:
      '0.1센트 단위의 초정밀 피치 분석 엔진을 탑재했습니다. 어떤 환경에서도 빠르고 정확한 튜닝이 가능합니다.',
    icon: Waves,
  },
  {
    title: '프로 메트로놈',
    description:
      '단순 비트를 넘어 복합 박자와 리듬 시각화 기능을 제공합니다. 곡의 감정적 템포를 완벽하게 제어하세요.',
    icon: Clock3,
  },
  {
    title: '하이브리드 앱',
    description:
      '모바일에서 연습하던 세팅 그대로 데스크톱에서 이어가세요. 클라우드 동기화로 어디서든 음악에 집중할 수 있습니다.',
    icon: Cloud,
  },
];

const socialLinks: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Facebook', icon: Facebook },
  { label: 'Instagram', icon: Instagram },
  { label: 'YouTube', icon: Youtube },
];

export default function LandingPage() {
  return (
    <div className="h-screen overflow-x-hidden overflow-y-auto bg-background-dark scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center glow-primary">
              <Icon icon={Music2} size={22} className="text-background-dark sm:h-6 sm:w-6" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-text-strong">
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
              'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--color-primary) 15%, transparent) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Studio Release {APP_VERSION}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.15] text-text-strong mb-6 sm:mb-8">
              음악의 완벽한 템포, <br />
              <span>{APP_NAME}</span>
            </h1>
            <div className="mb-6 h-px w-24 bg-primary/50" />
            <p className="text-lg sm:text-xl text-text-secondary mb-8 sm:mb-10 leading-relaxed max-w-xl">
              전문 연주자와 작곡가를 위한 고정밀 튜닝 엔진과 스마트 메트로놈.
              소수점 단위의 정밀함으로 당신의 연주를 완벽하게 서포트합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/metronome"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-background-dark rounded-xl font-bold text-base sm:text-lg hover:brightness-110 transition-all group"
              >
                <Icon icon={Download} size={22} className="text-background-dark" />
                앱 다운로드
              </Link>
              <Link
                href="/metronome"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-card-soft text-text-strong rounded-xl font-bold text-base sm:text-lg hover:bg-card-strong transition-all border border-border-subtle"
              >
                <Icon icon={Globe} size={22} className="text-text-strong" />
                웹에서 시작
              </Link>
            </div>
            <div className="mt-8 sm:mt-12 flex items-center gap-6 sm:gap-8 text-text-secondary/70">
              <div className="flex items-center gap-2">
                <Icon icon={Smartphone} size={20} className="sm:h-6 sm:w-6" />
                <span className="text-xs font-medium">App Store</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon={TabletSmartphone} size={20} className="sm:h-6 sm:w-6" />
                <span className="text-xs font-medium">Google Play</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon={Monitor} size={20} className="sm:h-6 sm:w-6" />
                <span className="text-xs font-medium">macOS / Win</span>
              </div>
            </div>
          </div>
          <div className="relative hidden sm:block">
            <div className="absolute -inset-10 bg-primary/12 blur-[100px] rounded-full" />
            <div className="relative rounded-2xl overflow-hidden border border-border-subtle shadow-2xl">
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-surface via-card-soft to-background-dark flex items-center justify-center">
                <div className="text-center">
                  <Icon icon={Waves} size={96} strokeWidth={1.75} className="mx-auto mb-4 text-primary/50" />
                  <div className="text-primary text-sm font-bold tracking-widest uppercase mb-2">
                    Live Pitch Analysis
                  </div>
                  <div className="text-text-secondary text-xs">440.0 Hz</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-6 rounded-xl glass-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-primary tracking-widest uppercase">
                    Live Pitch Analysis
                  </span>
                  <span className="text-xs text-text-secondary">440.0 Hz</span>
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
      <section className="py-8 sm:py-12 border-y border-border-subtle bg-card-soft/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 lg:gap-24">
            {platformBadges.map((badge) => (
              <div
                key={badge.label}
                className={`flex items-center gap-3 text-text-secondary ${badge.hiddenOnMobile ? 'hidden sm:flex' : ''}`}
              >
                <Icon icon={badge.icon} size={28} className="sm:h-8 sm:w-8" />
                <span className="font-medium tracking-tight text-sm">{badge.label}</span>
              </div>
            ))}
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
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-strong mb-4 sm:mb-6">
              프로를 위한 완벽한 도구
            </h3>
            <p className="text-text-secondary max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              {APP_NAME}은 단순한 도구를 넘어 연주자의 감각을 극대화하는
              파트너입니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="p-8 sm:p-10 rounded-2xl bg-card-soft border border-border-subtle hover:border-primary/35 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 sm:mb-8 group-hover:bg-primary transition-colors">
                  <Icon
                    icon={feature.icon}
                    size={30}
                    className="text-primary group-hover:text-background-dark"
                  />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-text-strong mb-3 sm:mb-4">
                  {feature.title}
                </h4>
                <p className="text-text-secondary leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[280px] sm:aspect-[21/9] flex items-center bg-gradient-to-br from-surface to-background-dark border border-border-subtle">
            <div className="absolute inset-0 bg-gradient-to-r from-background-dark/80 via-background-dark/40 to-transparent" />
            <div className="relative z-10 px-8 sm:px-12 md:px-24 py-10 sm:py-0">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-strong mb-4 sm:mb-6">
                당신의 소리를
                <br />더 선명하게.
              </h2>
              <p className="text-base sm:text-lg text-text-secondary max-w-md mb-6 sm:mb-8">
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
      <footer className="bg-background-dark border-t border-border-subtle pt-12 sm:pt-20 pb-8 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-12 mb-12 sm:mb-20">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                  <Icon icon={Music2} size={20} className="text-background-dark" />
                </div>
                <span className="text-xl font-bold text-text-strong">{APP_NAME}</span>
              </div>
              <p className="text-text-muted max-w-xs leading-relaxed text-sm">
                우리는 기술을 통해 음악적 정밀함을 재정의합니다. 모든 뮤지션이
                완벽한 템포를 찾을 수 있도록 끊임없이 혁신합니다.
              </p>
            </div>
            <div>
              <h5 className="text-text-strong font-bold mb-4 sm:mb-6 text-sm">제품</h5>
              <ul className="space-y-3 sm:space-y-4 text-text-muted text-sm">
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
              <h5 className="text-text-strong font-bold mb-4 sm:mb-6 text-sm">지원</h5>
              <ul className="space-y-3 sm:space-y-4 text-text-muted text-sm">
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
              <h5 className="text-text-strong font-bold mb-4 sm:mb-6 text-sm">소셜</h5>
              <div className="flex gap-3 sm:gap-4">
                {socialLinks.map((social) => (
                  <button
                    key={social.label}
                    type="button"
                    className="w-10 h-10 rounded-full bg-card-soft border border-border-subtle flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all"
                    aria-label={social.label}
                  >
                    <Icon icon={social.icon} size={18} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 sm:pt-10 border-t border-border-subtle text-text-muted text-sm gap-4">
            <p>&copy; {COPYRIGHT_YEAR} {LEGAL_ENTITY}. All rights reserved.</p>
            <div className="flex gap-6 sm:gap-8 items-center">
              <span className="flex items-center gap-1 text-xs">
                <Icon icon={Languages} size={14} />
                한국어 (KR)
              </span>
              <button type="button" className="hover:text-text-strong text-xs transition-colors">
                Status
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
