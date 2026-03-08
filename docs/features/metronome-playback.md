---
id: metronome-playback
name: Metronome Playback
status: implemented
platforms: [web, ios, android]
tests:
  unit:
    - packages/audio/src/metronome/metronome-engine.test.ts
  e2eWeb: []
  e2eDevice: []
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
