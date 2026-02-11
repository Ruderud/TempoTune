# TempoTune 전체 구현 계획

## Context

TempoTune은 메트로놈과 기타/베이스 튜너 기능을 제공하는 React Native + WebView 하이브리드 모바일 앱이다.
현재 모노레포 스캐폴딩만 완료된 상태이며, 모든 기능 코드가 빈 파일로 존재한다.

**기술 스택**: Nx + pnpm 모노레포, Next.js 16 (App Router), React Native 0.81, Tailwind CSS 4, Web Audio API
**의존성 방향**: `apps/web` -> `packages/shared` <- `apps/mobile`, `packages/audio` -> `packages/shared`

### 확정된 기술 결정사항
| 항목 | 결정 | 비고 |
|------|------|------|
| 피치 감지 알고리즘 | **YIN 알고리즘** | 저음역(E2) 정확도 및 옥타브 오류 방지 |
| 메트로놈 클릭 사운드 | **OscillatorNode 합성 (기본) + 커스텀 사운드 업로드 옵션** | 업로드 없으면 합성 폴백 |
| 상태 관리 | **Context API** | 현재 규모에 적합 |
| PWA 지원 | **제외** | 네이티브 앱 하이브리드이므로 불필요 |
| RN 오디오 라이브러리 | **react-native-audio-recorder-player** | |
| 테스트 프레임워크 | **Vitest** | ESM 네이티브 지원, TS 설정 간소화 |
| 유틸리티 라이브러리 | **es-toolkit** (lodash 금지) | 경량, ESM-first, tree-shakeable |

---

## Work Objectives

1. packages/shared에 공통 타입, 상수, Bridge 인터페이스, 유틸리티를 정의한다
2. packages/audio에 메트로놈/튜너 핵심 알고리즘(플랫폼 독립적)을 구현한다
3. apps/web에 Web Audio API 기반 서비스와 UI 컴포넌트를 구현한다
4. apps/mobile에 WebView Bridge 통신 및 네이티브 오디오 서비스를 구현한다

---

## Guardrails

### Must Have
- 모든 파일명은 kebab-case (컴포넌트: `*.component.tsx`, 서비스: `*.service.ts`, 타입: `*.types.ts`)
- `type` 우선 사용 (interface보다), `any` 금지
- Bridge API는 DIP 패턴 준수: 인터페이스는 shared, 구현은 각 앱에서
- 커밋은 컨벤셔널 커밋 (`feat:`, `fix:`, `refactor:`, `chore:`)
- 각 작업은 독립적으로 커밋 가능해야 함

### Must NOT Have
- `interface` 남용 (확장 필요한 경우에만)
- 순환 의존성 (apps -> packages만 가능, packages 간 shared -> audio 방향 금지)
- 하드코딩된 오디오 상수 (constants 파일로 분리)
- `console.log` 포맷 미준수 (`!!DEBUG [컨텍스트] 파라미터명:` 형식 필수)
- **lodash 사용 금지** - 유틸리티는 `es-toolkit` 사용 (경량, ESM-first, tree-shakeable)
- **Jest 사용 금지** - 테스트는 `Vitest` 사용 (ESM 네이티브 지원, TS 무설정)

---

## Task Flow (의존성 그래프)

```
Phase 1: Foundation (병렬 불가 - 최우선)
  [WU-1] packages/shared: 타입 + 상수 + 유틸리티
  [WU-2] packages/shared: Bridge API 인터페이스

Phase 2: Core Logic (WU-1 완료 후, 서로 병렬 가능)
  [WU-3] packages/audio: 메트로놈 엔진
  [WU-4] packages/audio: 튜너 엔진 (피치 감지)

Phase 3: Web App (WU-1, WU-2 완료 후, 서로 병렬 가능)
  [WU-5] apps/web: Web Audio 서비스 (메트로놈 + 튜너)
  [WU-6] apps/web: UI 컴포넌트 + 페이지 라우팅

Phase 4: Mobile App (WU-2 완료 후)
  [WU-7] apps/mobile: WebView Bridge 구현 + 네이티브 오디오 서비스

Phase 5: Integration (모든 Phase 완료 후)
  [WU-8] E2E 통합 + 최종 연결
```

**병렬 실행 가능 조합:**
- WU-3 || WU-4 (Phase 2 내 병렬)
- WU-5 || WU-6 (Phase 3 내 병렬)
- Phase 3 || Phase 4 (WU-2 완료 후 병렬)

---

## Detailed TODOs

---

### WU-1: packages/shared - 타입, 상수, 유틸리티 정의
**에이전트 티어**: Sonnet
**의존성**: 없음 (최우선 실행)
**커밋**: `feat(shared): add core types, constants, and utility functions`

#### 파일 목록

**타입 파일 (`packages/shared/src/types/`)**:
- `metronome.types.ts` - MetronomeConfig 확장 (accent, subdivision, sound type 등), MetronomeState, MetronomeEvent
- `tuner.types.ts` - TunerNote 확장, TunerConfig 확장, TunerState, InstrumentType, TuningPreset
- `audio.types.ts` - AudioPermissionStatus, AudioContextState 등 공통 오디오 타입
- `bridge.types.ts` - BridgeMessage, BridgeResponse, BridgeEventType 등 통신 메시지 타입
- `index.ts` - 모든 타입 re-export

**상수 파일 (`packages/shared/src/constants/`)**:
- `metronome.constants.ts` - BPM 범위 (MIN/MAX/DEFAULT), 기본 박자 등
- `tuner.constants.ts` - A4 기준 주파수 (440Hz), 음계 이름 배열, 기타/베이스 표준 튜닝 프리셋
- `audio.constants.ts` - FFT 크기, 샘플레이트, 오디오 버퍼 크기
- `index.ts` - 모든 상수 re-export

**유틸리티 파일 (`packages/shared/src/utils/`)**:
- `frequency.util.ts` - frequencyToNote(), noteToFrequency(), centsFromPitch() 등 주파수-음계 변환
- `time.util.ts` - bpmToMs(), msToSamples() 등 BPM/시간 변환
- `math.util.ts` - clamp(), lerp() 등 수학 헬퍼
- `index.ts` - 모든 유틸리티 re-export

#### Acceptance Criteria
- [ ] `@tempo-tune/shared/types`에서 MetronomeConfig, TunerNote, TunerConfig, AudioPermissionStatus 등 import 가능
- [ ] `@tempo-tune/shared/constants`에서 DEFAULT_BPM, STANDARD_GUITAR_TUNING 등 import 가능
- [ ] `@tempo-tune/shared/utils`에서 frequencyToNote(440) === 'A4' 테스트 통과
- [ ] `nx type-check shared` 통과
- [ ] 기존 types/index.ts의 타입은 개별 파일로 분리 후 re-export 유지

---

### WU-2: packages/shared - Bridge API 인터페이스 정의
**에이전트 티어**: Sonnet
**의존성**: WU-1 (타입 사용)
**커밋**: `feat(shared): define Bridge API interfaces for native-web communication`

#### 파일 목록

**Bridge 인터페이스 (`packages/shared/src/bridge/`)**:
- `native-bridge.types.ts` - BridgeMessage<T>, BridgeResponse<T>, BridgeEventMap 제네릭 메시지 타입
- `audio-bridge.types.ts` - AudioBridgeRequest, AudioBridgeResponse, AudioBridgeEventType
- `audio-bridge.interface.ts` - AudioBridgeInterface (requestPermission, startListening, stopListening, onPitchDetected 등)
- `metronome-bridge.interface.ts` - MetronomeBridgeInterface (playClick, setTempo, 진동 피드백 등)
- `index.ts` - 모든 bridge 타입/인터페이스 re-export

#### Acceptance Criteria
- [ ] AudioBridgeInterface type이 requestPermission, startListening, stopListening, onPitchDetected 메서드 정의 포함
- [ ] MetronomeBridgeInterface type이 playClick, vibrate 메서드 정의 포함
- [ ] BridgeMessage<T> 제네릭으로 type-safe 메시지 전송 가능
- [ ] `nx type-check shared` 통과
- [ ] apps/web, apps/mobile 양쪽에서 import 가능한 경로 구조

---

### WU-3: packages/audio - 메트로놈 엔진
**에이전트 티어**: Opus
**의존성**: WU-1 (shared 타입/상수/유틸리티 사용)
**커밋**: `feat(audio): implement platform-independent metronome engine`

#### 파일 목록

**메트로놈 엔진 (`packages/audio/src/metronome/`)**:
- `metronome-engine.types.ts` - MetronomeEngineConfig, MetronomeCallback, TickEvent 등 엔진 내부 타입
- `metronome-scheduler.ts` - 정밀 타이밍 스케줄러 (Web Audio lookahead 패턴 기반, 플랫폼 독립적 로직)
- `metronome-engine.ts` - MetronomeEngine 클래스: start/stop/setTempo/setTimeSignature, 비트 카운팅, 액센트 처리
- `index.ts` - re-export

#### Acceptance Criteria
- [ ] MetronomeEngine이 start()/stop()/setTempo()/setTimeSignature() API 제공
- [ ] 콜백으로 tick 이벤트 (beatIndex, isAccent, timestamp) 전달
- [ ] BPM 변경 시 실시간 반영 (재시작 없이)
- [ ] `nx type-check audio` 통과
- [ ] 순수 로직만 포함 (Web Audio API, React Native 등 플랫폼 API 직접 사용 금지)

---

### WU-4: packages/audio - 튜너 엔진 (피치 감지)
**에이전트 티어**: Opus
**의존성**: WU-1 (shared 타입/상수/유틸리티 사용)
**커밋**: `feat(audio): implement pitch detection engine for tuner`

#### 파일 목록

**튜너 엔진 (`packages/audio/src/tuner/`)**:
- `tuner-engine.types.ts` - PitchDetectionResult, TunerEngineConfig, YinConfig
- `pitch-detector.ts` - YIN 알고리즘 기반 피치 감지 (차이 함수, 누적 평균 정규화, 절대 임계값, 파라볼릭 보간)
- `tuner-engine.ts` - TunerEngine 클래스: processAudioData(Float32Array), 감지된 주파수를 음계+cents로 변환
- `tuning-presets.ts` - 기타 Standard/Drop-D, 베이스 Standard 등 프리셋 정의
- `index.ts` - re-export

#### Acceptance Criteria
- [ ] PitchDetector가 Float32Array 오디오 데이터를 받아 주파수(Hz) 반환
- [ ] TunerEngine이 주파수를 음계명(C4, A4 등) + cents 오차로 변환
- [ ] 기타 표준 튜닝 프리셋 (E2, A2, D3, G3, B3, E4) 포함
- [ ] 베이스 표준 튜닝 프리셋 (E1, A1, D2, G2) 포함
- [ ] `nx type-check audio` 통과
- [ ] 순수 로직만 포함 (플랫폼 API 직접 사용 금지)

---

### WU-5: apps/web - Web Audio 서비스 레이어
**에이전트 티어**: Opus
**의존성**: WU-1, WU-2, WU-3, WU-4
**커밋**: `feat(web): implement Web Audio API services for metronome and tuner`

#### 파일 목록

**오디오 서비스 (`apps/web/services/audio/`)**:
- `audio-context.service.ts` - AudioContext 싱글톤 관리, resume/suspend, 상태 관리
- `metronome-audio.service.ts` - Web Audio API로 클릭 사운드 생성 (기본: OscillatorNode + GainNode 합성, 옵션: 사용자 업로드 AudioBuffer 재생), MetronomeEngine 연결
- `sound-loader.service.ts` - 사용자 업로드 사운드 파일을 AudioBuffer로 디코딩/캐싱, 없으면 합성 폴백
- `tuner-audio.service.ts` - getUserMedia로 마이크 입력, AnalyserNode로 오디오 데이터 추출, TunerEngine 연결
- `index.ts` - re-export

**Bridge 어댑터 (`apps/web/services/bridge/`)**:
- `bridge-adapter.ts` - 네이티브/웹 환경 감지, 메시지 라우팅
- `audio-bridge.client.ts` - AudioBridgeInterface 웹 구현 (Web Audio API 사용)
- `index.ts` - re-export

**Hooks (`apps/web/hooks/`)**:
- `use-metronome.ts` - MetronomeAudioService 래핑, bpm/timeSignature/isPlaying 상태 관리
- `use-tuner.ts` - TunerAudioService 래핑, detectedNote/cents/frequency 상태 관리
- `use-audio-permission.ts` - 마이크 권한 요청/상태 관리
- `index.ts` - re-export

#### Acceptance Criteria
- [ ] useMetronome() 훅이 start/stop/setBpm/setTimeSignature 반환, 현재 비트 인덱스 실시간 업데이트
- [ ] useTuner() 훅이 start/stop 반환, 감지된 음계/cents/frequency 실시간 업데이트
- [ ] AudioContext가 한 번만 생성되고 재사용됨
- [ ] 마이크 권한 미허용 시 적절한 에러 핸들링
- [ ] `nx type-check web` 통과

---

### WU-6: apps/web - UI 컴포넌트 + 페이지
**에이전트 티어**: Sonnet
**의존성**: WU-5 (hooks 사용)
**커밋**: `feat(web): implement metronome and tuner UI components`

#### 파일 목록

**공통 컴포넌트 (`apps/web/components/common/`)**:
- `tab-navigation.component.tsx` - 메트로놈/튜너 탭 전환
- `circular-gauge.component.tsx` - 원형 게이지 (튜너 cents 표시용)

**메트로놈 컴포넌트 (`apps/web/components/metronome/`)**:
- `metronome-display.component.tsx` - BPM 표시, 비트 인디케이터 (현재 비트 하이라이트)
- `metronome-control.component.tsx` - BPM 슬라이더/+-버튼, 박자 선택, 재생/정지 버튼
- `index.ts` - re-export

**튜너 컴포넌트 (`apps/web/components/tuner/`)**:
- `tuner-display.component.tsx` - 감지된 음계 표시, cents 게이지 (-50 ~ +50), 주파수 표시
- `tuner-control.component.tsx` - 튜닝 프리셋 선택, 기준 주파수 조절 (A4 = 440Hz)
- `string-indicator.component.tsx` - 기타/베이스 줄별 목표 음계 표시
- `index.ts` - re-export

**페이지 (`apps/web/app/`)**:
- `page.tsx` - 메인 페이지: 탭 네비게이션 + 메트로놈/튜너 전환
- `layout.tsx` - 기존 레이아웃 확장 (viewport meta, PWA 설정 등)
- `globals.css` - 모바일 최적화 스타일 (safe-area, touch 최적화)

#### Acceptance Criteria
- [ ] 메트로놈 화면: BPM 조절 (30-300), 박자 선택 (2/4, 3/4, 4/4, 6/8), 재생/정지, 비트 시각 피드백
- [ ] 튜너 화면: 실시간 음계 감지 표시, cents 게이지, 기타/베이스 프리셋 선택
- [ ] 탭으로 메트로놈/튜너 전환 가능
- [ ] 모바일 뷰포트에 최적화된 반응형 레이아웃
- [ ] 'use client' 지시어 올바르게 사용 (Server/Client Component 분리)

---

### WU-7: apps/mobile - WebView Bridge + 네이티브 서비스
**에이전트 티어**: Sonnet
**의존성**: WU-2 (Bridge 인터페이스), WU-6 (웹 앱 완성 후 WebView로 로드)
**커밋**: `feat(mobile): implement WebView bridge and native audio services`

#### 파일 목록

**Bridge 구현 (`apps/mobile/src/bridge/`)**:
- `bridge-handler.service.ts` - WebView onMessage 이벤트 파싱, 메시지 타입별 라우팅
- `audio-bridge.impl.ts` - AudioBridgeInterface 네이티브 구현 (마이크 권한, 오디오 녹음)
- `metronome-bridge.impl.ts` - MetronomeBridgeInterface 네이티브 구현 (진동 피드백)
- `index.ts` - re-export

**네이티브 서비스 (`apps/mobile/src/services/`)**:
- `permission.service.ts` - 마이크 권한 요청/확인 (iOS/Android 분기)
- `haptic.service.ts` - 진동 피드백 서비스 (메트로놈 비트에 햅틱 반응)

**App 업데이트 (`apps/mobile/src/`)**:
- `App.tsx` - BridgeHandler 연결, WebView ref 관리, 환경별 URL 설정 개선

#### Acceptance Criteria
- [ ] WebView에서 postMessage로 보낸 Bridge 메시지가 네이티브에서 파싱/처리됨
- [ ] 네이티브에서 처리 결과를 WebView로 다시 전달 (injectedJavaScript 또는 postMessage)
- [ ] 마이크 권한 요청이 iOS/Android 각각 정상 동작
- [ ] 메트로놈 비트에 맞춰 햅틱 피드백 동작 (선택적)
- [ ] `nx type-check mobile` 통과

---

### WU-8: 통합 테스트 + 마무리
**에이전트 티어**: Sonnet
**의존성**: WU-5, WU-6, WU-7 모두 완료
**커밋**: `test: add integration tests and finalize app wiring`

#### 파일 목록

**유틸리티 테스트 (`packages/shared/src/utils/`)**:
- `frequency.util.test.ts` - frequencyToNote, noteToFrequency 테스트
- `time.util.test.ts` - bpmToMs 테스트

**엔진 테스트 (`packages/audio/src/`)**:
- `metronome/metronome-engine.test.ts` - 메트로놈 엔진 단위 테스트
- `tuner/pitch-detector.test.ts` - 피치 감지 알고리즘 단위 테스트

**통합 확인**:
- 웹 앱 빌드 성공 (`nx build web`)
- 모바일 앱에서 웹 로드 후 기능 동작 확인
- 전체 type-check 통과 (`nx run-many --target=type-check --all`)

#### Acceptance Criteria
- [ ] 공유 유틸리티 테스트 전체 통과
- [ ] 오디오 엔진 단위 테스트 전체 통과
- [ ] `nx build web` 성공
- [ ] `nx run-many --target=type-check --all` 성공
- [ ] `nx run-many --target=lint --all` 성공

---

## Success Criteria

1. `packages/shared`의 타입/상수/유틸리티/Bridge 인터페이스가 정의되어 다른 패키지에서 import 가능
2. `packages/audio`의 메트로놈/튜너 엔진이 플랫폼 독립적으로 동작
3. `apps/web`에서 메트로놈 재생/정지 + BPM 조절, 튜너 실시간 피치 감지가 동작
4. `apps/mobile`에서 WebView를 통해 웹 앱을 로드하고 Bridge 통신이 동작
5. 전체 모노레포 type-check + lint 통과
6. 각 WU가 독립적으로 커밋 가능한 단위로 분리됨

---

## Execution Order Summary

| 순서 | Work Unit | 의존성 | 병렬 가능 | 에이전트 티어 |
|------|-----------|--------|-----------|--------------|
| 1    | WU-1: shared 타입/상수/유틸리티 | 없음 | - | Sonnet |
| 2    | WU-2: shared Bridge 인터페이스 | WU-1 | - | Sonnet |
| 3a   | WU-3: audio 메트로놈 엔진 | WU-1 | WU-4와 병렬 | Opus |
| 3b   | WU-4: audio 튜너 엔진 | WU-1 | WU-3와 병렬 | Opus |
| 4a   | WU-5: web 오디오 서비스 | WU-1~4 | WU-6과 병렬 | Opus |
| 4b   | WU-6: web UI 컴포넌트 | WU-5 | - | Sonnet |
| 4c   | WU-7: mobile Bridge 구현 | WU-2 | Phase 3과 병렬 | Sonnet |
| 5    | WU-8: 통합 테스트 | WU-5~7 | - | Sonnet |
