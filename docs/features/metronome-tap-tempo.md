---
id: metronome-tap-tempo
name: Metronome Tap Tempo
status: implemented
platforms: [web, ios, android]
tests:
  unit: []
  e2eWeb: []
  e2eDevice: []
criticalPaths:
  - apps/web/components/metronome/tap-tempo.component.tsx
  - apps/web/hooks/use-metronome.ts
  - packages/shared/src/constants/metronome.constants.ts
manualChecks:
  - 연속 탭 시 평균 BPM 계산 정확성
  - 3회 이상 탭 후 BPM 업데이트
  - 장시간 미탭 후 리셋 동작
---

# Metronome Tap Tempo

사용자가 리듬에 맞춰 탭하면 평균 간격으로 BPM을 자동 계산.

## Behavior

- 탭 간격의 이동 평균으로 BPM 계산
- 일정 시간 미탭 시 리셋
- 계산된 BPM은 MIN/MAX 범위로 클램핑
