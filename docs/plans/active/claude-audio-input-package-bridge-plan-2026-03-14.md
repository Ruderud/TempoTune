# Claude Handoff Plan (Audio Input Package + Platform Bridge Split)

작성일: 2026-03-14  
대상 범위:
- `packages/shared`
- `packages/audio`
- `packages/audio-input` 신규
- `apps/web`
- `apps/mobile`

## 1. 목적

이 문서는 오디오 입력 구조를 `앱 훅/서비스 중심 임시 연결`에서 `패키지 facade + 플랫폼 adapter` 구조로 재정렬하기 위한 구현 계획이다.

핵심 목표는 아래 4가지다.

1. 웹브라우저, iOS, Android가 같은 상위 오디오 입력 API를 사용하게 만든다.
2. 앱 레이어에는 `브리지 API`만 노출하고, 입력 세션 소유권은 패키지 facade가 갖게 만든다.
3. 플랫폼별 차이는 app 레이어 adapter로 격리하고, 분석 로직은 패키지에서 재사용한다.
4. 현재 섞여 있는 `bridge`, `local service`, `hook`, `native module` 책임을 분리한다.

## 2. 이 문서의 역할

- 기존 [claude-audio-input-infra-handoff-plan-2026-03-14.md](./claude-audio-input-infra-handoff-plan-2026-03-14.md)는 `공용 입력 인프라`의 방향성과 Phase를 정의한다.
- 이번 문서는 그 다음 단계로, `패키지 경계`와 `플랫폼 adapter 분리 방식`을 명확히 정의한다.
- 오디오 입력 소유권과 브리지 구조는 이번 문서 기준으로 구현한다.
- 테스트 작업은 [claude-audio-input-package-bridge-test-plan-2026-03-14.md](./claude-audio-input-package-bridge-test-plan-2026-03-14.md)를 따른다.

## 3. 확정할 설계 결정사항

- `packages/audio`는 순수 DSP와 판정 엔진만 가진다.
- `packages/audio-input`를 새로 만들고, 앱이 사용하는 단일 facade API를 여기서 제공한다.
- `packages/audio-input`는 브라우저 API나 React Native native module을 직접 소유하지 않는다.
- `apps/web`는 Web Audio / MediaDevices adapter만 제공한다.
- `apps/mobile`는 native bridge adapter와 iOS/Android native module만 제공한다.
- `useTuner`, `useRhythmPractice`, 향후 metronome rhythm path는 `packages/audio-input` facade만 사용한다.
- 앱 훅에서 `getUserMedia`, `NativeModules`, `AudioRecord`, `AVAudioEngine` 같은 플랫폼 API를 직접 다루지 않는다.
- WebView/native bridge는 플랫폼 구현 세부사항이며, 상위 오디오 입력 API를 대체하지 않는다.

## 4. 현재 구조의 문제

### 4.1 입력 세션 소유권이 여러 군데 흩어져 있음

- 웹 튜너 서비스가 직접 입력을 열고 있다.
- web bridge client도 자체 `LiveInputAudioService`를 만들고 있다.
- `useAudioInput`도 별도 `LiveInputAudioService`를 또 만들고 있다.
- 이 상태에서는 같은 앱 안에서 “공용 입력 세션”이 아니라 “서로 다른 입력 세션 후보들”이 공존한다.

### 4.2 bridge와 local implementation이 한 클래스에 섞여 있음

- 현재 `AudioBridgeClient`는 native bridge client이면서 동시에 web local adapter 역할도 한다.
- 이 구조는 웹브라우저를 1급 플랫폼으로 다루기보다, native bridge의 fallback처럼 취급하게 만든다.

### 4.3 훅이 플랫폼 차이를 직접 알아야 함

- `useTuner` 같은 훅이 `isNativeEnvironment()`를 기준으로 흐름을 나눈다.
- 훅은 기능 상태 관리만 담당해야 하고, 플랫폼 경로 분기는 facade 아래로 내려가야 한다.

### 4.4 플랫폼 계약이 round-trip 기준으로 완전히 잠기지 않음

- 예: `deviceId`는 shared에서는 string이지만, Android 내부는 숫자 id를 기반으로 움직인다.
- 이런 차이는 adapter 내부에서 흡수되어야 하고, 상위 facade나 hook까지 새어나오면 안 된다.

## 5. 목표 계층 구조

```text
packages/shared
  └─ DTO / bridge contracts / shared enums

packages/audio
  └─ pitch / rhythm / metronome timeline / latency math

packages/audio-input
  ├─ AudioInputBridge interface
  ├─ platform-agnostic facade
  ├─ capture session state model
  ├─ analyzer orchestration
  └─ adapter contracts

apps/web
  └─ WebAudioInputAdapter implementation

apps/mobile
  ├─ NativeAudioInputAdapter implementation
  ├─ iOS AudioInputModule
  └─ Android AudioInputModule
```

### 5.1 의존성 규칙

- `apps/*` → `packages/audio-input` → `packages/audio`, `packages/shared`
- `packages/audio-input`는 `packages/audio`와 `packages/shared`만 의존한다.
- `packages/audio-input`는 `window`, `navigator.mediaDevices`, `NativeModules`를 직접 import하지 않는다.
- 플랫폼 adapter는 app 레이어에서만 구현한다.

## 6. 패키지별 책임

### 6.1 `packages/shared`

유지:
- `AudioInputDevice`
- `AudioCaptureConfig`
- `AudioSessionState`
- `PitchDetectionEvent`
- `RhythmHitEvent`
- bridge message DTO

역할:
- 앱/패키지/플랫폼 간 공유되는 데이터 계약만 담당

### 6.2 `packages/audio`

유지/확장:
- `TunerEngine`
- `RhythmEngine`
- `OnsetDetector`
- metronome timeline 계산
- latency 계산 유틸리티

역할:
- 입력 source를 몰라도 되는 순수 분석 로직만 담당

### 6.3 `packages/audio-input` 신규

핵심 역할:
- `AudioInputBridge` facade 제공
- analyzer enable/disable orchestration
- 단일 capture session 수명주기 관리
- 플랫폼 adapter를 감싼 공통 이벤트 API 제공
- web/native 공통 동작 규칙 제공

중요:
- 실제 캡처 구현이 아니라 `추상화 + 조립 + 수명주기 + 이벤트 fan-out`이 중심이다.

### 6.4 `apps/web`

역할:
- `MediaDevices.enumerateDevices`
- `getUserMedia`
- `AudioContext`
- `AnalyserNode` 또는 `AudioWorklet`
- devicechange 구독

즉, `WebAudioInputAdapter` 구현만 제공한다.

### 6.5 `apps/mobile`

역할:
- WebView/native bridge binding
- native module 호출
- iOS/Android route/device enumeration/capture

즉, `NativeAudioInputAdapter` 구현과 native module만 제공한다.

## 7. 공개 API 초안

앱이 최종적으로 의존해야 하는 상위 API는 하나여야 한다.

```ts
export type AudioInputBridge = {
  requestPermission(): Promise<AudioPermissionStatus>;
  getPermissionStatus(): Promise<AudioPermissionStatus>;
  listInputDevices(): Promise<AudioInputDevice[]>;
  getSelectedInputDevice(): Promise<AudioInputDevice | null>;
  selectInputDevice(deviceId: string): Promise<void>;
  startCapture(config: AudioCaptureConfig): Promise<void>;
  stopCapture(): Promise<void>;
  configureAnalyzers(config: AudioAnalyzerConfig): Promise<void>;
  addFrameConsumer?(consumer: AudioFrameConsumer): () => void;
  onSessionStateChanged(callback: (state: AudioSessionState) => void): () => void;
  onPitchDetected(callback: (event: PitchDetectionEvent) => void): () => void;
  onRhythmHitDetected(callback: (event: RhythmHitEvent) => void): () => void;
  onRouteChanged(callback: (devices: AudioInputDevice[]) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  dispose(): void;
};
```

### 7.1 플랫폼 adapter 계약

```ts
export type AudioInputPlatformAdapter = {
  requestPermission(): Promise<AudioPermissionStatus>;
  getPermissionStatus(): Promise<AudioPermissionStatus>;
  listInputDevices(): Promise<AudioInputDevice[]>;
  getSelectedInputDevice(): Promise<AudioInputDevice | null>;
  selectInputDevice(deviceId: string): Promise<void>;
  startCapture(config: AudioCaptureConfig): Promise<void>;
  stopCapture(): Promise<void>;
  setAnalyzerConfig(config: AudioAnalyzerConfig): Promise<void>;
  addFrameConsumer?(consumer: AudioFrameConsumer): () => void;
  onSessionStateChanged(callback: (state: AudioSessionState) => void): () => void;
  onPitchDetected(callback: (event: PitchDetectionEvent) => void): () => void;
  onRhythmHitDetected(callback: (event: RhythmHitEvent) => void): () => void;
  onRouteChanged(callback: (devices: AudioInputDevice[]) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  dispose(): void;
};
```

### 7.2 앱 사용 예시

```ts
const audioInput = createAudioInputBridge(platformAdapter);

await audioInput.startCapture({
  deviceId: 'default',
  channelIndex: 0,
  enablePitch: true,
  enableRhythm: false,
});

audioInput.onPitchDetected((event) => {
  // tuner UI update
});
```

## 8. 제안 파일 구조

### 8.1 `packages/audio-input` 신규

추가:
- `packages/audio-input/package.json`
- `packages/audio-input/project.json`
- `packages/audio-input/tsconfig.json`
- `packages/audio-input/src/index.ts`
- `packages/audio-input/src/contracts/audio-input-bridge.interface.ts`
- `packages/audio-input/src/contracts/audio-input-platform-adapter.interface.ts`
- `packages/audio-input/src/contracts/audio-frame.types.ts`
- `packages/audio-input/src/facade/create-audio-input-bridge.ts`
- `packages/audio-input/src/facade/audio-input-bridge.ts`
- `packages/audio-input/src/state/audio-input-session.store.ts`
- `packages/audio-input/src/state/audio-input-events.ts`
- `packages/audio-input/src/orchestration/analyzer-orchestrator.ts`

### 8.2 `apps/web`

추가:
- `apps/web/services/audio-input/web-audio-input.adapter.ts`
- `apps/web/services/audio-input/web-capture-session.ts`
- `apps/web/services/audio-input/web-device-registry.ts`
- `apps/web/services/audio-input/index.ts`

정리 대상:
- 기존 `audio-bridge.client.ts`의 web local logic 분리
- `live-input-audio.service.ts`는 adapter 내부 구현으로 이동 또는 흡수

### 8.3 `apps/mobile`

추가:
- `apps/mobile/src/services/audio-input/native-audio-input.adapter.ts`
- `apps/mobile/src/services/audio-input/index.ts`

유지/정리:
- `AudioInputModule.swift/.m`
- `AudioInputModule.kt`
- `App.tsx`의 bridge binding은 adapter 초기화/forward 역할만 수행

### 8.4 `apps/web/hooks`, `apps/mobile hooks`

수정:
- `useTuner`
- `useRhythmPractice`
- 향후 `useMetronome` rhythm path

규칙:
- 훅은 `createAudioInputBridge(...)` 결과만 사용한다.
- 훅 안에서 platform detection 분기를 직접 두지 않는다.

## 9. 구현 원칙

### 9.1 브라우저도 1급 플랫폼으로 취급

- web 구현은 native fallback이 아니라 정식 adapter로 만든다.
- `listInputDevices`, `selectInputDevice`, `startCapture`, `stopCapture`, `routeChanged`를 web에서도 같은 의미로 제공한다.
- 웹 단독 실행 시에도 API 표면이 동일해야 한다.

### 9.2 facade는 singleton capture session을 소유

- 같은 앱 컨텍스트 안에서 tuner와 rhythm은 동일 facade 인스턴스를 공유해야 한다.
- facade 밖에서 `LiveInputAudioService`나 native service를 직접 생성하지 않는다.
- `useAudioInput` 같은 hook은 facade를 가져오는 얇은 wrapper가 되어야 한다.

### 9.3 legacy API는 migration 동안만 유지

- `startListening` / `stopListening`은 temporary compat layer로만 남긴다.
- facade 전환이 끝나면 제거한다.

### 9.4 deviceId 계약은 facade 경계에서 string으로 고정

- shared/public contract는 string 유지
- Android numeric id는 adapter 내부에서만 string↔int 변환
- hook이나 facade 밖으로 numeric id가 새어나오면 안 된다

### 9.5 실시간 분석 경로는 facade 아래에서 제어

- pitch는 필요 시 frame consumer 기반
- rhythm은 필요 시 native event 기반 또는 worklet 기반
- analyzer 활성화/비활성화는 `configureAnalyzers` 또는 `startCapture` config로 통일

## 10. 단계별 작업 계획

## Phase A. `packages/audio-input` 뼈대 생성

목표:
- facade와 adapter 계약을 패키지로 끌어올린다.

작업:
- 신규 패키지 생성
- bridge/interface/contracts 정의
- 공통 event fan-out 기본 구조 구현

완료 조건:
- apps가 새 패키지를 import 가능
- platform adapter 없이도 타입 수준 계약이 잠김

권장 커밋:
- `feat(audio-input): add platform-agnostic audio input facade package`

## Phase B. Web adapter 추출

목표:
- web local capture logic를 `AudioBridgeClient`에서 분리한다.

작업:
- `WebAudioInputAdapter` 구현
- 기존 `live-input-audio.service.ts` 흡수 또는 재배치
- `AudioBridgeClient`의 web-specific logic 제거

완료 조건:
- web에서 `listInputDevices`, `startCapture`, `stopCapture`, `routeChanged`가 adapter 경유로 동작
- `AudioBridgeClient`가 web local implementation을 직접 소유하지 않음

권장 커밋:
- `refactor(web): extract web audio input adapter from bridge client`

## Phase C. Native adapter 추출

목표:
- mobile bridge binding과 native module 호출을 adapter로 분리한다.

작업:
- `NativeAudioInputAdapter` 구현
- `App.tsx`에서는 bridge message binding만 유지
- `AudioInputModule`과 adapter 책임 분리

완료 조건:
- mobile에서 facade가 native adapter를 통해 동작
- hooks가 `NativeModules`나 App bridge 세부사항을 몰라도 됨

권장 커밋:
- `refactor(mobile): extract native audio input adapter from app bridge`

## Phase D. Hook 재연결

목표:
- 기능 훅이 facade만 사용하도록 바꾼다.

작업:
- `useTuner`를 facade 기반으로 전환
- `useRhythmPractice`를 facade 기반으로 전환
- `useAudioInput`를 facade wrapper로 단순화

완료 조건:
- hooks 안에서 `isNativeEnvironment()` 분기 제거 가능
- web/mobile 모두 같은 상위 API 경로 사용

권장 커밋:
- `refactor(web): reconnect tuner and rhythm hooks to shared audio input facade`

## Phase E. Bridge 정리와 legacy 제거 준비

목표:
- legacy audio bridge를 축소하고 새 facade를 기준으로 통일한다.

작업:
- `AudioBridgeClient` 역할 재정의 또는 제거
- `startListening` / `stopListening` compat 정리
- 문서/acceptance checklist 업데이트

완료 조건:
- 앱 레이어에 새 facade만 남고, legacy path는 deprecate 상태로 축소

권장 커밋:
- `refactor(audio): consolidate legacy bridge paths under audio input facade`

## 11. Guardrails

- `packages/audio-input` 안에 브라우저 API 직접 import 금지
- `packages/audio-input` 안에 React Native import 금지
- hook에서 플랫폼 분기 금지
- 입력 세션 구현체 중복 생성 금지
- public contract에서 `deviceId` numeric leak 금지
- WebView message shape는 platform adapter 아래에만 위치
- “동작한다”가 아니라 “같은 facade 경로를 탄다”를 완료 기준으로 본다

## 12. Acceptance Checklist

- [ ] `packages/audio-input` 패키지가 생성되고 facade API를 export한다.
- [ ] `useTuner`가 web/mobile 모두 동일 facade API로 시작/정지한다.
- [ ] web capture path가 `WebAudioInputAdapter`를 통해서만 동작한다.
- [ ] mobile capture path가 `NativeAudioInputAdapter`를 통해서만 동작한다.
- [ ] `AudioBridgeClient` 안의 web local implementation이 제거되거나 축소된다.
- [ ] `useAudioInput`가 별도 capture session을 만들지 않고 facade를 재사용한다.
- [ ] `deviceId` public contract가 string으로 고정되고 round-trip이 플랫폼별로 일관된다.
- [ ] web browser 단독 실행에서도 장치 목록, 선택, capture start/stop, route change가 동작한다.
- [ ] rhythm/tuner가 같은 facade 인스턴스를 통해 동일 입력 세션을 재사용할 수 있다.

## 13. 이번 문서 기준 비목표

- 이 문서 범위에서 latency calibration 저장/UI까지 끝내지 않는다.
- 이 문서 범위에서 다채널 레코딩 UI까지 붙이지 않는다.
- 이 문서 범위에서 `AudioWorklet` 최적화까지 완료를 강제하지 않는다.
- 이 문서 범위에서 기존 native module을 즉시 삭제하지 않는다.

## 14. Claude 작업 순서 권장안

1. `packages/audio-input` 패키지부터 만든다.
2. web adapter를 먼저 추출한다.
3. native adapter를 추출한다.
4. `useTuner`와 `useRhythmPractice`를 facade로 옮긴다.
5. 마지막에 legacy bridge 축소와 문서 정리를 한다.

주의:
- 기존 hook에 adapter 로직을 직접 넣지 않는다.
- facade와 hook이 각각 capture session을 만들게 두지 않는다.
- web 경로를 “임시 fallback”으로 취급하지 않는다.

## 15. 작업 완료 후 필수 셀프체크

### 15.1 구조 체크

- 훅이 facade만 사용하고 있는지
- facade가 단일 입력 세션 소유권을 가지는지
- 플랫폼별 구현이 adapter 뒤에 숨겨졌는지
- web과 mobile이 같은 상위 API를 사용하는지

### 15.2 검증 명령

- `pnpm exec nx run-many -t type-check --projects=shared,audio,web,mobile`
- `pnpm exec nx run audio:test`
- web adapter를 건드렸다면:
  - 가능한 경우 web 관련 type-check 또는 실제 장치 열거 smoke 확인
- Android native를 건드렸다면:
  - `./gradlew :app:compileDebugKotlin`
- iOS native를 건드렸다면:
  - 가능한 경우 `xcodebuild` 또는 최소 project registration 재확인

### 15.3 완료 판정 규칙

- `AudioBridgeClient` 안에 web local logic가 그대로 남아 있으면 완료로 보지 않는다.
- `useAudioInput`가 별도 `LiveInputAudioService`를 만들고 있으면 완료로 보지 않는다.
- `useTuner`가 facade 대신 직접 service를 잡고 있으면 완료로 보지 않는다.
- `deviceId`가 플랫폼에 따라 타입이 달라지면 완료로 보지 않는다.

### 15.4 최종 보고 형식

1. facade에 실제로 연결한 기능
2. web adapter / native adapter 분리 상태
3. 단일 입력 세션 재사용 여부
4. 실행한 검증 명령과 결과
5. 남은 legacy path와 다음 작업

## 16. 최신 재검증 메모 (정리 이후)

현재 active 문서 기준 경로는 모두 `docs/plans/active/` 아래를 source of truth로 본다.

다만 최근 재검증 기준으로 아래 Acceptance 항목은 아직 완료로 보면 안 된다.

- `useTuner` web/mobile 동일 facade API 시작/정지
  모바일 bootstrap에서 `setAudioInputBridge(...)` 호출이 아직 없어서, native 환경에서는 `getAudioInputBridge()`가 예외를 던질 수 있다.
- mobile capture path가 `NativeAudioInputAdapter` 경유
  adapter는 구현됐지만, 앱 시작 시 facade singleton에 실제 주입하는 경로가 빠져 있다.
- rhythm/tuner 동일 facade 재사용
  web은 가능하지만, mobile은 `NativeAudioInputAdapter.onRhythmHitDetected()`가 아직 `TODO`이고 frame consumer passthrough도 없다.
- `AudioBridgeClient` web local implementation 축소
  hook은 facade를 쓰기 시작했지만, `AudioBridgeClient` 내부 web local logic과 `LiveInputAudioService`는 아직 남아 있다.
- iOS 경로 완료
  `AudioInputModule`가 `project.pbxproj`에 등록되지 않았으면 완료로 보지 않는다.

### 16.1 다음 작업 우선순위

1. 모바일 entry/bootstrap에서 `createAudioInputBridge(createNativeAudioInputAdapter())`를 만들고 `setAudioInputBridge()`로 주입한다.
2. mobile rhythm path를 명확히 결정한다.
   - native rhythm event를 구현하거나
   - 이번 범위를 web-only로 명시하고 Acceptance를 분리한다.
3. `AudioBridgeClient`의 web local implementation을 축소하거나 제거한다.
4. iOS `AudioInputModule`를 Xcode project에 등록하고 native build 검증을 다시 수행한다.

### 16.2 보고 규칙 보강

- 위 항목이 남아 있으면 “완전 충족”으로 보고하지 않는다.
- web만 충족한 항목은 반드시 `부분 충족`으로 적는다.
- 테스트가 통과해도 bootstrap wiring이 없으면 mobile facade path는 완료로 적지 않는다.
