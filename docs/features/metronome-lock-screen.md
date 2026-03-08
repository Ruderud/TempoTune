---
id: metronome-lock-screen
name: Metronome Lock Screen Controls
status: implemented
platforms: [ios, android]
tests:
  unit: []
  e2eWeb: []
  e2eDevice: []
criticalPaths:
  - apps/mobile/ios/TempoTune/MetronomeModule.swift
  - apps/mobile/ios/Shared/MetronomeSharedState.swift
  - apps/mobile/ios/Shared/MetronomeActivityAttributes.swift
  - apps/mobile/ios/MetronomeWidgetExtension/MetronomeLiveActivity.swift
  - apps/mobile/ios/MetronomeWidgetExtension/MetronomeWidgetBundle.swift
  - apps/mobile/ios/Shared/MetronomeAppIntents.swift
  - apps/mobile/android/app/src/main/java/com/tempotune/MetronomeForegroundService.kt
  - apps/mobile/android/app/src/main/java/com/tempotune/MetronomeNotificationManager.kt
  - apps/mobile/android/app/src/main/java/com/tempotune/MetronomeMediaSessionManager.kt
  - apps/mobile/android/app/src/main/java/com/tempotune/MetronomeActionReceiver.kt
  - apps/mobile/android/app/src/main/java/com/tempotune/MetronomeState.kt
  - apps/mobile/android/app/src/main/java/com/tempotune/MetronomeWidgetProvider.kt
manualChecks:
  - 잠금화면에서 재생/정지 제어 동작 (iOS Live Activity)
  - Android 알림바 미디어 컨트롤 동작
  - Android 홈 위젯에서 BPM 표시 및 제어
  - 앱 백그라운드 전환 시 재생 지속
---

# Metronome Lock Screen Controls

잠금화면/알림바에서 메트로놈을 제어하는 네이티브 기능.

## iOS

- Live Activity + Dynamic Island (ActivityKit)
- MetronomeSharedState로 App Group 데이터 공유
- AppIntents 기반 제어 액션

## Android

- Foreground Service + MediaSession
- 알림바 미디어 컨트롤 (play/pause/BPM)
- 홈 화면 위젯 (AppWidgetProvider)
