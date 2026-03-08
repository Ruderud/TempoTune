---
id: metronome-bpm-control
name: Metronome BPM Control
status: implemented
platforms: [web, ios, android]
tests:
  unit:
    - packages/audio/src/metronome/metronome-engine.test.ts
  e2eWeb: []
  e2eDevice: []
criticalPaths:
  - apps/web/components/metronome/metronome-control.component.tsx
  - apps/web/hooks/use-metronome.ts
  - packages/audio/src/metronome/metronome-engine.ts
  - packages/shared/src/constants/metronome.constants.ts
  - packages/shared/src/utils/math.util.ts
manualChecks:
  - BPM 슬라이더 드래그 시 실시간 반영
  - +/- 버튼으로 1 BPM 단위 조절
  - 범위 제한 (30-300 BPM) 동작 확인
  - 재생 중 BPM 변경 시 글리치 없이 전환
---

# Metronome BPM Control

BPM 30~300 범위의 슬라이더 + 증감 버튼 UI. 재생 중에도 실시간 BPM 변경 지원.

## Controls

- Range slider (30-300)
- +/- increment buttons
- `clamp()` util로 범위 제한
- 재생 중 변경 시 다음 비트부터 새 BPM 적용
