# Claude Test Plan (Audio Input Package + Platform Bridge Split)

작성일: 2026-03-14  
대상 범위:
- `packages/shared`
- `packages/audio`
- `packages/audio-input` 신규
- `apps/web`
- `apps/mobile`

## 1. 목적

이 문서는 `packages/audio-input` facade + 플랫폼 adapter 구조로 재정렬한 뒤, 새 기능이 실제 스펙대로 동작하는지 검증하기 위한 테스트 작업 문서다.

핵심 목표는 아래 4가지다.

1. facade 계층이 단일 입력 세션 ownership을 제대로 가지는지 검증한다.
2. web / iOS / Android가 같은 상위 API 계약을 따르는지 검증한다.
3. tuner / rhythm 경로가 legacy path가 아니라 새 facade 경로를 타는지 검증한다.
4. 새 구조가 브라우저 단독 실행과 모바일 native bridge 환경 모두에서 깨지지 않는지 검증한다.

## 2. 이 문서의 역할

- 구현 순서와 구조 재정렬은 [claude-audio-input-package-bridge-plan-2026-03-14.md](./claude-audio-input-package-bridge-plan-2026-03-14.md)를 따른다.
- 이번 문서는 그 구현에 대해 어떤 테스트 코드를 추가해야 하는지 정의한다.
- 이 문서 기준으로 테스트를 추가한 뒤, 마지막에는 문서 하단 `최종 보고 형식`에 맞춰 결과를 남긴다.

## 3. 테스트 범위

### 3.1 반드시 테스트해야 하는 것

- `packages/audio-input` facade lifecycle
- analyzer orchestration
- session reuse
- web adapter contract
- native adapter contract의 JS 계층
- `useTuner` / `useRhythmPractice`의 facade 연결
- `deviceId` string round-trip
- native error forwarding

### 3.2 이번 문서 범위에서 직접 테스트하지 않아도 되는 것

- 실제 USB 장치 물리 연결 E2E
- 실제 iOS 오디오 엔진 실기기 성능
- 실제 Android `AudioRecord` latency 측정
- latency calibration 저장 UI

위 항목은 수동 검증이나 후속 단계로 남길 수 있지만, 그 이유를 최종 보고에 명시해야 한다.

## 4. 테스트 전략

### 4.1 레이어 분리 원칙

- `packages/shared`
  타입/DTO는 컴파일 타임 검증 위주로 본다.
- `packages/audio`
  순수 엔진은 단위 테스트로 본다.
- `packages/audio-input`
  facade / store / orchestrator는 단위 테스트와 contract 테스트를 추가한다.
- `apps/web`
  web adapter와 hook 연결은 mock 기반 통합 테스트를 추가한다.
- `apps/mobile`
  JS adapter와 bridge message forwarding은 mock 기반 테스트를 추가한다.

### 4.2 테스트 우선순위

1. facade가 session을 하나만 소유하는지
2. hook들이 facade만 쓰는지
3. web adapter가 browser 단독 환경에서 같은 API를 제공하는지
4. native adapter가 bridge message를 shared contract로 변환하는지
5. error / route / session event가 빠짐없이 전달되는지

## 5. 레이어별 테스트 작업

## 5.1 `packages/audio-input`

추가 대상 예시:
- `packages/audio-input/src/facade/audio-input-bridge.test.ts`
- `packages/audio-input/src/orchestration/analyzer-orchestrator.test.ts`
- `packages/audio-input/src/state/audio-input-session.store.test.ts`

반드시 커버할 시나리오:
- `startCapture()`를 두 번 호출해도 중복 세션이 생기지 않음
- `stopCapture()`가 active session을 정리함
- `configureAnalyzers()`가 adapter에 올바른 config를 전달함
- `onSessionStateChanged` / `onPitchDetected` / `onRhythmHitDetected` / `onRouteChanged` / `onError`가 facade를 통해 fan-out 됨
- `selectInputDevice(deviceId: string)`가 public contract에서 string만 사용함
- `dispose()` 후 구독이 정리됨

권장 방식:
- fake `AudioInputPlatformAdapter`를 만들어 contract 테스트 작성
- “몇 번 호출됐는가”와 “어떤 payload가 전달됐는가”를 함께 검증

## 5.2 `apps/web`

추가 대상 예시:
- `apps/web/services/audio-input/web-audio-input.adapter.test.ts`
- `apps/web/hooks/use-audio-input.test.ts`
- `apps/web/hooks/use-tuner.test.ts`
- `apps/web/hooks/use-rhythm-practice.test.ts`

반드시 커버할 시나리오:
- `listInputDevices()`가 web device registry 결과를 contract shape으로 반환
- `selectInputDevice()` 후 다음 `startCapture()`가 선택된 `deviceId`를 사용
- `startCapture()` / `stopCapture()`가 단일 `WebAudioInputAdapter` 경로를 탐
- `useAudioInput`가 별도 세션을 새로 만들지 않고 facade 인스턴스를 재사용
- `useTuner`가 legacy service 직접 호출 없이 facade 경로로 동작
- `useRhythmPractice`가 facade의 frame/event 경로를 재사용 가능
- web `devicechange`가 `onRouteChanged`로 전달

권장 방식:
- `navigator.mediaDevices`
- `getUserMedia`
- `enumerateDevices`
- `AudioContext`

위 API는 mock/stub 처리하고, 브라우저 기능 자체보다 adapter contract를 본다.

## 5.3 `apps/mobile`

추가 대상 예시:
- `apps/mobile/src/services/audio-input/native-audio-input.adapter.test.ts`
- `apps/mobile/src/App.test.tsx` 또는 bridge forwarding 테스트 파일

반드시 커버할 시나리오:
- `listInputDevices()`가 native bridge payload를 shared `AudioInputDevice` 배열로 변환
- `selectInputDevice()`가 string `deviceId`를 유지한 채 bridge/native 호출을 수행
- `startCapture()` / `stopCapture()`가 native adapter 경유로 호출
- native `ERROR` envelope가 web layer / facade `onError`로 전달
- native `SESSION_STATE_CHANGED`, `PITCH_DETECTED`, `RHYTHM_HIT_DETECTED`, `ROUTE_CHANGED`가 누락 없이 전달
- Android numeric internal id가 public contract string으로 round-trip 됨

권장 방식:
- `window.ReactNativeWebView`
- message event listener
- native service abstraction

위 요소를 mock 처리해서 JS 계층의 contract 변환과 forwarding만 본다.

## 5.4 `packages/audio`

기존 테스트가 있더라도 아래 시나리오가 비어 있으면 추가:
- rhythm event에 `offsetMs` / `status` / `confidence`가 올바르게 계산됨
- monotonic timeline 비교가 wall clock 없이 동작함
- analyzer enable/disable 조합이 facade에서 기대하는 입력 형태와 맞음

주의:
- 이번 문서의 핵심은 `입력 인프라` 테스트이므로, 여기서는 새 facade와 맞닿는 경계만 보강하면 된다.

## 6. 테스트 더블 규칙

- fake adapter는 최소 구현만 두고, 실제 플랫폼 API를 직접 import하지 않는다.
- `MediaDevices`, `AudioContext`, `window.ReactNativeWebView`, native bridge는 전부 mock/stub 처리한다.
- 테스트에서 legacy path를 몰래 타지 않도록 직접 import 여부도 확인한다.

예:
- `useTuner` 테스트에서 legacy `startListening` spy가 호출되지 않아야 함
- `useAudioInput` 테스트에서 `new LiveInputAudioService()` 같은 중복 생성이 없어야 함

## 7. 금지사항

- 실제 마이크 권한 팝업에 의존하는 테스트 작성 금지
- 실제 USB 장치를 연결해야만 통과하는 테스트 작성 금지
- native 실기기 없이는 못 도는 테스트를 기본 CI 경로에 넣지 않기
- “동작하는 것 같음” 수준의 snapshot-only 테스트로 끝내지 않기

## 8. 최소 Acceptance Checklist

- [ ] `packages/audio-input` facade 단위 테스트가 추가됐다.
- [ ] facade가 단일 입력 세션을 재사용하는 테스트가 있다.
- [ ] web adapter contract 테스트가 추가됐다.
- [ ] `useTuner`가 facade 경로를 타는 테스트가 있다.
- [ ] `useRhythmPractice`가 facade 재사용 경로를 타는 테스트가 있다.
- [ ] mobile native adapter contract 테스트가 추가됐다.
- [ ] native error forwarding 테스트가 있다.
- [ ] `deviceId` string round-trip 테스트가 있다.
- [ ] 기존 legacy path를 호출하지 않는 회귀 테스트가 있다.

## 9. 권장 검증 명령

- `pnpm exec nx run-many -t type-check --projects=shared,audio,web,mobile`
- `pnpm exec nx run audio:test`
- `pnpm exec vitest run packages/audio-input`
- `pnpm exec vitest run apps/web`
- `pnpm exec vitest run apps/mobile`
- Android native 변경이 있다면:
  - `./gradlew :app:compileDebugKotlin`

프로젝트 설정상 직접 패키지 경로 실행이 안 되면, 실제 workspace 스크립트 기준으로 대체하고 그 이유를 보고에 적는다.

## 10. 수동 스모크 체크

자동 테스트만으로 부족한 항목은 최소 아래를 수동 확인:

1. 웹브라우저 단독 실행에서 입력 장치 목록이 보이는지
2. 웹브라우저에서 장치 선택 후 tuner 시작이 되는지
3. 모바일에서 native bridge 오류가 UI까지 노출되는지
4. 동일 세션에서 tuner와 rhythm이 연속 사용 가능한지

## 11. 작업 완료 후 필수 셀프체크

### 11.1 테스트 코드 자체 체크

- 테스트가 새 facade 구조를 기준으로 작성됐는지
- 테스트가 legacy path에 종속되지 않는지
- fake adapter가 public contract를 정확히 모사하는지
- web / mobile 테스트가 각자 adapter 경계만 검증하는지

### 11.2 스펙 대조 체크

- [claude-audio-input-package-bridge-plan-2026-03-14.md](./claude-audio-input-package-bridge-plan-2026-03-14.md)의 Acceptance Checklist 항목을 테스트가 실제로 커버하는지 다시 확인
- 커버하지 못한 항목이 있으면 “미충족”으로 명시
- 테스트가 통과해도 구조가 문서와 다르면 완료로 보지 않음

## 12. 최종 보고 형식

1. 어떤 테스트 파일을 추가/수정했는지
2. 어떤 스펙 항목을 테스트로 보장하는지
3. 어떤 명령을 실행했고 무엇이 통과/실패했는지
4. 자동화하지 못한 수동 검증 항목이 무엇인지
5. 아직 미충족인 스펙과 다음 테스트 작업이 무엇인지

## 13. 최신 테스트 상태 메모 (정리 이후)

최근 재검증에서 실제로 확인된 자동 검증은 아래까지다.

- `packages/audio-input` 테스트: 18/18 통과
- `apps/web/services/audio-input/web-audio-input.adapter.test.ts`: 11/11 통과
- `packages/audio` rhythm engine 테스트: 14/14 통과
- `packages/shared`, `packages/audio`, `packages/audio-input`, `apps/web` type-check 통과
- Android `./gradlew :app:compileDebugKotlin` 통과

아래 항목은 아직 테스트 완료로 보면 안 된다.

- `useTuner` hook 테스트
- `useRhythmPractice` hook 테스트
- `NativeAudioInputAdapter` contract 테스트
- native error forwarding의 adapter/facade 레벨 테스트
- Android/iOS 실경로 기준 `deviceId` round-trip 테스트
- mobile bootstrap에서 `setAudioInputBridge()`가 실제로 호출되는지 검증하는 테스트

### 13.1 보고 시 주의사항

- `BridgeHandler` 테스트만으로 native adapter contract 충족이라고 쓰면 안 된다.
- facade에서 string을 adapter로 넘기는 테스트만으로 platform round-trip 충족이라고 쓰면 안 된다.
- hook 테스트가 없으면 `legacy path를 호출하지 않는 회귀 테스트`도 미충족으로 남긴다.
- mobile bootstrap wiring 검증이 없으면 `mobile facade path 테스트 완료`로 보고하지 않는다.
