'use client';

import { AudioLines, Gauge, RefreshCw, Target, Usb, Waves, type LucideIcon } from 'lucide-react';
import type { AudioInputDevice, AudioSessionState, RhythmHitEvent } from '@tempo-tune/shared/types';
import type { RhythmSessionStats } from '@tempo-tune/audio/rhythm';
import { Icon } from '../common/icon.component';

type SessionStatsProps = {
  isPlaying: boolean;
  bpm: number;
  currentBeat: number;
  beatsPerMeasure: number;
  practiceActive: boolean;
  latestHit: RhythmHitEvent | null;
  recentHits: RhythmHitEvent[];
  currentStreak: number;
  stats: RhythmSessionStats;
  devices: AudioInputDevice[];
  selectedDeviceId: string | null;
  sessionState: AudioSessionState;
  onSelectDevice: (deviceId: string) => void | Promise<void>;
  onRefreshDevices: () => void | Promise<unknown>;
  onStartPractice: () => void | Promise<void>;
  onStopPractice: () => void | Promise<void>;
  errorMessage?: string | null;
  showPracticeActions?: boolean;
};

function getHitTone(status: RhythmHitEvent['status']) {
  if (status === 'on-time') {
    return {
      badge: 'bg-primary text-background-dark border-primary',
      label: '정확',
      hint: '비트 중앙에 맞았습니다',
    };
  }

  if (status === 'early') {
    return {
      badge: 'bg-danger/12 text-danger border-danger/30',
      label: '빠름',
      hint: '조금만 뒤로 보내면 됩니다',
    };
  }

  return {
    badge: 'bg-text-primary/8 text-text-primary border-border-subtle',
    label: '느림',
    hint: '한 박 안으로 더 끌어와 보세요',
  };
}

function formatOffset(offsetMs: number): string {
  const rounded = Math.round(offsetMs);
  return `${rounded > 0 ? '+' : ''}${rounded}ms`;
}

function formatAccuracy(accuracy: number): string {
  return `${Math.round(accuracy * 100)}%`;
}

function getSessionLabel(sessionState: AudioSessionState, practiceActive: boolean): string {
  if (sessionState.status === 'starting') return '입력 준비 중';
  if (sessionState.status === 'running' && practiceActive) return '연습 수음 중';
  if (sessionState.status === 'running') return '입력 연결됨';
  if (sessionState.status === 'error') return '입력 오류';
  return '입력 대기';
}

function getTransportLabel(device: AudioInputDevice | undefined): string {
  if (!device) return '기본 입력';
  if (device.transport === 'usb') return 'USB';
  if (device.transport === 'wired') return '유선';
  if (device.transport === 'bluetooth') return '블루투스';
  if (device.transport === 'built-in') return '내장';
  return '오디오 입력';
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface/70 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-text-muted">
        <Icon icon={icon} size={14} className="text-primary/70" />
        <span>{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tabular-nums text-text-strong">{value}</div>
      <div className="mt-1 text-xs text-text-muted">{hint}</div>
    </div>
  );
}

function getAverageHint(stats: RhythmSessionStats): string {
  if (stats.totalHits === 0) return '연습을 시작하면 평균 오프셋이 표시됩니다';
  if (Math.round(stats.meanOffsetMs) === 0) return '중심 박자에 잘 붙고 있습니다';
  return stats.meanOffsetMs > 0 ? '조금 늦게 들어오는 편입니다' : '조금 빠르게 들어오는 편입니다';
}

export function SessionStats({
  isPlaying,
  bpm,
  currentBeat,
  beatsPerMeasure,
  practiceActive,
  latestHit,
  recentHits,
  currentStreak,
  stats,
  devices,
  selectedDeviceId,
  sessionState,
  onSelectDevice,
  onRefreshDevices,
  onStartPractice,
  onStopPractice,
  errorMessage,
  showPracticeActions = true,
}: SessionStatsProps) {
  const currentDevice =
    devices.find((device) => device.id === (selectedDeviceId ?? sessionState.deviceId)) ??
    devices.find((device) => device.isDefault) ??
    devices[0];
  const latestTone = latestHit ? getHitTone(latestHit.status) : null;
  const captureBusy = sessionState.status === 'starting' || sessionState.status === 'stopping';

  return (
    <div className="glass-card rounded-[28px] p-5 lg:p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Rhythm Coach</p>
          <h3 className="mt-2 text-xl font-bold text-text-strong">박자 연습 세션</h3>
          <p className="mt-1 text-sm text-text-secondary">
            현재 템포 {bpm} BPM, {beatsPerMeasure}/4 기준으로 판정합니다.
          </p>
        </div>
        <div className="rounded-full border border-primary/20 bg-surface/80 px-3 py-1.5 text-[11px] font-medium text-text-secondary">
          {getSessionLabel(sessionState, practiceActive)}
        </div>
      </div>

      {showPracticeActions && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            data-testid="rhythm-practice-start"
            onClick={() => void onStartPractice()}
            disabled={practiceActive || captureBusy}
            className="min-h-[52px] rounded-2xl bg-primary px-4 text-sm font-bold text-background-dark transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:bg-card-strong disabled:text-text-muted"
          >
            {captureBusy && !practiceActive ? '준비 중...' : '리듬 연습 시작'}
          </button>
          <button
            type="button"
            data-testid="rhythm-practice-stop"
            onClick={() => void onStopPractice()}
            disabled={!practiceActive}
            className="min-h-[52px] rounded-2xl border border-border-subtle bg-card-soft px-4 text-sm font-semibold text-text-primary transition-all hover:border-primary/30 disabled:cursor-not-allowed disabled:text-text-muted"
          >
            연습 중지
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border-subtle bg-card-soft/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface text-primary">
              <Icon icon={Usb} size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-strong">입력 장치</div>
              <div className="text-xs text-text-muted">
                {currentDevice ? `${getTransportLabel(currentDevice)} · ${currentDevice.channelCount}ch` : '기본 입력 사용'}
              </div>
            </div>
          </div>
          <button
            type="button"
            data-testid="audio-input-refresh"
            onClick={() => void onRefreshDevices()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-surface text-primary transition-all hover:border-primary/30"
          >
            <Icon icon={RefreshCw} size={16} className="text-primary" />
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-medium text-text-muted">수음 소스 선택</span>
          <select
            data-testid="audio-input-select"
            value={selectedDeviceId ?? currentDevice?.id ?? 'default'}
            onChange={(event) => void onSelectDevice(event.target.value)}
            className="w-full rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-all focus:border-primary/50"
          >
            {devices.length === 0 ? (
              <option value="default">기본 입력</option>
            ) : (
              devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.label || `${getTransportLabel(device)} 입력`}
                </option>
              ))
            )}
          </select>
        </label>

        <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
          <Icon icon={AudioLines} size={14} className="text-primary/70" />
          <span>장치 변경은 다음 연습 시작부터 반영됩니다.</span>
        </div>
      </div>

      <div className="rounded-[24px] border border-primary/15 bg-[linear-gradient(160deg,rgba(29,120,116,0.14),rgba(255,255,255,0.88))] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-text-muted">Latest Hit</div>
            <div className="mt-2 text-sm text-text-secondary">
              {isPlaying ? `메트로놈 ${currentBeat || 1}/${beatsPerMeasure} 박 진행 중` : '메트로놈을 다시 시작하면 세션이 새로 맞춰집니다'}
            </div>
          </div>
          <div className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${latestTone?.badge ?? 'border-border-subtle bg-surface/70 text-text-secondary'}`}>
            {latestTone?.label ?? '대기 중'}
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-4xl font-bold tracking-tight tabular-nums text-text-strong">
              {latestHit ? formatOffset(latestHit.offsetMs) : '--'}
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              {latestTone?.hint ?? '헤드폰을 연결하고 첫 박자를 쳐보세요'}
            </div>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-surface/75 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-[0.24em] text-text-muted">Confidence</div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-text-strong">
              {latestHit ? `${Math.round(latestHit.confidence * 100)}%` : '--'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Accuracy"
          value={stats.totalHits > 0 ? formatAccuracy(stats.accuracy) : '--'}
          hint={`${stats.onTimeCount} / ${stats.totalHits || 0}회 정확`}
          icon={Target}
        />
        <MetricCard
          label="Average"
          value={stats.totalHits > 0 ? formatOffset(stats.meanOffsetMs) : '--'}
          hint={getAverageHint(stats)}
          icon={Gauge}
        />
        <MetricCard
          label="Streak"
          value={`${currentStreak}`}
          hint={currentStreak > 0 ? '연속 정확 판정 유지 중' : '정확 판정을 이어가 보세요'}
          icon={Waves}
        />
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-text-strong">최근 8번 판정</div>
            <div className="mt-1 text-xs text-text-muted">BPM이나 박자를 바꿨다면 연습을 다시 시작해 주세요.</div>
          </div>
          <div className="rounded-full border border-primary/15 bg-card-soft px-3 py-1 text-xs font-medium text-text-secondary">
            총 {stats.totalHits}회
          </div>
        </div>

        {recentHits.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {recentHits.map((hit) => {
              const tone = getHitTone(hit.status);
              return (
                <div
                  key={`${hit.detectedAtMonotonicMs}-${hit.offsetMs}`}
                  className="rounded-2xl border border-border-subtle bg-card-soft p-3"
                >
                  <div className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}>
                    {tone.label}
                  </div>
                  <div className="mt-3 text-lg font-bold tabular-nums text-text-strong">
                    {formatOffset(hit.offsetMs)}
                  </div>
                  <div className="mt-1 text-xs text-text-muted">
                    {Math.round(hit.confidence * 100)}% 신뢰도
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-border-subtle bg-card-soft/60 px-4 py-6 text-sm text-text-muted">
            아직 판정된 타격이 없습니다. 메트로놈을 시작한 뒤 한 박씩 선명하게 연주해 보세요.
          </div>
        )}
      </div>

      {(errorMessage || sessionState.errorMessage) && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errorMessage ?? sessionState.errorMessage}
        </div>
      )}
    </div>
  );
}
