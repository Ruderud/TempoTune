---
id: tuner-instrument-presets
name: Tuner Instrument Presets
status: implemented
platforms: [web, ios, android]
tests:
  unit:
    - packages/audio/src/tuner/tuning-presets.test.ts
  e2eWeb: []
  e2eDevice: []
criticalPaths:
  - packages/audio/src/tuner/tuning-presets.ts
  - apps/web/components/tuner/tuner-control.component.tsx
  - apps/web/components/tuner/instrument-selector.component.tsx
  - apps/web/hooks/use-tuner.ts
  - packages/shared/src/types/tuner.types.ts
  - packages/shared/src/constants/tuner.constants.ts
manualChecks:
  - 프리셋 드롭다운에서 기타/베이스 선택 가능
  - Standard, Drop D 등 다양한 튜닝 프리셋
  - 프리셋 변경 시 타겟 노트 즉시 업데이트
  - Auto/Manual 모드 전환 동작
---

# Tuner Instrument Presets

기타/베이스용 튜닝 프리셋. Standard, Drop D 등 지원.

## Supported Presets

- Guitar Standard (E A D G B E)
- Guitar Drop D (D A D G B E)
- Bass Standard (E A D G)
- Bass Drop D (D A D G)

## Modes

- **Auto** — 감지된 주파수에 가장 가까운 타겟 노트 자동 선택
- **Manual** — 사용자가 헤드스톡 UI에서 줄 선택
