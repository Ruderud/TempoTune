---
id: tuner-pitch-detection
name: Tuner Pitch Detection
status: implemented
platforms: [web, ios, android]
tests:
  unit:
    - packages/audio/src/tuner/pitch-detector.test.ts
    - packages/audio/src/tuner/tuner-engine.test.ts
  e2eWeb: []
  e2eDevice: []
criticalPaths:
  - packages/audio/src/tuner/pitch-detector.ts
  - packages/audio/src/tuner/tuner-engine.ts
  - packages/audio/src/tuner/tuner-engine.types.ts
  - apps/web/services/audio/tuner-audio.service.ts
  - apps/web/hooks/use-tuner.ts
  - apps/web/hooks/use-tuner-signal-state.ts
  - apps/web/hooks/use-tuner-detection-settings.ts
  - apps/web/components/tuner/tuner-display.component.tsx
  - apps/web/components/tuner/needle-gauge.component.tsx
  - apps/web/components/tuner/circular-dial.component.tsx
  - packages/shared/src/utils/frequency.util.ts
  - packages/shared/src/constants/tuner.constants.ts
manualChecks:
  - 마이크 입력에서 정확한 주파수 감지
  - 센트 편차 표시 정확성
  - 저신호/무신호 시 적절한 UI 상태
  - A4=440Hz 기준 튜닝 정확도
---

# Tuner Pitch Detection

마이크 입력에서 실시간 피치를 감지하는 튜너 엔진.

## Architecture

- `PitchDetector` — autocorrelation 기반 주파수 추출
- `TunerEngine` — 감지 루프 + 노트 매핑
- `tuner-audio.service` — Web Audio AnalyserNode 바인딩
- `use-tuner` hook — React 상태 관리
- `frequency.util` — Hz → 노트/센트 변환
