import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  AudioLines,
  Check,
  Clock3,
  Gauge,
  Play,
  SlidersHorizontal,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { Icon } from '../common/icon.component';
import { ThemeModeMenu } from '../common/theme-mode-menu.component';
import { APP_NAME, COPYRIGHT_YEAR, LEGAL_ENTITY } from '../../constants/app';
import styles from './landing-page.module.css';

const proofPoints = [
  { value: '6시간', label: '메트로놈 누적 오차 회귀', detail: '< 0.001 ms' },
  {
    value: '35–1400 Hz',
    label: '튜너 기본 분석 범위',
    detail: '저음부터 고음까지',
  },
  { value: '±5 cents', label: '화면의 인 튠 기준', detail: '자동 회귀 계약' },
];

const tools: Array<{
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  eyebrow: string;
}> = [
  {
    title: '메트로놈',
    description: '30–300 BPM, 박자표와 강박을 조절하고 탭으로 템포를 찾습니다.',
    href: '/metronome',
    icon: Timer,
    eyebrow: 'TEMPO',
  },
  {
    title: '튜너',
    description:
      '마이크 입력을 분석해 음명, 옥타브, cents 편차를 실시간으로 표시합니다.',
    href: '/tuner',
    icon: AudioLines,
    eyebrow: 'PITCH',
  },
  {
    title: '리듬 연습',
    description:
      '연주한 박을 메트로놈과 비교해 빠름, 정확, 늦음으로 나눠 보여줍니다.',
    href: '/rhythm',
    icon: Activity,
    eyebrow: 'RHYTHM',
  },
  {
    title: '설정',
    description: '시스템, 라이트, 다크 테마를 선택하고 연습 환경을 정리합니다.',
    href: '/settings',
    icon: SlidersHorizontal,
    eyebrow: 'SETUP',
  },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={styles.brand}>
      <Image
        src="/icon-192.png"
        alt=""
        width={compact ? 34 : 40}
        height={compact ? 34 : 40}
        className={styles.brandIcon}
        priority={!compact}
      />
      <span className={compact ? styles.brandNameCompact : styles.brandName}>
        {APP_NAME}
      </span>
    </span>
  );
}

function ProductPreview() {
  return (
    <div
      className={styles.previewShell}
      aria-label="TempoTune 제품 화면 미리보기"
    >
      <div className={styles.previewTopbar}>
        <span className={styles.previewBrand}>
          <span className={styles.liveDot} />
          PRACTICE CONSOLE
        </span>
        <span className={styles.previewStatus}>AUDIO READY</span>
      </div>
      <div className={styles.previewGrid}>
        <section
          className={styles.metronomePanel}
          aria-label="메트로놈 미리보기"
        >
          <div className={styles.panelHeader}>
            <span>METRONOME</span>
            <span>4 / 4</span>
          </div>
          <div className={styles.bpmReadout}>
            <span className={styles.bpmValue}>120</span>
            <span className={styles.bpmUnit}>BPM</span>
          </div>
          <div className={styles.beatTrack} aria-hidden="true">
            <span className={styles.beatActive} />
            <span />
            <span />
            <span />
          </div>
          <div className={styles.tempoScale} aria-hidden="true">
            {Array.from({ length: 21 }, (_, index) => (
              <span
                key={index}
                className={index === 10 ? styles.tempoTickActive : undefined}
              />
            ))}
          </div>
          <div className={styles.previewControlRow}>
            <span className={styles.previewMode}>QUARTER NOTE</span>
            <span className={styles.playDisc}>
              <Icon icon={Play} size={20} className={styles.playIcon} />
            </span>
          </div>
        </section>
        <section className={styles.tunerPanel} aria-label="튜너 미리보기">
          <div className={styles.panelHeader}>
            <span>TUNER</span>
            <span className={styles.inTune}>
              <Icon icon={Check} size={12} /> IN TUNE
            </span>
          </div>
          <div className={styles.tunerReadout}>
            <span className={styles.noteValue}>A</span>
            <span className={styles.noteOctave}>4</span>
          </div>
          <div className={styles.gauge} aria-hidden="true">
            <div className={styles.gaugeArc} />
            <div className={styles.gaugeNeedle} />
            <span className={styles.gaugeCenter} />
          </div>
          <div className={styles.gaugeLabels}>
            <span>−50</span>
            <strong>0</strong>
            <span>+50</span>
          </div>
          <div className={styles.frequency}>
            440.0 <span>Hz</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className={styles.page} data-landing-page="true">
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/landing" aria-label="TempoTune 홈">
            <BrandMark />
          </Link>
          <nav className={styles.headerNav} aria-label="랜딩 페이지">
            <a href="#tools">도구</a>
            <a href="#accuracy">정확도</a>
          </nav>
          <div className={styles.headerActions}>
            <ThemeModeMenu />
            <Link href="/metronome" className={styles.headerCta}>
              웹 앱 열기
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>
                <span />
                PRECISION PRACTICE TOOLS
              </p>
              <h1>
                박자와 음정에,
                <br />
                <span>바로 집중하세요.</span>
              </h1>
              <p className={styles.heroDescription}>
                메트로놈, 튜너, 리듬 연습을 한곳에 담았습니다. 설치 없이 웹에서
                열고, 연주에 필요한 기준을 빠르게 맞춰보세요.
              </p>
              <div className={styles.heroActions}>
                <Link href="/metronome" className={styles.primaryCta}>
                  <Icon icon={Timer} size={20} />
                  메트로놈 열기
                  <Icon icon={ArrowRight} size={18} />
                </Link>
                <Link href="/tuner" className={styles.secondaryCta}>
                  <Icon icon={AudioLines} size={20} />
                  튜너 열기
                </Link>
              </div>
              <p className={styles.heroNote}>
                <Icon icon={Clock3} size={16} />
                웹과 iOS·Android 하이브리드 환경에서 같은 핵심 도구를
                제공합니다.
              </p>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section className={styles.proofRail} aria-label="정확도 검증 기준">
          <div className={styles.proofInner}>
            {proofPoints.map((point) => (
              <div className={styles.proofItem} key={point.value}>
                <strong>{point.value}</strong>
                <span>{point.label}</span>
                <small>{point.detail}</small>
              </div>
            ))}
          </div>
        </section>

        <section id="tools" className={styles.toolsSection}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>FOUR FOCUSED TOOLS</p>
            <h2>연습 흐름을 끊지 않는 네 가지 도구</h2>
            <p>
              필요한 기능으로 바로 이동하고, 익숙한 한 화면 안에서 연습을
              이어갑니다.
            </p>
          </div>
          <div className={styles.toolGrid}>
            {tools.map((tool, index) => (
              <Link
                href={tool.href}
                className={styles.toolCard}
                key={tool.title}
              >
                <div className={styles.toolCardTop}>
                  <span className={styles.toolIcon}>
                    <Icon icon={tool.icon} size={27} />
                  </span>
                  <span className={styles.toolIndex}>0{index + 1}</span>
                </div>
                <p className={styles.toolEyebrow}>{tool.eyebrow}</p>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <span className={styles.toolLink}>
                  도구 열기 <Icon icon={ArrowRight} size={17} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="accuracy" className={styles.accuracySection}>
          <div className={styles.accuracyInner}>
            <div className={styles.accuracyCopy}>
              <p className={styles.eyebrow}>MEASURED, NOT ASSUMED</p>
              <h2>오래 쓸수록 드러나는 오차까지 검사합니다.</h2>
              <p>
                메트로놈은 매 박자를 시작 시점의 절대 위치에서 계산해 작은
                반올림 오차가 쌓이지 않게 합니다. 튜너는 저음 분석 창을 충분히
                확보하고, 단음 WAV 회귀로 음명과 cents 편차를 확인합니다.
              </p>
              <Link href="/metronome" className={styles.textLink}>
                정확한 박자로 연습 시작
                <Icon icon={ArrowRight} size={18} />
              </Link>
            </div>
            <div className={styles.accuracyCards}>
              <article className={styles.accuracyCard}>
                <span className={styles.accuracyIcon}>
                  <Icon icon={Gauge} size={24} />
                </span>
                <p>METRONOME CLOCK</p>
                <strong>&lt; 0.001 ms</strong>
                <span>123 BPM을 6시간 재생한 회귀 기준의 누적 위상 오차</span>
              </article>
              <article className={styles.accuracyCard}>
                <span className={styles.accuracyIcon}>
                  <Icon icon={AudioLines} size={24} />
                </span>
                <p>TUNER WINDOW</p>
                <strong>4096 samples</strong>
                <span>35Hz 저음까지 안정적으로 분석하기 위한 기본 분석 창</span>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.finalCtaSection}>
          <div className={styles.finalCta}>
            <div>
              <p className={styles.eyebrow}>READY WHEN YOU ARE</p>
              <h2>기준을 맞추고, 바로 연주하세요.</h2>
              <p>
                가입이나 설치 없이 TempoTune의 핵심 도구를 웹에서 시작할 수
                있습니다.
              </p>
            </div>
            <div className={styles.finalActions}>
              <Link href="/metronome" className={styles.primaryCta}>
                메트로놈 열기
                <Icon icon={ArrowRight} size={18} />
              </Link>
              <Link href="/tuner" className={styles.secondaryCta}>
                튜너 열기
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <BrandMark compact />
            <p>박자와 음정을 위한 정밀 연습 도구.</p>
          </div>
          <nav aria-label="제품 링크">
            <Link href="/metronome">메트로놈</Link>
            <Link href="/tuner">튜너</Link>
            <Link href="/rhythm">리듬 연습</Link>
            <Link href="/settings">설정</Link>
          </nav>
          <p className={styles.copyright}>
            &copy; {COPYRIGHT_YEAR} {LEGAL_ENTITY}
          </p>
        </div>
      </footer>
    </div>
  );
}
