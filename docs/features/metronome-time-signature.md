---
id: metronome-time-signature
name: Metronome Time Signature
status: implemented
platforms: [web, ios, android]
tests:
  unit:
    - packages/audio/src/metronome/metronome-engine.test.ts
  e2eWeb: []
  e2eDevice: []
criticalPaths:
  - apps/web/components/metronome/metronome-control.component.tsx
  - packages/audio/src/metronome/metronome-engine.ts
  - packages/audio/src/metronome/metronome-engine.types.ts
  - packages/shared/src/types/metronome.types.ts
manualChecks:
  - 2/4, 3/4, 4/4, 6/8 칩 선택 시 즉시 반영
  - 재생 중 박자 변경 시 다음 마디부터 적용
  - 강박/약박 사운드 구분 확인
---

# Metronome Time Signature

2/4, 3/4, 4/4, 6/8 프리셋 지원. 칩 UI로 선택.

## Supported Signatures

- 2/4 — 마치
- 3/4 — 왈츠
- 4/4 — 기본 (default)
- 6/8 — 복합 박자
