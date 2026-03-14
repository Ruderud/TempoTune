# TempoTune 안정화/리팩터링 실행 플랜 (Claude 작업용)

## Context

2026-02-23 코드베이스 리뷰 기준으로, 현재 프로젝트는 기능 동작은 가능하나 다음 리스크가 누적되어 있다.

- Android 네이티브 튜너 모듈 미구현으로 런타임 실패 가능
- WebView 브릿지 프로토콜 불일치로 permission 요청 deadlock 가능
- pre-commit 훅 검증 범위 오류로 품질 게이트 실효성 부족
- 메트로놈 타이밍 처리/스케줄링 정밀도 개선 여지
- 튜너 훅/페이지 과대화로 유지보수 난이도 상승
- dead code/미연결 UI/접근성 이슈 누적

이 문서는 Claude가 즉시 실행 가능한 수준으로 작업 순서, 파일 범위, 검증 기준을 정의한다.

---

## Work Objectives

1. P0 런타임 리스크(Android/Bridge/Hook)를 우선 제거한다.
2. 오디오 타이밍 정확도와 오류 전파 경로를 일관화한다.
3. 구조적 복잡도(useTuner/page)와 dead code를 단계적으로 축소한다.
4. CI/Hook/Test 체계를 실제 회귀 방지 수준으로 보강한다.

---

## Guardrails

### Must Have
- 기존 기능 동작 유지(메트로놈 시작/정지, 튜너 수음/표시)
- 각 WU 완료마다 `lint`, `type-check`, 관련 테스트 통과
- 브릿지 메시지 타입을 shared 타입 중심으로 정리
- 하드코딩된 임시 값은 상수/설정으로 이동

### Must NOT Have
- 오디오 엔진 알고리즘을 근거 없이 변경
- 웹/모바일 브릿지 메시지 포맷을 양쪽 동기화 없이 변경
- 테스트/훅 실패를 무시한 채 후속 WU 진행

---

## 대상 파일 (핵심)

### Mobile / Bridge
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/src/services/native-audio.service.ts`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/src/bridge/bridge-handler.service.ts`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/src/bridge/audio-bridge.impl.ts`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/src/App.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/android/app/src/main/java/com/tempotune/MainApplication.kt`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/android/app/src/main/java/com/tempotune/MainActivity.kt`

### Web / Audio / Hooks
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/hooks/use-tuner.ts`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/hooks/use-metronome.ts`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/services/audio/metronome-audio.service.ts`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/services/audio/tuner-audio.service.ts`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/services/audio/sound-loader.service.ts`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/services/bridge/audio-bridge.client.ts`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/services/bridge/bridge-adapter.ts`

### Shared / Infra
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/packages/shared/src/types/bridge.types.ts`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/packages/shared/src/bridge/audio-bridge.interface.ts`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/.husky/pre-commit`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/scripts/check-ui-quality.sh`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/project.json`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/project.json`

---

## Task Flow (우선순위 순)

```
Phase 1: Runtime Hotfix (P0)
  [WU-1] Android native audio safety + duplicate activity cleanup
  [WU-2] Bridge protocol normalization (permission/request-response)
  [WU-3] Tuner error propagation wiring

Phase 2: Timing & Signal Quality (P1)
  [WU-4] Metronome scheduling precision hardening
  [WU-5] BPM clamp consistency + constraints unification
  [WU-6] NativeAudioService listener lifecycle hardening

Phase 3: Structure Refactor (P1/P2)
  [WU-7] useTuner 분해 (state machine / processing / persistence)
  [WU-8] Tuner page layout state(storage) 훅 분리
  [WU-9] Settings/SessionStats 미연결 UI 정리 또는 실제 데이터 연결

Phase 4: Infra & Quality Gates (P2)
  [WU-10] pre-commit affected 범위 수정(staged 기준)
  [WU-11] web/mobile test target 추가 + 최소 회귀 테스트 도입
  [WU-12] UI guardrail 규칙 업데이트(연도 패턴/검사 정합성)

Phase 5: Cleanup & Docs
  [WU-13] dead code 제거 + 중복 유틸 통합
  [WU-14] README/운영 문서 업데이트
```

---

## Detailed Work Units

### WU-1: Android 런타임 안전성 보강

작업:
- Android에서 `PitchDetectorModule` 부재 시 graceful fallback 처리
- `com/tempproject/MainActivity.kt` 중복 파일 정리
- 네이티브 모듈 미탑재 환경에서 명시적 에러 이벤트 송신

Acceptance Criteria:
- [x] Android에서 모듈 미존재 시 앱 크래시 없이 에러가 UI에 표시됨
- [x] Android 소스 트리에 중복 MainActivity 제거됨
- [x] `pnpm --filter @tempo-tune/mobile type-check` 통과

### WU-2: Bridge 프로토콜 정규화

작업:
- `BridgeHandler.sendToWebView` 응답 메시지 envelope 정리
- permission 응답 타입(`MIC_PERMISSION_RESPONSE`)이 web client 기대값과 1:1 일치하도록 수정
- shared bridge 타입으로 request/response 스키마 명시

Acceptance Criteria:
- [x] `requestPermission()` Promise가 타임아웃/무한대기 없이 resolve/reject 됨
- [x] START/STOP/PERMISSION 경로에서 메시지 타입 충돌 없음
- [x] web/mobile 양측 type-check 통과

### WU-3: 튜너 에러 전파 연결

작업:
- `useTuner`에서 `bridge.onError` 구독 연결
- native/web 에러를 `error` state로 통일 반영
- 사용자 재시도 가능한 메시지 정책 정리

Acceptance Criteria:
- [x] 네이티브/웹 튜너 에러 발생 시 UI overlay에 표시됨
- [x] stop/start 재시도 시 정상 복구 가능

### WU-4: 메트로놈 정밀도 보강

작업:
- backlog catch-up 과다 방출 제한(한 프레임 최대 처리량 제한)
- `event.timestamp` 기반 오디오 재생 스케줄링 적용(`ctx.currentTime` 기준)
- 장시간 백그라운드 복귀 시 동작 검증

Acceptance Criteria:
- [x] 백그라운드 복귀 후 burst click 현상 없음
- [x] tick 이벤트와 실제 사운드 오차가 기존 대비 감소
- [x] `packages/audio` 테스트 통과

### WU-5: BPM 규칙 일관화

작업:
- TapTempo의 최소 BPM을 shared 상수(`MIN_BPM`)와 동일화
- 입력 클램프 로직 중복 제거(단일 source of truth)

Acceptance Criteria:
- [x] UI 표시 BPM과 엔진 BPM 불일치가 재현되지 않음
- [x] 관련 컴포넌트에서 상수 직접 하드코딩 제거

### WU-6: NativeAudioService 라이프사이클 정리

작업:
- `start()` 재호출 시 기존 subscription 안전 정리
- isListening 가드/상태 추가

Acceptance Criteria:
- [x] start 연속 호출에서도 listener 중복 등록 없음
- [x] stop 후 메모리/이벤트 누수 없음

### WU-7: useTuner 분해 리팩터링

작업:
- 다음 훅/모듈로 분리:
- `use-tuner-detection-settings`
- `use-tuner-signal-state`
- `use-tuner-history`
- latency debug 유틸 공통화

Acceptance Criteria:
- [x] `use-tuner.ts` 파일 책임 축소(핵심 orchestration만 유지)
- [x] 기존 동작/렌더 결과 동일

### WU-8: Tuner page 로컬스토리지 상태 분리

작업:
- 헤드스톡 레이아웃 저장/구독을 전용 훅으로 이동
- 페이지 컴포넌트는 표현 중심으로 단순화

Acceptance Criteria:
- [x] 페이지 파일 복잡도 감소
- [x] SSR/CSR hydration 경고 없음

### WU-9: 미연결 UI 정리

작업:
- `settings/page.tsx`의 로컬-only 상태를 실제 tuner/metronome state와 연결하거나 scope 밖 UI 제거
- `SessionStats` 더미 데이터 제거 또는 TODO 명시적 처리

Acceptance Criteria:
- [x] 사용자에게 오해를 주는 fake 데이터 제거
- [x] 설정 변경이 실제 동작과 연결됨(또는 숨김)

### WU-10: pre-commit 품질 게이트 수정

작업:
- `HEAD~1..HEAD` 기반에서 staged 파일 기준으로 수정
- 실패 시 명확한 메시지 출력

Acceptance Criteria:
- [x] 신규 변경 파일이 실제로 훅 검증 대상이 됨
- [x] 불필요한 오탐/누락 감소

### WU-11: web/mobile 테스트 최소망 구축

작업:
- `apps/web/project.json`, `apps/mobile/project.json`에 `test` target 추가
- web: bridge parser/permission/tuner hook 핵심 경로 단위 테스트
- mobile: bridge handler protocol 테스트

Acceptance Criteria:
- [x] `pnpm test` 실행 시 web/mobile 핵심 테스트 포함
- [x] bridge 프로토콜 회귀 테스트 존재

### WU-12: UI Guardrail 스크립트 정합성 개선

작업:
- 연도 패턴을 현재 연도 기준으로 확장
- `grep` 기반 규칙의 false-positive 최소화

Acceptance Criteria:
- [x] 규칙이 2026 이후에도 의미 있게 동작
- [x] CI에서 불필요 실패율 감소

### WU-13: dead code/중복 유틸 제거

작업:
- 미사용 훅/컴포넌트(`useAudioPermission`, `PermissionPrompt`, `LoadingScreen`, `ErrorState`) 정리
- `isLatencyDebugEnabled` 중복 구현 통합

Acceptance Criteria:
- [x] 미사용 export/파일 제거 또는 실제 사용 경로 연결
- [x] 동일 유틸 중복 1개로 축소

### WU-14: 문서 업데이트

작업:
- 브릿지 메시지 계약, Android 제약, 테스트 실행 방법 문서화
- 플랜 완료 상태 업데이트

Acceptance Criteria:
- [x] 새 팀원이 문서만 보고 로컬 검증 가능
- [x] 변경된 프로토콜/검증 명령이 README 또는 docs에 반영됨

---

## QA 체크리스트

1. Android 실기기/에뮬레이터에서 튜너 시작 시 크래시 없는지
2. WebView 브릿지 permission 요청이 즉시 완료되는지
3. 메트로놈 백그라운드 복귀 후 템포 burst 없는지
4. 튜너 start/stop 반복 시 CPU/메모리 이상 없는지
5. Settings 값 변경이 실제 튜닝/동작에 반영되는지
6. lint/type-check/test/CI가 모두 통과하는지

---

## Verification Commands

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm --filter @tempo-tune/web dev
pnpm --filter @tempo-tune/mobile type-check
```

필요 시:

```bash
pnpm --filter @tempo-tune/mobile android
pnpm --filter @tempo-tune/mobile ios
```

---

## Claude 실행 지시문 (복붙용)

아래 순서로 작업하세요.

1. WU-1~WU-3(P0) 먼저 완료하고, 각 WU마다 lint/type-check 수행
2. 브릿지 프로토콜은 shared 타입으로 먼저 고정한 뒤 web/mobile 동시 반영
3. WU-4~WU-6에서 메트로놈 타이밍/튜너 라이프사이클 안정화
4. WU-7~WU-9에서 구조 리팩터링 및 미연결 UI 정리
5. WU-10~WU-12에서 품질 게이트/테스트/스크립트 보강
6. WU-13~WU-14로 정리 및 문서 업데이트

필수 제약:

- 변경 중 기능 회귀가 있으면 해당 WU를 완료 처리하지 말 것
- 브릿지 메시지 타입 변경 시 shared/web/mobile을 같은 커밋 범위에서 처리할 것
- 동작 변경이 포함되면 반드시 테스트 또는 재현 스크린샷/로그 근거를 남길 것
