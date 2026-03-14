# Claude Handoff Plan (Shared Audio Input Infrastructure + Mobile USB)

작성일: 2026-03-14  
대상 범위:
- `packages/shared`
- `packages/audio`
- `apps/web/services/audio`
- `apps/web/hooks`
- `apps/mobile/src`
- `apps/mobile/ios/TempoTune`
- `apps/mobile/android/app/src/main/java/com/tempotune`

후속 구조 문서:
- `docs/plans/active/claude-audio-input-package-bridge-plan-2026-03-14.md`

## 1. 목적

이 문서는 Claude가 바로 구현 작업을 시작할 수 있도록, TempoTune의 오디오 입력 구조를 `튜너 중심 임시 구조`에서 `공용 오디오 입력 인프라`로 전환하는 실행 계획을 제공한다.

이번 계획의 핵심 목표는 아래 4가지다.

1. 모바일에서 USB 오디오 인터페이스 입력을 `네이티브 브리지`를 통해 관리한다.
2. 튜너와 메트로놈 박자 연습이 동일한 입력 세션을 공유하도록 구조를 바꾼다.
3. 입력 캡처와 분석기를 분리해서, 피치 검출과 리듬 판정을 독립적으로 확장 가능하게 만든다.
4. 박자 판정 정확도를 위해 메트로놈 tick과 입력 onset 비교를 `monotonic clock` 기준으로 통일한다.

## 2. 이번 턴에서 확정된 결정사항

- 모바일 오디오 입력 장치 관리 책임은 WebView가 아니라 `native bridge + native module`이 가진다.
- 공용 오디오 입력 인프라를 먼저 만들고, 그 위에 튜너/리듬 기능을 재연결한다.
- `공용`의 의미는 `공통 계약, 공통 상태, 공통 입력 세션 수명주기`를 뜻한다.
- 모바일에서 raw PCM을 WebView bridge로 밀어 넣지 않는다.
- 모바일은 캡처와 주요 분석을 native에서 처리하고, WebView에는 구조화된 이벤트만 보낸다.
- 웹은 기존처럼 JS/Web Audio 기반 분석을 유지하되, API와 상태 모델은 모바일과 동일한 형태로 맞춘다.
- 박자 판정과 메트로놈 비교에는 `Date.now()` / `System.currentTimeMillis()` 같은 wall clock을 쓰지 않는다.

## 3. 현재 구조의 문제점

### 3.1 입력 세션이 기능별로 분리되어 있음

- 웹 튜너는 [apps/web/services/audio/tuner-audio.service.ts](/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/services/audio/tuner-audio.service.ts)에서 직접 `getUserMedia`를 열고 자체 루프를 돌린다.
- 모바일은 [apps/mobile/src/services/native-audio.service.ts](/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/src/services/native-audio.service.ts)와 `PitchDetectorModule`이 피치 검출 중심으로 고정되어 있다.
- 이 구조에서는 나중에 리듬 체크가 같은 입력을 재사용하지 못하고, 기능별로 마이크/입력을 따로 열 가능성이 높다.

### 3.2 브리지 계약이 너무 좁음

- 현재 [packages/shared/src/bridge/audio-bridge.interface.ts](/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/packages/shared/src/bridge/audio-bridge.interface.ts)는 권한, 시작/중지, pitch event 정도만 다룬다.
- 입력 장치 열거, USB 인터페이스 선택, 채널 선택, 세션 상태, analyzer 설정 같은 개념이 없다.

### 3.3 메트로놈 timestamp 기준이 플랫폼마다 다름

- 웹 메트로놈은 `performance.now()` 기반 스케줄링을 갖고 있다.
- 모바일 메트로놈은 iOS/Android 모두 wall clock timestamp를 emit한다.
- 리듬 판정은 `입력 onset 시점`과 `기대 박 시점`을 직접 비교해야 하므로, 서로 다른 clock를 쓰면 오차가 커진다.

### 3.4 네이티브 USB 입력 장치 제어 포인트가 없음

- iOS/Android 모두 현재는 단순 마이크 녹음만 전제하고 있다.
- USB 장치 연결/해제, 장치 타입 구분, preferred input 선택, channel 선택, latency 보정 경로가 없다.

## 4. 목표 아키텍처

```text
Shared Contracts
  ├─ AudioInputDevice / AudioCaptureConfig / AudioSessionState
  ├─ PitchDetectionEvent / RhythmHitEvent
  └─ Audio bridge message types and interfaces

Platform Capture Layer
  ├─ WebInputProvider + WebCaptureSession
  └─ NativeAudioInputModule + NativeCaptureSession

Analyzer Pipeline
  ├─ TunerAnalyzer
  ├─ RhythmAnalyzer
  └─ LevelMeterAnalyzer

Feature Consumers
  ├─ useTuner
  ├─ useMetronome
  └─ rhythm practice hook/UI
```

### 4.1 책임 분리

- `AudioInputProvider`
  입력 장치 목록, 선택, 연결 상태, 캡처 시작/정지 책임.
- `CaptureSession`
  실제 오디오 스트림 1개를 열고 유지하는 책임.
- `AnalyzerPipeline`
  같은 입력 세션을 여러 분석기가 동시에 소비하도록 하는 책임.
- `MetronomeTimeline`
  현재 BPM/박자표 기준 기대 beat 시각을 monotonic clock으로 제공하는 책임.
- `LatencyCalibration`
  장치별 입력 지연 보정값 저장 책임.

### 4.2 모바일에서의 중요한 원칙

- USB 지원은 `PitchDetectorModule`의 확장이 아니라, 더 일반화된 `AudioInputModule`로 옮긴다.
- 모바일에서 PCM frame을 JS bridge로 반복 전송하지 않는다.
- 모바일 analyzer 결과는 `PITCH_DETECTED`, `RHYTHM_HIT_DETECTED`, `AUDIO_INPUT_STATE_CHANGED` 같은 이벤트로 전달한다.
- 메트로놈 timeline과 입력 onset timestamp는 같은 native monotonic source로 맞춘다.

## 5. 설계 원칙과 Guardrails

- 기존 튜너 기능은 단계별 마이그레이션 동안 계속 동작해야 한다.
- 첫 구현부터 `장치 선택` 개념을 넣되, UI 노출은 뒤로 미뤄도 된다.
- 한 시점에 활성 입력 세션은 하나만 유지한다.
- 기본 채널은 mono 1ch로 시작하되, 타입은 multi-channel을 수용하도록 설계한다.
- rhythm accuracy가 필요한 경로는 Bluetooth를 정식 timing-safe 대상으로 보지 않는다.
- 장치가 분리되면 세션 종료보다 먼저 `route changed` 이벤트를 보낸다.
- wall clock timestamp는 로깅/디버깅에서만 쓰고 판정에는 쓰지 않는다.
- `START_LISTENING` / `STOP_LISTENING`는 마이그레이션 동안 유지하되, 최종적으로는 `START_AUDIO_CAPTURE` / `STOP_AUDIO_CAPTURE`로 통합한다.

## 6. 제안 파일 구조

### 6.1 `packages/shared`

추가:
- `packages/shared/src/types/audio-input.types.ts`
- `packages/shared/src/types/rhythm.types.ts`
- `packages/shared/src/bridge/audio-input-bridge.types.ts`

수정:
- `packages/shared/src/types/audio.types.ts`
- `packages/shared/src/types/bridge.types.ts`
- `packages/shared/src/bridge/audio-bridge.interface.ts`
- `packages/shared/src/index.ts`

### 6.2 `packages/audio`

추가:
- `packages/audio/src/input/audio-frame.types.ts`
- `packages/audio/src/input/analyzer.types.ts`
- `packages/audio/src/input/index.ts`
- `packages/audio/src/rhythm/rhythm-engine.types.ts`
- `packages/audio/src/rhythm/onset-detector.ts`
- `packages/audio/src/rhythm/rhythm-engine.ts`
- `packages/audio/src/rhythm/index.ts`

수정:
- `packages/audio/src/index.ts`
- 필요 시 `packages/audio/src/tuner/index.ts`

### 6.3 `apps/web`

추가:
- `apps/web/services/audio/live-input-audio.service.ts`
- `apps/web/services/audio/web-audio-input.service.ts`
- `apps/web/hooks/use-audio-input.ts`
- `apps/web/hooks/use-rhythm-practice.ts`

수정:
- `apps/web/services/audio/tuner-audio.service.ts`
- `apps/web/services/bridge/audio-bridge.client.ts`
- `apps/web/hooks/use-tuner.ts`
- `apps/web/hooks/use-metronome.ts`

### 6.4 `apps/mobile/src`

추가:
- `apps/mobile/src/services/native-audio-input.service.ts`

수정:
- `apps/mobile/src/App.tsx`
- `apps/mobile/src/bridge/audio-bridge.impl.ts`
- 필요 시 `apps/mobile/src/services/native-audio.service.ts`는 deprecate 처리 후 제거

### 6.5 iOS

추가:
- `apps/mobile/ios/TempoTune/AudioInputModule.swift`
- `apps/mobile/ios/TempoTune/AudioInputModule.m`
- 필요 시 `apps/mobile/ios/TempoTune/AudioInputManager.swift`

수정:
- `apps/mobile/ios/TempoTune/MetronomeModule.swift`
- `apps/mobile/ios/TempoTune/PitchDetectorModule.swift`
- `apps/mobile/ios/TempoTune.xcodeproj/project.pbxproj`

### 6.6 Android

추가:
- `apps/mobile/android/app/src/main/java/com/tempotune/AudioInputModule.kt`
- 필요 시 `apps/mobile/android/app/src/main/java/com/tempotune/AudioInputManager.kt`

수정:
- `apps/mobile/android/app/src/main/java/com/tempotune/PitchDetectorModule.kt`
- `apps/mobile/android/app/src/main/java/com/tempotune/MetronomeModule.kt`
- `apps/mobile/android/app/src/main/java/com/tempotune/TempoTunePackage.kt`

## 7. 공통 타입 초안

이 섹션은 실제 구현 전에 shared 타입 설계를 잠그기 위한 초안이다.

```ts
export type AudioInputTransport =
  | 'built-in'
  | 'usb'
  | 'wired'
  | 'bluetooth'
  | 'unknown';

export type AudioInputDevice = {
  id: string;
  label: string;
  transport: AudioInputTransport;
  platformKind: string;
  channelCount: number;
  sampleRates: number[];
  isDefault: boolean;
  isAvailable: boolean;
};

export type AudioCaptureConfig = {
  deviceId: string;
  channelIndex: number;
  preferredSampleRate?: number;
  bufferSize?: number;
  latencyOffsetMs?: number;
  enablePitch: boolean;
  enableRhythm: boolean;
};

export type AudioSessionStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error';

export type AudioSessionState = {
  status: AudioSessionStatus;
  deviceId?: string;
  sampleRate?: number;
  channelCount?: number;
  timestampSource: 'monotonic';
  startedAtMonotonicMs?: number;
  errorMessage?: string;
};

export type PitchDetectionEvent = {
  frequency: number;
  confidence: number;
  name: string;
  octave: number;
  cents: number;
  detectedAtMonotonicMs: number;
  debugSeq?: number;
  debugSource: 'web' | 'native';
};

export type RhythmHitEvent = {
  detectedAtMonotonicMs: number;
  nearestBeatAtMonotonicMs: number;
  offsetMs: number;
  status: 'early' | 'on-time' | 'late';
  confidence: number;
  source: 'pick-attack' | 'clap' | 'pluck' | 'unknown';
};
```

## 8. 브리지 계약 변경안

### 8.1 새 메시지 타입

`packages/shared/src/types/bridge.types.ts`에 아래 메시지 타입을 추가한다.

- `LIST_AUDIO_INPUT_DEVICES`
- `AUDIO_INPUT_DEVICES_RESPONSE`
- `SELECT_AUDIO_INPUT_DEVICE`
- `GET_SELECTED_AUDIO_INPUT_DEVICE`
- `SELECTED_AUDIO_INPUT_DEVICE_RESPONSE`
- `START_AUDIO_CAPTURE`
- `STOP_AUDIO_CAPTURE`
- `AUDIO_INPUT_STATE_CHANGED`
- `AUDIO_INPUT_ROUTE_CHANGED`
- `RHYTHM_HIT_DETECTED`
- `CONFIGURE_AUDIO_ANALYZERS`

### 8.2 기존 메시지의 처리 방침

- `START_LISTENING` / `STOP_LISTENING`
  deprecated로 유지한다.
- 기존 튜너 UI가 새 클라이언트로 옮겨가기 전까지는 새 캡처 API를 내부에서 호출하는 얇은 호환 레이어로 남긴다.

### 8.3 `AudioBridgeInterface` 목표 형태

현재 인터페이스를 입력 인프라 관점으로 확장한다.

```ts
export type AudioBridgeInterface = {
  requestPermission(): Promise<AudioPermissionStatus>;
  getPermissionStatus(): Promise<AudioPermissionStatus>;
  listInputDevices(): Promise<AudioInputDevice[]>;
  getSelectedInputDevice(): Promise<AudioInputDevice | null>;
  selectInputDevice(deviceId: string): Promise<void>;
  startCapture(config: AudioCaptureConfig): Promise<void>;
  stopCapture(): Promise<void>;
  onSessionStateChanged(callback: (state: AudioSessionState) => void): () => void;
  onPitchDetected(callback: (event: PitchDetectionEvent) => void): () => void;
  onRhythmHitDetected(callback: (event: RhythmHitEvent) => void): () => void;
  onRouteChanged(callback: (devices: AudioInputDevice[]) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  dispose(): void;
};
```

## 9. 플랫폼별 구현 원칙

### 9.1 Web

- `MediaDevices.enumerateDevices()` 기반으로 입력 목록을 제공한다.
- `getUserMedia`는 `live-input-audio.service.ts` 한 곳에서만 소유한다.
- analyzer는 JS에서 동작한다.
- 가능하면 `AudioWorklet` 기반 처리로 이동한다.
- 최소 v1에서는 `AnalyserNode + shared service`로 시작해도 되지만, 서비스 API는 이후 `AudioWorklet` 전환을 막지 않도록 설계한다.

### 9.2 iOS

- 입력 장치 열거는 `AVAudioSession.availableInputs` 기준으로 관리한다.
- USB 장치 식별은 `AVAudioSession.Port.usbAudio` 등을 사용한다.
- 장치 선택은 `setPreferredInput`을 우선 사용한다.
- 캡처는 `AVAudioEngine` 입력 tap 기반으로 시작하되, timestamps는 `AVAudioTime.hostTime` 계열 monotonic 값으로 정규화한다.
- route 변경은 `AVAudioSession.routeChangeNotification`을 구독한다.
- 메트로놈 tick도 `Date()`가 아니라 hostTime 기반 monotonic timestamp로 바꾼다.

### 9.3 Android

- 입력 장치 열거는 `AudioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)`를 사용한다.
- USB 장치는 `TYPE_USB_DEVICE`, `TYPE_USB_HEADSET`를 우선 지원 대상으로 본다.
- 캡처는 `AudioRecord` 기반으로 유지하되, 가능하면 preferred device를 지정한다.
- timestamps는 `SystemClock.elapsedRealtimeNanos()` 또는 frame position 보정 기반 monotonic timestamp로 정규화한다.
- 장치 연결/해제는 `AudioDeviceCallback`으로 감지한다.
- 메트로놈 tick도 `System.currentTimeMillis()`에서 monotonic source로 변경한다.

## 10. Analyzer 파이프라인 전략

### 10.1 공용 개념

- 하나의 입력 세션에서 여러 analyzer가 동시에 구독할 수 있어야 한다.
- analyzer는 입력 frame 전체를 소유하지 않고, 읽기 전용 버퍼를 소비한다.
- analyzer 결과 이벤트 타입은 shared DTO로 통일한다.

### 10.2 Tuner

- 웹은 기존 `TunerEngine`을 재사용한다.
- 모바일은 당장 native pitch detector를 유지하되, 새 `AudioInputModule` 아래로 이동시킨다.
- 목표는 `PitchDetectorModule` 제거가 아니라 `pitch detector가 audio input infrastructure의 analyzer 중 하나가 되는 것`이다.

### 10.3 Rhythm

- v1은 onset detection 중심으로 구현한다.
- 피치가 아니라 RMS + spectral flux + adaptive threshold + refractory window 기반으로 간다.
- 리듬 판정은 `nearest beat` 대비 `offsetMs`를 산출한다.
- 판정 결과만 UI로 보내고, 원시 onset frame은 브리지로 보내지 않는다.

## 11. Metronome Timeline과 Clock 통일

이 항목은 리듬 연습 품질에 직접 영향을 주므로 별도 Phase로 취급한다.

- 웹 메트로놈은 이미 `performance.now()` 기반이므로 유지 가능하다.
- iOS metronome tick emit은 wall clock에서 hostTime 기반 monotonic timestamp로 바꾼다.
- Android metronome tick emit은 wall clock에서 elapsedRealtimeNanos 기반 monotonic timestamp로 바꾼다.
- rhythm analyzer는 반드시 `detectedAtMonotonicMs`와 `nearestBeatAtMonotonicMs`를 같은 기준으로 비교한다.
- bridge payload 필드명도 `timestamp` 대신 `detectedAtMonotonicMs`, `beatAtMonotonicMs` 같이 의미를 분명히 한다.

## 12. 장치별 Latency Calibration

USB 인터페이스까지 고려하면 이 항목은 선택이 아니라 필수다.

- 장치 key는 `platform + deviceId + label + transport` 조합으로 만든다.
- calibration 값은 ms 단위로 저장한다.
- 초기값은 0ms로 시작하고, 장치별 보정 UI는 뒤 Phase에서 추가한다.
- rhythm 판정에서는 `detectedAtMonotonicMs + latencyOffsetMs`를 비교에 사용한다.
- 저장 위치는 플랫폼별 persistent storage를 사용하되, shared 타입으로 계약만 먼저 정의한다.

## 13. 구현 Phase

## Phase 0. 계약 잠금과 마이그레이션 준비

목표:
- shared 타입과 bridge 계약을 먼저 고정한다.

작업:
- `AudioInputDevice`, `AudioCaptureConfig`, `AudioSessionState`, `RhythmHitEvent` 타입 추가
- 브리지 메시지 타입 추가
- `AudioBridgeInterface` 확장
- 기존 `START_LISTENING` 경로를 deprecated 호환 레이어로 재정의

완료 조건:
- `packages/shared` type-check 통과
- 기존 web/mobile import 깨짐 없음
- 새 타입만 추가되고 기능 동작은 아직 변하지 않아도 됨

권장 커밋:
- `feat(shared): add audio input contracts for shared capture pipeline`

## Phase 1. Web 공용 입력 세션 도입

목표:
- 웹에서 기능별 입력 소유를 중단하고 공용 세션을 만든다.

작업:
- `live-input-audio.service.ts` 추가
- `tuner-audio.service.ts`를 analyzer 성격으로 재구성하거나 래핑
- `use-tuner`가 공용 입력 세션을 사용하도록 변경
- device enumeration API 추가

완료 조건:
- 기존 튜너 UI가 동일하게 동작
- 장치 목록 조회 가능
- 같은 입력 세션을 다른 hook이 재사용할 준비 완료

권장 커밋:
- `refactor(web): introduce shared live audio input service`

## Phase 2. Mobile native audio input bridge 기초

목표:
- 모바일에서 USB 장치 열거와 선택이 가능한 공용 입력 네이티브 계층을 만든다.

작업:
- `AudioInputModule` 추가
- device enumeration, selected device 관리, capture start/stop 구현
- `App.tsx` bridge handler에 새 요청/응답 추가
- JS용 `native-audio-input.service.ts` 추가
- route changed 이벤트 추가

완료 조건:
- iOS/Android에서 입력 장치 목록을 가져올 수 있음
- USB 장치 연결 시 목록에 반영됨
- 선택된 장치로 캡처 시작/중지 가능
- 기존 pitch 이벤트는 유지 가능

권장 커밋:
- `feat(mobile): add native audio input bridge for device-managed capture`

## Phase 3. Mobile analyzer 이관

목표:
- pitch detector를 새 입력 인프라 아래로 재배치하고, 리듬 analyzer 확장점을 만든다.

작업:
- `PitchDetectorModule` 로직을 `AudioInputModule` 내부 analyzer로 이동
- `PITCH_DETECTED` 이벤트 발행 경로를 새 세션 기반으로 바꿈
- rhythm analyzer placeholder 추가

완료 조건:
- 튜너 기능이 새 module 경유로 정상 동작
- 별도 pitch-only module 의존 제거 가능
- 이후 rhythm analyzer 추가가 쉬운 구조 확보

권장 커밋:
- `refactor(mobile): move native pitch detection under shared audio input module`

## Phase 4. Metronome timeline monotonic화

목표:
- 모바일 박자 판정용 시간 기준을 바로잡는다.

작업:
- iOS/Android metronome tick timestamp를 monotonic 기반으로 변경
- bridge payload 필드명 정리
- JS 소비부에서 monotonic 필드 사용하도록 변경

완료 조건:
- 웹/모바일 모두 beat timestamp가 monotonic 기준으로 통일됨
- rhythm analyzer 구현에 필요한 clock mismatch 제거

권장 커밋:
- `refactor(audio): align mobile metronome ticks to monotonic timeline`

## Phase 5. Rhythm analyzer와 메트로놈 연동

목표:
- 공용 입력 세션 위에 박자 연습 기능을 얹는다.

작업:
- `packages/audio/src/rhythm` 구현
- 웹 rhythm analyzer 연결
- 모바일 native rhythm analyzer 또는 최소 bridge 결과 DTO 설계
- 메트로놈 화면용 hook 추가

완료 조건:
- `offsetMs`, `early/on-time/late`, 정확도 통계 계산 가능
- 메트로놈 세션 중 실시간 판정 가능

권장 커밋:
- `feat(audio): add rhythm analysis pipeline for metronome practice`

## Phase 6. UI 적용과 보정 UX

목표:
- 장치 선택과 리듬 피드백을 사용자에게 노출한다.

작업:
- 설정 화면 또는 튜너/메트로놈 화면에 입력 장치 selector 추가
- 세션 상태/연결 해제/권한 오류 표시
- latency calibration UI 추가

완료 조건:
- 사용자가 입력 장치를 선택 가능
- USB 장치가 분리되면 UI가 즉시 반응
- 장치별 보정값 저장/적용 가능

권장 커밋:
- `feat(ui): expose shared audio input selection and calibration controls`

## 14. Claude 작업 순서 권장안

Claude는 아래 순서를 지키는 것이 안전하다.

1. `shared contracts`부터 잠근다.
2. 웹 공용 입력 세션으로 기존 튜너를 먼저 옮긴다.
3. 모바일 `AudioInputModule` 기초를 만든다.
4. 모바일 pitch detector를 새 구조로 이관한다.
5. metronome tick timestamp를 monotonic으로 바꾼다.
6. 그 다음에만 rhythm analyzer를 붙인다.

주의:
- 리듬 UI부터 먼저 만들지 않는다.
- 모바일에서 raw PCM bridge 전송 실험을 하지 않는다.
- `Date.now()`를 beat alignment 기준으로 쓰지 않는다.

## 15. Acceptance Checklist

- [ ] `AudioBridgeInterface`가 장치 열거/선택/캡처/세션 이벤트를 포함한다.
- [ ] 웹에서 튜너와 향후 리듬 기능이 동일 입력 세션을 공유할 수 있다.
- [ ] 모바일에서 USB 입력 장치를 열거하고 선택할 수 있다.
- [ ] 모바일 pitch detection이 새 공용 입력 인프라 아래에서 동작한다.
- [ ] 모바일 metronome tick이 monotonic timestamp를 emit한다.
- [ ] rhythm analyzer가 `offsetMs`와 `early/on-time/late`를 계산할 수 있다.
- [ ] 장치별 latency calibration 값을 저장하고 적용할 수 있다.

## 16. 비목표

- 이 문서 범위에서 다채널 녹음/멀티트랙 레코딩 UI까지 구현하지 않는다.
- 이 문서 범위에서 Bluetooth 입력 timing accuracy를 보장하지 않는다.
- 이 문서 범위에서 PCM 녹음 저장/파일 export를 같이 붙이지 않는다.
- 이 문서 범위에서 데스크톱 전용 복잡한 오디오 라우팅 UI를 먼저 만들지 않는다.

## 17. 메모

- 현재 구조상 가장 위험한 부분은 `기능 단위 입력 서비스`와 `clock mismatch`다.
- 설계 핵심은 “오디오를 어디서 분석하느냐”보다 “입력을 누가 소유하고, 결과 timestamp를 어떤 기준으로 비교하느냐”에 있다.
- 모바일 USB 지원을 진지하게 가져가려면, 브리지 계약과 native session ownership을 먼저 바로잡는 것이 맞다.

## 18. 검증 피드백 (2026-03-14)

현재 변경은 `계약 + 스캐폴딩 + 일부 피드백 반영` 수준까지는 들어왔지만, 실제 앱 기능 경로까지 완전히 연결된 상태는 아니다.

### 이번 재검증에서 해결된 항목

1. native audio-input 오류 forward는 반영되었다.
- `App.tsx`에서 native audio input error를 WebView `ERROR` 이벤트로 전달하도록 수정되었다.

2. Android `startCapture()`가 `config.deviceId`를 아예 무시하던 문제는 일부 보완되었다.
- 현재는 `config.deviceId`를 읽어 `selectedDeviceId`에 반영하려는 코드가 추가되었다.

### 아직 남아 있는 문제

1. 공용 오디오 입력 인프라가 기존 튜너/메트로놈 기능 경로에 아직 연결되지 않았다.
- 기존 튜너는 여전히 legacy `startListening()` / `stopListening()` 경로를 사용한다.
- `useAudioInput`, `useRhythmPractice`, `TunerAudioService.createFrameConsumer()`가 추가되었지만 실제 화면/기존 hook에서 소비되지 않는다.
- `useAudioInput`도 현재는 web 전용 초기화만 갖고 있고 native path에서는 즉시 return 한다.

2. Android `deviceId` 계약은 아직 플랫폼 간 일관되지 않다.
- shared 타입은 `AudioInputDevice.id: string`으로 정의되어 있다.
- Android native는 여전히 `device.id`를 숫자로 emit한다.
- 현재 구현은 문자열을 `toIntOrNull()`로 변환해 맞추는 임시 보정에 가깝다.
- 즉, round-trip 전체가 공용 계약이 아니라 런타임 변환에 기대고 있다.

3. web 쪽 새 bridge API는 아직 stub 상태다.
- `AudioBridgeClient.listInputDevices()`는 web에서 빈 배열을 반환한다.
- `AudioBridgeClient.startCapture()` / `stopCapture()`도 web 구현이 없다.
- 따라서 공용 bridge 계약은 선언되었지만 web/native가 대칭적으로 구현된 상태는 아니다.

4. 웹 리듬 검출 구현은 현재 구조 그대로 실시간 경로에 올리기엔 무겁다.
- `OnsetDetector`가 프레임마다 전체 DFT를 직접 계산한다.
- `useRhythmPractice`는 이 연산을 메인 스레드에서 `performance.now()` 기준으로 계속 호출한다.
- 실제 화면 연결 시 CPU 사용량과 UI 지연이 커질 가능성이 높다.

### 최신 검증 결과

- `pnpm exec nx run-many -t type-check --projects=shared,audio,web,mobile` 통과
- `pnpm exec nx run audio:test` 통과
- `./gradlew :app:compileDebugKotlin` 통과
- iOS 빌드는 이번 재검증에서 다시 수행하지 않음

### Claude가 다음으로 해야 할 작업

1. `useTuner`와 향후 metronome rhythm path를 새 capture/session API에 실제로 연결한다.
2. `AudioInputDevice.id` 계약을 플랫폼 공통 형식으로 고정한다.
3. `AudioBridgeClient`의 web 쪽 `listInputDevices` / `startCapture` / `stopCapture`를 실제 구현으로 채운다.
4. rhythm analyzer를 `AudioWorklet` 또는 더 가벼운 분석 경로 기준으로 재설계한다.

## 19. 작업 완료 후 필수 셀프체크

Claude는 작업을 끝냈다고 판단하기 전에 아래 절차를 반드시 다시 수행해야 한다.

### 19.1 스펙 대조

- 이번 문서의 `목표`, `플랫폼별 구현 원칙`, `Phase별 완료 조건`, `Acceptance Checklist`, `검증 피드백`을 다시 읽고 구현 상태를 대조한다.
- `타입/브리지 계약만 추가됨`, `hook/service만 추가됨`, `실제 화면/기존 기능 경로에는 미연결` 같은 상태를 완료로 간주하지 않는다.
- 특히 아래 항목은 실제 연결 여부를 다시 확인한다.
  - 기존 `useTuner`가 새 capture/session 경로를 타는지
  - metronome rhythm path가 동일 입력 세션을 재사용하는지
  - web/native bridge가 같은 계약으로 동작하는지
  - Android/iOS에서 `deviceId` round-trip이 일관된지

### 19.2 필수 검증 명령

작업 범위에 따라 최소 아래 검증을 다시 실행한다.

- `pnpm exec nx run-many -t type-check --projects=shared,audio,web,mobile`
- `pnpm exec nx run audio:test`
- Android native를 건드렸다면:
  - `./gradlew :app:compileDebugKotlin`
- iOS native를 건드렸다면:
  - 가능한 경우 `xcodebuild` 또는 최소한 Xcode project/module 등록 상태를 다시 확인한다.

### 19.3 완료 판정 규칙

- 검증이 통과하지 않았으면 완료라고 보고하지 않는다.
- 스펙 대비 남은 항목이 있으면 `해결됨`과 `남은 문제`를 분리해서 명시한다.
- `stub`, `TODO`, `임시 변환`, `legacy 경로 유지`가 남아 있으면 그것이 왜 남았는지와 다음 작업을 함께 적는다.
- 성능 리스크가 있는 구현은 `동작함`만으로 완료 처리하지 않고, 실시간 경로에 올려도 되는지 다시 판단한다.

### 19.4 최종 보고 형식

작업 종료 시에는 최소 아래 내용을 남긴다.

1. 무엇을 실제로 연결했는지
2. 어떤 명령으로 검증했는지
3. 어떤 스펙 항목이 충족되었는지
4. 아직 충족되지 않은 항목이 있다면 무엇인지
