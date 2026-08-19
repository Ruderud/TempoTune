'use client';

import type { CSSProperties } from 'react';
import {
  ChevronRight,
  Clock3,
  Info,
  Keyboard,
  MoonStar,
  Music2,
  SlidersHorizontal,
  Type,
  Waves,
} from 'lucide-react';
import { Icon } from '../../../components/common/icon.component';
import {
  APP_NAME,
  APP_VERSION,
  COPYRIGHT_YEAR,
  LEGAL_ENTITY,
} from '../../../constants/app';
import {
  COMMON_TIME_SIGNATURES,
  MAX_BPM,
  MIN_BPM,
} from '@tempo-tune/shared/constants';
import { useMetronomePreferences } from '../../../hooks/use-metronome-preferences';
import { useThemePreference } from '../../../hooks/use-theme-preference';
import { useTunerDetectionSettings } from '../../../hooks/use-tuner-detection-settings';
import { useTunerLayout } from '../../../hooks/use-tuner-layout';
import {
  MAX_REFERENCE_FREQUENCY,
  MIN_REFERENCE_FREQUENCY,
  useTunerReferenceFrequency,
} from '../../../hooks/use-tuner-reference-frequency';
import type { ThemePreference } from '../../../lib/theme';

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  description: string;
}> = [
  { value: 'system', label: '시스템', description: 'OS 설정을 따릅니다.' },
  {
    value: 'light',
    label: '라이트',
    description: '밝은 작업 환경에 맞춥니다.',
  },
  { value: 'dark', label: '다크', description: '저조도 환경에 맞춥니다.' },
];

const sensitivityOptions = [
  { value: 'stable', label: '안정형' },
  { value: 'balanced', label: '균형형' },
  { value: 'fast', label: '빠른 응답' },
] as const;

const headstockOptions = [
  { value: 'three-plus-three', label: '3+3' },
  { value: 'six-inline', label: '6-인라인' },
] as const;

function getSliderStyle(
  value: number,
  min: number,
  max: number
): CSSProperties {
  return {
    '--slider-progress': `${((value - min) / (max - min)) * 100}%`,
  } as CSSProperties;
}

export default function SettingsPage() {
  const { preference, resolvedTheme, setPreference } = useThemePreference();
  const { referenceFrequency, setReferenceFrequency } =
    useTunerReferenceFrequency();
  const {
    detectionSettings,
    sensitivityPreset,
    setDetectionSettings,
    applySensitivityPreset,
  } = useTunerDetectionSettings();
  const { headstockLayout, setHeadstockLayout } = useTunerLayout();
  const metronome = useMetronomePreferences();
  const studioPalette = [
    {
      label: '틸 포커스',
      description: '주요 버튼, 활성 탭, 실시간 데이터 강조',
      swatchClass: 'bg-primary',
    },
    {
      label: '아이보리 대비',
      description: '헤드라인과 중요한 표면 대비에만 사용',
      swatchClass:
        resolvedTheme === 'dark' ? 'bg-text-strong' : 'bg-background-dark',
    },
    {
      label: '코랄 알림',
      description: '오류, 삭제, 경고 상태에만 제한적으로 사용',
      swatchClass: 'bg-danger',
    },
  ];

  return (
    <div className="h-full overflow-y-auto pb-4 lg:flex lg:overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-primary/10 bg-background-dark/40 backdrop-blur-md shrink-0">
        <div className="p-6 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-primary">환경 설정</h2>
            <span className="text-xs text-primary/40 bg-primary/10 px-2 py-0.5 rounded-full">
              SYSTEM
            </span>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary border border-primary/20 transition-all">
            <Icon icon={SlidersHorizontal} size={16} />
            <span className="font-medium text-sm">일반</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary/60 hover:text-primary hover:bg-card-soft transition-all">
            <Icon icon={Waves} size={16} />
            <span className="font-medium text-sm">튜너</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary/60 hover:text-primary hover:bg-card-soft transition-all">
            <Icon icon={Clock3} size={16} />
            <span className="font-medium text-sm">메트로놈</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary/60 hover:text-primary hover:bg-card-soft transition-all">
            <Icon icon={Keyboard} size={16} />
            <span className="font-medium text-sm">단축키</span>
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto lg:px-0">
        <div className="px-5 lg:px-10 pt-4 lg:pt-8 space-y-4 lg:space-y-6 lg:max-w-4xl">
          {/* Mobile header */}
          <div className="flex items-center justify-between lg:hidden px-1 py-5">
            <button
              type="button"
              aria-label="뒤로"
              onClick={() => window.history.back()}
              className="p-2 rounded-lg bg-card-soft flex items-center justify-center text-primary/70 border border-border-subtle"
            >
              <Icon name="back" size={18} label="뒤로" />
            </button>
            <span className="text-lg font-bold tracking-[0.1em] text-primary">
              설정
            </span>
            <div className="w-[34px]" />
          </div>

          <section>
            <h2 className="px-1 mb-1 text-xs font-semibold uppercase tracking-widest text-primary/60">
              튜너 설정
            </h2>
            <div className="glass-card rounded-xl p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-strong">
                      A4 기준 주파수
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      튜너가 기준으로 삼을 A4 음높이입니다.
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {referenceFrequency} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_REFERENCE_FREQUENCY}
                  max={MAX_REFERENCE_FREQUENCY}
                  step={1}
                  value={referenceFrequency}
                  onChange={(event) =>
                    setReferenceFrequency(Number(event.target.value))
                  }
                  className="slider mt-2 min-h-11 w-full cursor-pointer appearance-none rounded-full"
                  style={getSliderStyle(
                    referenceFrequency,
                    MIN_REFERENCE_FREQUENCY,
                    MAX_REFERENCE_FREQUENCY
                  )}
                  aria-label="A4 기준 주파수"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-text-primary">
                  감지 반응
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {sensitivityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => applySensitivityPreset(option.value)}
                      aria-pressed={sensitivityPreset === option.value}
                      className={`min-h-11 rounded-xl border px-3 text-xs font-semibold transition-all ${
                        sensitivityPreset === option.value
                          ? 'border-primary bg-primary text-background-dark'
                          : 'border-border-subtle bg-card-soft text-text-primary hover:border-primary/30'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-xl border border-border-subtle bg-card-soft p-3">
                  <span className="flex items-center justify-between gap-3 text-xs text-text-muted">
                    신뢰도 게이트
                    <strong className="tabular-nums text-primary">
                      {detectionSettings.confidenceGate.toFixed(2)}
                    </strong>
                  </span>
                  <input
                    type="range"
                    min={0.1}
                    max={0.75}
                    step={0.01}
                    value={detectionSettings.confidenceGate}
                    onChange={(event) =>
                      setDetectionSettings({
                        confidenceGate: Number(event.target.value),
                      })
                    }
                    className="slider mt-2 min-h-11 w-full cursor-pointer appearance-none rounded-full"
                    style={getSliderStyle(
                      detectionSettings.confidenceGate,
                      0.1,
                      0.75
                    )}
                  />
                </label>
                <label className="rounded-xl border border-border-subtle bg-card-soft p-3">
                  <span className="flex items-center justify-between gap-3 text-xs text-text-muted">
                    입력 노이즈 게이트
                    <strong className="tabular-nums text-primary">
                      {detectionSettings.rmsThreshold.toFixed(3)}
                    </strong>
                  </span>
                  <input
                    type="range"
                    min={0.001}
                    max={0.05}
                    step={0.001}
                    value={detectionSettings.rmsThreshold}
                    onChange={(event) =>
                      setDetectionSettings({
                        rmsThreshold: Number(event.target.value),
                      })
                    }
                    className="slider mt-2 min-h-11 w-full cursor-pointer appearance-none rounded-full"
                    style={getSliderStyle(
                      detectionSettings.rmsThreshold,
                      0.001,
                      0.05
                    )}
                  />
                </label>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-text-primary">
                  헤드스톡 배치
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {headstockOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setHeadstockLayout(option.value)}
                      aria-pressed={headstockLayout === option.value}
                      className={`min-h-11 rounded-xl border px-3 text-xs font-semibold transition-all ${
                        headstockLayout === option.value
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border-subtle bg-card-soft text-text-primary hover:border-primary/30'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/60">
              메트로놈 옵션
            </h2>
            <div className="glass-card rounded-xl p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-strong">
                      기본 BPM
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      다음 세션에도 유지할 기본 템포입니다.
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {metronome.bpm}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_BPM}
                  max={MAX_BPM}
                  step={1}
                  value={metronome.bpm}
                  onChange={(event) =>
                    metronome.setBpm(Number(event.target.value))
                  }
                  className="slider mt-2 min-h-11 w-full cursor-pointer appearance-none rounded-full"
                  style={getSliderStyle(metronome.bpm, MIN_BPM, MAX_BPM)}
                  aria-label="기본 BPM"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-text-primary">
                  기본 박자표
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {COMMON_TIME_SIGNATURES.map((timeSignature) => {
                    const active =
                      metronome.timeSignature[0] === timeSignature[0] &&
                      metronome.timeSignature[1] === timeSignature[1];

                    return (
                      <button
                        key={`${timeSignature[0]}/${timeSignature[1]}`}
                        type="button"
                        onClick={() =>
                          metronome.setTimeSignature(timeSignature)
                        }
                        aria-pressed={active}
                        className={`min-h-11 rounded-xl border px-2 text-xs font-semibold transition-all ${
                          active
                            ? 'border-primary bg-primary text-background-dark'
                            : 'border-border-subtle bg-card-soft text-text-primary hover:border-primary/30'
                        }`}
                      >
                        {timeSignature[0]}/{timeSignature[1]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-card-soft p-3 text-text-muted">
                <Icon
                  icon={Info}
                  size={16}
                  className="mt-0.5 shrink-0 text-primary/40"
                />
                <span className="text-xs leading-relaxed">
                  사운드 프리셋과 시각 효과는 실제 동작이 준비된 뒤 별도
                  옵션으로 추가됩니다.
                </span>
              </div>
            </div>
          </section>

          {/* Desktop: Keyboard Shortcuts */}
          <section className="hidden lg:block">
            <h2 className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/60">
              키보드 단축키
            </h2>
            <div className="glass-card rounded-xl divide-y divide-border-subtle">
              {[
                { action: '재생 / 일시정지', key: 'Space' },
                { action: '템포 직접 입력 (Tap)', key: 'T' },
                { action: 'A4 주파수 리셋', key: 'Ctrl + R' },
              ].map((shortcut) => (
                <div
                  key={shortcut.action}
                  className="flex items-center justify-between p-4"
                >
                  <span className="text-sm text-text-secondary">
                    {shortcut.action}
                  </span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-primary/10 text-xs text-primary font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Visuals & Theme */}
          <section>
            <h2 className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/60">
              가독성 및 테마
            </h2>
            <div className="glass-card rounded-xl divide-y divide-border-subtle">
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Icon
                      icon={MoonStar}
                      size={20}
                      className="text-text-muted"
                    />
                    <div>
                      <span className="text-sm font-medium text-text-strong">
                        앱 테마
                      </span>
                      <p className="mt-1 text-xs text-text-muted">
                        현재 {resolvedTheme === 'dark' ? '다크' : '라이트'}{' '}
                        테마가 적용 중입니다.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    Studio Palette
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((option) => {
                    const active = preference === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPreference(option.value)}
                        className={`rounded-xl border px-3 py-3 text-left transition-all ${
                          active
                            ? 'border-primary/60 bg-primary text-background-dark shadow-lg shadow-primary/20'
                            : 'border-border-subtle bg-card-soft text-text-primary hover:border-primary/30 hover:bg-card-strong'
                        }`}
                      >
                        <span className="block text-sm font-semibold">
                          {option.label}
                        </span>
                        <span
                          className={`mt-1 block text-xs leading-relaxed ${
                            active
                              ? 'text-background-dark/80'
                              : 'text-text-muted'
                          }`}
                        >
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-border-subtle bg-card-soft p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        포인트 컬러는 세 가지 역할로만 씁니다.
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-text-muted">
                        기본 상태는 중성 톤으로 두고, 틸은 상호작용, 아이보리는
                        대비, 코랄은 경고에만 사용합니다.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {studioPalette.map((tone) => (
                      <div
                        key={tone.label}
                        className="rounded-lg border border-border-subtle bg-surface/70 p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-3 w-3 rounded-full border border-background/40 ${tone.swatchClass}`}
                          />
                          <span className="text-xs font-semibold text-text-primary">
                            {tone.label}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-text-muted">
                          {tone.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Icon icon={Type} size={20} className="text-text-muted" />
                  <span className="text-sm font-medium text-text-strong">
                    텍스트 크기
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">표준</span>
                  <Icon
                    icon={ChevronRight}
                    size={12}
                    className="text-text-muted"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* About Block */}
          <section className="pt-2 pb-6">
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/40 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Icon
                  icon={Music2}
                  size={28}
                  className="text-background-dark"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base">{APP_NAME}</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  버전 v{APP_VERSION}
                </p>
              </div>
            </div>
            <div className="mt-4 text-center space-y-1">
              <p className="text-xs text-text-muted font-medium">
                Developed by {LEGAL_ENTITY}
              </p>
              <div className="flex justify-center gap-4 text-xs text-primary/60 uppercase tracking-tighter">
                <button
                  type="button"
                  className="hover:text-primary transition-colors"
                >
                  이용약관
                </button>
                <span className="w-1 h-1 bg-border-subtle rounded-full my-auto" />
                <button
                  type="button"
                  className="hover:text-primary transition-colors"
                >
                  개인정보처리방침
                </button>
                <span className="w-1 h-1 bg-border-subtle rounded-full my-auto" />
                <button
                  type="button"
                  className="hover:text-primary transition-colors"
                >
                  라이선스
                </button>
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
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-4">
          유틸리티
        </h3>

        {/* Data management */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs text-text-muted font-semibold">데이터 관리</h4>
          {/* TODO: 데이터 가져오기/내보내기/초기화 기능 구현 필요 */}
          <button
            type="button"
            disabled
            className="w-full min-h-[44px] rounded-lg bg-surface border border-primary/10 text-sm text-text-muted opacity-40 cursor-not-allowed"
          >
            데이터 가져오기
          </button>
          <button
            type="button"
            disabled
            className="w-full min-h-[44px] rounded-lg bg-surface border border-primary/10 text-sm text-text-muted opacity-40 cursor-not-allowed"
          >
            데이터 내보내기
          </button>
          <button
            type="button"
            disabled
            className="w-full min-h-[44px] rounded-lg bg-danger-soft border border-danger/30 text-sm text-danger opacity-40 cursor-not-allowed"
          >
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
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-text-muted">
            &copy; {COPYRIGHT_YEAR} {LEGAL_ENTITY}
          </p>
        </div>
      </aside>
    </div>
  );
}
