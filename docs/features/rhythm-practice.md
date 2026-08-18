---
id: rhythm-practice
name: Rhythm Practice
status: implemented
platforms: [web, ios, android]
tests:
  unit:
    - packages/audio/src/rhythm/rhythm-engine.test.ts
  e2eWeb: []
  e2eDevice:
    - apps/mobile/appium/specs/rhythm-audio-sample.smoke.spec.ts
criticalPaths:
  - packages/audio/src/rhythm
  - apps/web/hooks/use-rhythm-practice.ts
  - apps/web/app/(tabs)/rhythm/page.tsx
  - apps/mobile/ios/TempoTune/AudioInputModule.swift
  - apps/mobile/android/app/src/main/java/com/tempotune/AudioInputModule.kt
manualChecks:
  - 여러 세기의 박수와 악기 attack에서 onset 누락·중복 여부
  - 입력 지연 보정값 변경 후 판정 경계
---

# Rhythm Practice

마이크 onset을 가장 가까운 메트로놈 beat와 비교해 `early`, `on-time`, `late`로 분류하고 offset과 통계를 표시합니다. 무음, refractory 구간의 중복 onset, 메트로놈 정지 상태는 hit로 기록하지 않습니다.

자동화는 on-time과 35ms late 합성 pulse를 검증합니다. 실제 공간의 반향과 Bluetooth 지연은 별도 기기 검증 항목입니다.
