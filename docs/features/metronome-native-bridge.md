---
id: metronome-native-bridge
name: Metronome Native Bridge
status: implemented
platforms: [ios, android]
tests:
  unit:
    - apps/mobile/src/bridge/__tests__/bridge-handler.test.ts
  e2eWeb: []
  e2eDevice: []
criticalPaths:
  - apps/mobile/src/bridge/metronome-bridge.impl.ts
  - apps/mobile/src/bridge/bridge-handler.service.ts
  - apps/mobile/src/services/native-metronome.service.ts
  - apps/mobile/src/services/native-audio.service.ts
  - apps/mobile/ios/TempoTune/MetronomeModule.swift
  - apps/mobile/android/app/src/main/java/com/tempotune/MetronomeModule.kt
  - packages/shared/src/bridge/metronome-bridge.interface.ts
  - packages/shared/src/bridge/native-bridge.types.ts
  - apps/web/services/audio/native-metronome-bridge.ts
manualChecks:
  - WebView에서 native 메트로놈 시작/정지 동작
  - bridge 메시지 JSON 직렬화/역직렬화 정확성
  - 네이티브 오디오 세션 관리 (다른 앱 재생 중)
---

# Metronome Native Bridge

WebView ↔ Native 간 메트로놈 제어 브릿지. iOS(Swift), Android(Kotlin) 네이티브 모듈 경유.

## Architecture

- `MetronomeBridgeImpl` — JS 측 브릿지 구현
- `bridge-handler.service` — WebView postMessage 라우팅
- iOS `MetronomeModule.swift` — AVAudioEngine 기반
- Android `MetronomeModule.kt` — AudioTrack 기반
