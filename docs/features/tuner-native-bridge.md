---
id: tuner-native-bridge
name: Tuner Native Bridge
status: implemented
platforms: [ios, android]
tests:
  unit:
    - apps/mobile/src/bridge/__tests__/bridge-handler.test.ts
  e2eWeb: []
  e2eDevice: []
criticalPaths:
  - apps/mobile/src/bridge/audio-bridge.impl.ts
  - apps/mobile/src/bridge/bridge-handler.service.ts
  - apps/mobile/src/services/native-audio.service.ts
  - apps/mobile/src/services/permission.service.ts
  - apps/mobile/ios/TempoTune/PitchDetectorModule.swift
  - apps/mobile/android/app/src/main/java/com/tempotune/PitchDetectorModule.kt
  - packages/shared/src/bridge/audio-bridge.interface.ts
  - packages/shared/src/bridge/audio-bridge.types.ts
manualChecks:
  - 네이티브 마이크 권한 요청 플로우
  - WebView에서 네이티브 피치 감지 시작/정지
  - 네이티브 → WebView 실시간 주파수 데이터 전달
  - iOS/Android 각 플랫폼 마이크 세션 관리
---

# Tuner Native Bridge

모바일에서 네이티브 마이크 접근을 위한 WebView ↔ Native 브릿지.

## Architecture

- `AudioBridgeImpl` — JS 측 오디오 브릿지 구현
- iOS `PitchDetectorModule.swift` — AVAudioEngine + tap
- Android `PitchDetectorModule.kt` — AudioRecord 기반
- `permission.service` — 마이크 권한 요청/관리
