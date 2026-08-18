---
id: audio-input-session
name: Audio Input Session
status: implemented
platforms: [web, ios, android]
tests:
  unit:
    - packages/audio-input/src/facade/audio-input-bridge.test.ts
    - packages/audio-input/src/state/audio-input-session.store.test.ts
    - apps/web/services/audio-input/web-audio-input.adapter.test.ts
    - apps/web/services/audio-input/native-bridge-audio-input.adapter.test.ts
  e2eWeb:
    - apps/web/e2e/tuner-audio-input.spec.ts
  e2eDevice:
    - apps/mobile/appium/specs/tuner-permission.smoke.spec.ts
criticalPaths:
  - packages/audio-input/src
  - apps/web/services/audio-input
  - apps/web/services/audio/live-input-audio.service.ts
  - apps/mobile/ios/TempoTune/AudioInputModule.swift
  - apps/mobile/android/app/src/main/java/com/tempotune/AudioInputModule.kt
manualChecks:
  - 권한 거부 후 다시 시도할 때 상태 복구
  - 입력 장치 분리 시 route 변경과 오류 표시
---

# Audio Input Session

튜너와 박자 연습이 공유하는 단일 마이크 capture session입니다. 권한, 장치 선택, pitch/rhythm analyzer 설정, route 변경을 같은 bridge contract로 처리합니다.

상태는 `idle`, `starting`, `running`, `error`로 제한합니다. 웹은 `getUserMedia`와 `AnalyserNode`, iOS는 `AVAudioEngine`, Android는 `AudioRecord`를 사용합니다. pitch와 rhythm이 동시에 capture 장치를 중복 점유하지 않는 것이 인수 조건입니다.
