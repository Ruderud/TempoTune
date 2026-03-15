'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Gauge, Headphones, Minus, Plus, RefreshCw, Target, Waves } from 'lucide-react';
import { COMMON_TIME_SIGNATURES, MAX_BPM, MIN_BPM } from '@tempo-tune/shared/constants';
import { clamp } from '@tempo-tune/shared/utils';
import type { AudioInputDevice, RhythmHitEvent, TimeSignature } from '@tempo-tune/shared/types';
import { Icon } from '../../../components/common/icon.component';
import { MobilePageHeader } from '../../../components/common/mobile-page-header.component';
import { SessionStats } from '../../../components/metronome';
import { useAudioInput } from '../../../hooks/use-audio-input';
import { useMetronome } from '../../../hooks/use-metronome';
import { useRhythmPractice } from '../../../hooks/use-rhythm-practice';

const PRACTICE_COUNTDOWN_START = 4;

function getHitTone(latestHit: RhythmHitEvent | null): { label: string; badge: string; offset: string; hint: string } {
  if (!latestHit) {
    return {
      label: '대기',
      badge: 'border-border-subtle bg-surface/70 text-text-secondary',
      offset: '--',
      hint: '연습 시작을 누르면 카운트다운 후 세션이 시작됩니다',
    };
  }

  if (latestHit.status === 'on-time') {
    return {
      label: '정확',
      badge: 'border-primary bg-primary text-background-dark',
      offset: `${Math.round(latestHit.offsetMs)}ms`,
      hint: '비트 중앙에 잘 붙고 있습니다',
    };
  }

  if (latestHit.status === 'early') {
    return {
      label: '빠름',
      badge: 'border-danger/30 bg-danger/10 text-danger',
      offset: `-${Math.abs(Math.round(latestHit.offsetMs))}ms`,
      hint: '조금만 늦게 들어오면 더 안정적입니다',
    };
  }

  return {
    label: '느림',
    badge: 'border-border-subtle bg-card-soft text-text-primary',
    offset: `+${Math.abs(Math.round(latestHit.offsetMs))}ms`,
    hint: '조금 더 앞에서 박자를 잡아보세요',
  };
}

function getTransportLabel(device?: AudioInputDevice): string {
  if (!device) return '기본 입력';
  if (device.transport === 'usb') return 'USB 입력';
  if (device.transport === 'wired') return '유선 입력';
  if (device.transport === 'bluetooth') return '블루투스 입력';
  if (device.transport === 'built-in') return '내장 마이크';
  return device.label || '오디오 입력';
}

function ControlPanel({
  bpm,
  timeSignature,
  locked,
  onBpmChange,
  onTimeSignatureChange,
}: {
  bpm: number;
  timeSignature: TimeSignature;
  locked: boolean;
  onBpmChange: (bpm: number) => void;
  onTimeSignatureChange: (ts: TimeSignature) => void;
}) {
  const adjustBpm = (delta: number) => {
    onBpmChange(clamp(bpm + delta, MIN_BPM, MAX_BPM));
  };

  return (
    <div className="glass-card rounded-[28px] p-3.5 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-primary/80">Tempo Setup</div>
          <div className="mt-2 text-3xl font-bold tabular-nums text-text-strong">{bpm} BPM</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={locked}
            onClick={() => adjustBpm(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-card-soft text-primary disabled:cursor-not-allowed disabled:text-text-muted"
          >
            <Icon icon={Minus} size={18} />
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => adjustBpm(1)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-card-soft text-primary disabled:cursor-not-allowed disabled:text-text-muted"
          >
            <Icon icon={Plus} size={18} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {COMMON_TIME_SIGNATURES.map((signature) => {
          const active = timeSignature[0] === signature[0] && timeSignature[1] === signature[1];
          return (
            <button
              key={`${signature[0]}-${signature[1]}`}
              type="button"
              disabled={locked}
              onClick={() => onTimeSignatureChange(signature)}
              className={`min-h-[42px] rounded-2xl border text-sm font-semibold transition-all ${
                active
                  ? 'border-primary bg-primary text-background-dark'
                  : 'border-border-subtle bg-card-soft text-text-primary'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {signature[0]}/{signature[1]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PracticeHero({
  bpm,
  beatsPerMeasure,
  currentBeat,
  isPlaying,
  countdownValue,
  latestHit,
  accuracy,
  meanOffsetMs,
  currentStreak,
  totalHits,
  showMetrics = false,
}: {
  bpm: number;
  beatsPerMeasure: number;
  currentBeat: number;
  isPlaying: boolean;
  countdownValue: number | null;
  latestHit: RhythmHitEvent | null;
  accuracy?: number;
  meanOffsetMs?: number;
  currentStreak?: number;
  totalHits?: number;
  showMetrics?: boolean;
}) {
  const hitTone = getHitTone(latestHit);
  const beats = Array.from({ length: beatsPerMeasure }, (_, index) => index + 1);
  const compact = showMetrics;

  return (
    <div className="glass-card flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] p-4 lg:p-7">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.28em] text-primary/80">Rhythm Practice</div>
        <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${hitTone.badge}`}>
          {countdownValue ? '준비' : hitTone.label}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        {beats.map((beat) => {
          const active = isPlaying && currentBeat === beat;
          return (
            <div
              key={beat}
              className={`h-3.5 w-3.5 rounded-full transition-all ${
                active ? 'bg-primary ring-4 ring-primary/15' : 'bg-card-strong'
              }`}
            />
          );
        })}
      </div>

      <div className="mt-3 flex flex-1 items-center justify-center">
        <div className={`relative flex items-center justify-center rounded-full border border-primary/20 bg-[radial-gradient(circle_at_center,rgba(29,120,116,0.18),rgba(255,255,255,0.88)_68%)] ${compact ? 'h-24 w-24' : 'h-48 w-48 lg:h-56 lg:w-56'}`}>
          <div className={`absolute inset-3 rounded-full border border-primary/15 ${isPlaying ? 'animate-pulse' : ''}`} />
          <div className="text-center">
            <div className={`${compact ? 'text-[38px]' : 'text-[76px] lg:text-[88px]'} font-bold leading-none tracking-tight text-text-strong`}>
              {countdownValue ?? (isPlaying ? currentBeat || 1 : bpm)}
            </div>
            <div className="mt-2 text-xs uppercase tracking-[0.32em] text-text-muted">
              {countdownValue ? 'Get Ready' : isPlaying ? 'Current Beat' : 'BPM'}
            </div>
          </div>
        </div>
      </div>

      {compact ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="col-span-3 rounded-[20px] border border-border-subtle bg-surface/80 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Latest Offset</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-text-strong">
                  {countdownValue ? `${countdownValue}` : hitTone.offset}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Session</div>
                <div className="mt-1 text-xs font-semibold text-text-primary">
                  {countdownValue ? '카운트다운 중' : isPlaying ? `${beatsPerMeasure}/4 진행 중` : '대기 중'}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-[20px] border border-border-subtle bg-surface/70 p-2.5">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Accuracy</div>
            <div className="mt-1.5 text-lg font-bold tabular-nums text-text-strong">
              {totalHits ? `${Math.round((accuracy ?? 0) * 100)}%` : '--'}
            </div>
          </div>
          <div className="rounded-[20px] border border-border-subtle bg-surface/70 p-2.5">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Average</div>
            <div className="mt-1.5 text-lg font-bold tabular-nums text-text-strong">
              {totalHits ? `${Math.round((meanOffsetMs ?? 0)) > 0 ? '+' : ''}${Math.round(meanOffsetMs ?? 0)}ms` : '--'}
            </div>
          </div>
          <div className="rounded-[20px] border border-border-subtle bg-surface/70 p-2.5">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Streak</div>
            <div className="mt-1.5 text-lg font-bold tabular-nums text-text-strong">{currentStreak ?? 0}</div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[24px] border border-border-subtle bg-surface/80 p-3.5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-text-muted">Latest Offset</div>
              <div className="mt-1.5 text-3xl font-bold tracking-tight tabular-nums text-text-strong lg:text-4xl">
                {countdownValue ? `${countdownValue}` : hitTone.offset}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-[0.24em] text-text-muted">Session</div>
              <div className="mt-1.5 text-sm font-semibold text-text-primary">
                {countdownValue ? '카운트다운 중' : isPlaying ? `${beatsPerMeasure}/4 진행 중` : '대기 중'}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-text-secondary lg:text-sm">{countdownValue ? '4, 3, 2, 1 이후 자동으로 시작됩니다' : hitTone.hint}</div>
        </div>
      )}
    </div>
  );
}

function MetricStrip({
  accuracy,
  meanOffsetMs,
  currentStreak,
  totalHits,
}: {
  accuracy: number;
  meanOffsetMs: number;
  currentStreak: number;
  totalHits: number;
}) {
  const items = [
    {
      label: 'Accuracy',
      value: totalHits > 0 ? `${Math.round(accuracy * 100)}%` : '--',
      hint: totalHits > 0 ? '정확 비율' : '측정 전',
      icon: Target,
    },
    {
      label: 'Average',
      value: totalHits > 0 ? `${Math.round(meanOffsetMs) > 0 ? '+' : ''}${Math.round(meanOffsetMs)}ms` : '--',
      hint: totalHits > 0 ? '평균 오프셋' : '측정 전',
      icon: Gauge,
    },
    {
      label: 'Streak',
      value: `${currentStreak}`,
      hint: currentStreak > 0 ? '연속 정확' : '누적 대기',
      icon: Waves,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((item) => (
        <div key={item.label} className="rounded-[22px] border border-border-subtle bg-surface/80 p-2.5">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-text-muted">
            <Icon icon={item.icon} size={13} className="text-primary/70" />
            <span>{item.label}</span>
          </div>
          <div className="mt-1.5 text-lg font-bold tabular-nums text-text-strong">{item.value}</div>
          <div className="mt-1 text-xs text-text-muted">{item.hint}</div>
        </div>
      ))}
    </div>
  );
}

function RecentHitsStrip({ hits }: { hits: RhythmHitEvent[] }) {
  const displayHits = hits.slice(0, 4);

  return (
    <div className="glass-card rounded-[28px] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-primary/80">Recent Hits</div>
          <div className="mt-1 text-sm font-semibold text-text-strong">최근 4번 판정</div>
        </div>
        <div className="text-xs text-text-muted">{displayHits.length}/4</div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, index) => {
          const hit = displayHits[index];
          const tone = getHitTone(hit ?? null);
          return (
            <div
              key={hit ? `${hit.detectedAtMonotonicMs}-${hit.offsetMs}` : `empty-${index}`}
              className="rounded-[20px] border border-border-subtle bg-card-soft p-2 text-center"
            >
              <div className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${hit ? tone.badge : 'border-border-subtle bg-surface/70 text-text-muted'}`}>
                {hit ? tone.label : '--'}
              </div>
              <div className="mt-1.5 text-sm font-bold tabular-nums text-text-strong">
                {hit ? tone.offset : '--'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RhythmPracticePage() {
  const metronome = useMetronome();
  const audioInput = useAudioInput();
  const rhythmPractice = useRhythmPractice();
  const {
    bpm,
    currentBeat,
    timeSignature,
    isPlaying,
    start: startMetronome,
    stop: stopMetronome,
    setBpm,
    setTimeSignature,
  } = metronome;
  const {
    devices,
    selectedDeviceId,
    sessionState,
    refreshDevices,
    selectDevice,
    startCapture,
    stopCapture,
  } = audioInput;
  const {
    isActive,
    latestHit,
    recentHits,
    currentStreak,
    stats,
    startPractice,
    stopPractice,
  } = rhythmPractice;

  const ownsCaptureRef = useRef(false);
  const stopPracticeSessionRef = useRef<(() => Promise<void>) | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [practiceError, setPracticeError] = useState<string | null>(null);

  const selectedOrActiveDeviceId =
    selectedDeviceId ??
    sessionState.deviceId ??
    devices.find((device) => device.isDefault)?.id ??
    'default';
  const currentDevice =
    devices.find((device) => device.id === selectedOrActiveDeviceId) ??
    devices.find((device) => device.isDefault) ??
    devices[0];
  const isLocked = isActive || countdownValue !== null || sessionState.status === 'starting';

  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const stopPracticeSession = useCallback(async () => {
    clearCountdownTimer();
    setCountdownValue(null);
    stopPractice();
    if (ownsCaptureRef.current) {
      await stopCapture();
      ownsCaptureRef.current = false;
    }
    if (isPlaying) {
      stopMetronome();
    }
  }, [clearCountdownTimer, isPlaying, stopCapture, stopMetronome, stopPractice]);

  const beginPracticeSession = useCallback(async () => {
    clearCountdownTimer();
    setCountdownValue(null);

    try {
      if (isPlaying) {
        stopMetronome();
      }

      await startMetronome();
      startPractice(bpm, timeSignature[0]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '박자 연습을 시작하지 못했습니다.';
      setPracticeError(message);
      if (ownsCaptureRef.current) {
        await stopCapture();
        ownsCaptureRef.current = false;
      }
    }
  }, [bpm, clearCountdownTimer, isPlaying, startMetronome, startPractice, stopCapture, stopMetronome, timeSignature]);

  const cancelCountdown = useCallback(async () => {
    clearCountdownTimer();
    setCountdownValue(null);
    if (ownsCaptureRef.current && !isActive) {
      await stopCapture();
      ownsCaptureRef.current = false;
    }
  }, [clearCountdownTimer, isActive, stopCapture]);

  const startPracticeSession = useCallback(async () => {
    setPracticeError(null);

    try {
      const hadCaptureSession = sessionState.status === 'running' || sessionState.status === 'starting';
      ownsCaptureRef.current = !hadCaptureSession;

      await startCapture({
        deviceId: selectedOrActiveDeviceId,
        channelIndex: 0,
        enablePitch: true,
        enableRhythm: true,
      });

      setCountdownValue(PRACTICE_COUNTDOWN_START);
      let nextValue = PRACTICE_COUNTDOWN_START;
      clearCountdownTimer();
      countdownTimerRef.current = window.setInterval(() => {
        nextValue -= 1;
        if (nextValue > 0) {
          setCountdownValue(nextValue);
          return;
        }

        clearCountdownTimer();
        setCountdownValue(null);
        void beginPracticeSession();
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : '오디오 입력을 시작하지 못했습니다.';
      setPracticeError(message);
      if (ownsCaptureRef.current) {
        await stopCapture();
        ownsCaptureRef.current = false;
      }
    }
  }, [beginPracticeSession, clearCountdownTimer, selectedOrActiveDeviceId, sessionState.status, startCapture, stopCapture]);

  useEffect(() => {
    stopPracticeSessionRef.current = stopPracticeSession;
  }, [stopPracticeSession]);

  useEffect(() => {
    if (isPlaying || !isActive) {
      return;
    }

    const stopTimer = window.setTimeout(() => {
      void stopPracticeSessionRef.current?.();
    }, 0);

    return () => {
      window.clearTimeout(stopTimer);
    };
  }, [isActive, isPlaying]);

  useEffect(() => {
    return () => {
      clearCountdownTimer();
      void stopPracticeSessionRef.current?.();
    };
  }, [clearCountdownTimer]);

  return (
    <div className="h-full overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      <div className="lg:hidden h-full overflow-hidden px-6 py-4">
        <div className="flex h-full flex-col">
          <MobilePageHeader title="박자 연습" />

          <div className="mt-3 grid min-h-0 flex-1 grid-rows-[auto_1fr_auto_auto] gap-3 pb-3">
            <ControlPanel
              bpm={bpm}
              timeSignature={timeSignature}
              locked={isLocked}
              onBpmChange={setBpm}
              onTimeSignatureChange={setTimeSignature}
            />

            <div className="min-h-0">
              <PracticeHero
                bpm={bpm}
                beatsPerMeasure={timeSignature[0]}
                currentBeat={currentBeat}
                isPlaying={isPlaying}
                countdownValue={countdownValue}
                latestHit={latestHit}
                accuracy={stats.accuracy}
                meanOffsetMs={stats.meanOffsetMs}
                currentStreak={currentStreak}
                totalHits={stats.totalHits}
                showMetrics
              />
            </div>

            <RecentHitsStrip hits={recentHits} />

            <div className="glass-card rounded-[28px] p-3.5">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Icon icon={Headphones} size={14} className="text-primary/70" />
                <span className="truncate">{getTransportLabel(currentDevice)}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <select
                  value={selectedDeviceId ?? currentDevice?.id ?? 'default'}
                  disabled={isLocked}
                  onChange={(event) => void selectDevice(event.target.value)}
                  className="min-w-0 flex-1 rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-sm text-text-primary outline-none disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {devices.length === 0 ? (
                    <option value="default">기본 입력</option>
                  ) : (
                    devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.label || getTransportLabel(device)}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => void refreshDevices()}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-card-soft text-primary disabled:cursor-not-allowed disabled:text-text-muted"
                >
                  <Icon icon={RefreshCw} size={16} />
                </button>
              </div>

              <button
                type="button"
                disabled={sessionState.status === 'starting' && countdownValue === null && !isActive}
                onClick={() => void (countdownValue ? cancelCountdown() : isActive ? stopPracticeSession() : startPracticeSession())}
                className={`mt-3 flex min-h-[56px] w-full items-center justify-center rounded-2xl text-base font-bold transition-all ${
                  countdownValue
                    ? 'border border-border-subtle bg-card-soft text-text-primary'
                    : isActive
                      ? 'border border-border-subtle bg-card-soft text-text-primary'
                      : 'bg-primary text-background-dark'
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {countdownValue ? '카운트다운 취소' : isActive ? '연습 중지' : '연습 시작'}
              </button>

              {practiceError && (
                <div className="mt-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {practiceError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:grid h-full grid-cols-12 gap-8 overflow-hidden p-8">
        <div className="col-span-7 flex flex-col gap-6 overflow-y-auto">
          <ControlPanel
            bpm={bpm}
            timeSignature={timeSignature}
            locked={isLocked}
            onBpmChange={setBpm}
            onTimeSignatureChange={setTimeSignature}
          />

          <PracticeHero
            bpm={bpm}
            beatsPerMeasure={timeSignature[0]}
            currentBeat={currentBeat}
            isPlaying={isPlaying}
            countdownValue={countdownValue}
            latestHit={latestHit}
          />
        </div>

        <div className="col-span-5 overflow-y-auto">
          <SessionStats
            isPlaying={isPlaying}
            bpm={bpm}
            currentBeat={currentBeat}
            beatsPerMeasure={timeSignature[0]}
            practiceActive={isActive}
            latestHit={latestHit}
            recentHits={recentHits}
            currentStreak={currentStreak}
            stats={stats}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            sessionState={sessionState}
            onSelectDevice={selectDevice}
            onRefreshDevices={refreshDevices}
            onStartPractice={startPracticeSession}
            onStopPractice={stopPracticeSession}
            errorMessage={practiceError}
          />
        </div>
      </div>

      {countdownValue !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-overlay-strong/78 backdrop-blur-md">
          <div className="mx-6 w-full max-w-sm rounded-[32px] border border-primary/20 bg-surface/92 p-8 text-center shadow-[0_24px_80px_rgba(7,30,34,0.18)]">
            <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Get Ready</p>
            <div className="mt-5 text-[112px] font-bold leading-none tracking-tight text-text-strong">
              {countdownValue}
            </div>
            <p className="mt-4 text-sm text-text-secondary">
              준비가 끝나면 메트로놈과 박자 판정이 함께 시작됩니다.
            </p>
            <button
              type="button"
              onClick={() => void cancelCountdown()}
              className="mt-6 min-h-[48px] rounded-2xl border border-border-subtle bg-card-soft px-5 text-sm font-semibold text-text-primary"
            >
              연습 취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
