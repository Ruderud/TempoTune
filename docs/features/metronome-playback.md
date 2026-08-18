---
id: metronome-playback
name: Metronome Playback
status: implemented
platforms: [web, ios, android]
tests:
  unit:
    - packages/audio/src/metronome/metronome-engine.test.ts
  e2eWeb:
    - apps/web/e2e/metronome-bpm.spec.ts
  e2eDevice:
    - apps/mobile/appium/specs/metronome-bridge.smoke.spec.ts
criticalPaths:
  - packages/audio/src/metronome/metronome-engine.ts
  - packages/audio/src/metronome/metronome-scheduler.ts
  - packages/audio/src/metronome/metronome-engine.types.ts
  - apps/web/services/audio/metronome-audio.service.ts
  - apps/web/services/audio/sound-loader.service.ts
  - apps/web/services/audio/audio-context.service.ts
  - apps/web/hooks/use-metronome.ts
  - apps/web/app/(tabs)/metronome/page.tsx
  - packages/shared/src/constants/metronome.constants.ts
  - apps/mobile/android/app/src/main/java/com/tempotune/MetronomeSampleClock.kt
  - apps/mobile/ios/TempoTune/MetronomeModule.swift
manualChecks:
  - Play/Stop 토글 시 정확한 비트 사운드 재생
  - 재생 중 화면 이동 후 복귀 시 상태 유지
  - 장시간 재생 시 타이밍 드리프트 없음
---

# Metronome Playback

Web Audio API 기반 메트로놈 엔진. AudioContext scheduler로 정밀 타이밍 제어.

## Architecture

- `MetronomeEngine` — 비트 스케줄링 + 상태 관리
- `MetronomeScheduler` — lookahead 기반 Web Audio 스케줄링
- `metronome-audio.service` — Web 환경 AudioContext 바인딩
- `sound-loader.service` — 사운드 프리셋 로딩
- `use-metronome` hook — React 상태 + 엔진 연결

## Long-running Timing Contract

- 네이티브 beat deadline은 fractional sample 절대 위치를 반올림해 계산
- 44.1kHz, 123 BPM, 6시간 후 sample 오차 0.5 이하
- 웹 예약 timestamp는 같은 조건에서 누적 위상 오차 0.001ms 미만
