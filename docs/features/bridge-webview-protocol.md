---
id: bridge-webview-protocol
name: WebView Bridge Protocol
status: implemented
platforms: [ios, android]
tests:
  unit:
    - apps/mobile/src/bridge/__tests__/bridge-handler.test.ts
    - apps/web/services/bridge/__tests__/audio-bridge.client.test.ts
  e2eWeb: []
  e2eDevice: []
criticalPaths:
  - packages/shared/src/bridge/native-bridge.types.ts
  - packages/shared/src/bridge/audio-bridge.interface.ts
  - packages/shared/src/bridge/audio-bridge.types.ts
  - packages/shared/src/bridge/metronome-bridge.interface.ts
  - apps/mobile/src/bridge/bridge-handler.service.ts
  - apps/mobile/src/bridge/index.ts
  - apps/web/services/bridge/bridge-adapter.ts
  - apps/web/services/bridge/audio-bridge.client.ts
  - packages/shared/src/types/bridge.types.ts
manualChecks:
  - Web ↔ Native 메시지 라운드트립 정상 동작
  - JSON 직렬화 에지케이스 (특수문자, 큰 페이로드)
  - bridge 미사용 환경 (순수 웹) fallback 동작
---

# WebView Bridge Protocol

React Native WebView와 Web 앱 간 양방향 통신 프로토콜.

## Message Flow

1. Web → Native: `window.ReactNativeWebView.postMessage(JSON)`
2. Native → Web: `webView.evaluateJavaScript` / `injectJavaScript`
3. `bridge-handler.service` — 메시지 라우팅 + 핸들러 디스패치
4. `bridge-adapter` — Web 측 환경 감지 + native/web 분기
