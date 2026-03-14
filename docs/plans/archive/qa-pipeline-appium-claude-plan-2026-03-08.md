# TempoTune QA 파이프라인 + Web E2E + Appium On-Device 실행 플랜 (Claude 작업용)

## Context

현재 저장소는 `Nx + pnpm` 모노레포이며, 다음 상태가 확인되어 있다.

- unit test는 존재하지만 web regression을 막는 계층이 충분하지 않다.
- `apps/web`에는 테스트가 있지만 CI `test` job은 현재 web를 제외하고 있다.
- `apps/mobile`은 `react-native-webview` 기반 shell이며, 실제 핵심 UI는 web app가 렌더링한다.
- 모바일 on-device/simulator 자동 검증 체계는 없다.
- UI guardrail 문서는 이미 있으나, 구현 기능과 테스트 커버리지를 연결하는 기계 판독 가능한 feature 문서는 없다.
- 사용자는 루트 `package.json`에서 QA를 실행하고, 앱/패키지 단위로 unit, web E2E, on-device 검증을 수행할 수 있기를 원한다.
- 사용자는 iOS/Android 실기기와 설치된 시뮬레이터/에뮬레이터를 대상으로 한 on-device 실행도 원한다.

중요한 현재 구조적 특이점:

- 모바일 앱은 shell이므로 deep UI 회귀는 web 계층에서 검증하는 것이 더 효율적이다.
- 모바일 on-device 계층은 shell, permission, WebView load, bridge, native metronome/tuner smoke에 집중해야 한다.
- iOS 실기기 요구가 있기 때문에 mobile runner는 `Appium`을 기본 선택으로 한다.
- `Maestro`, `Detox`는 이번 요구를 완전히 충족하지 못하므로 보조 후보로만 취급한다.

---

## Architecture Decisions

### 1) QA orchestration

- 구현 파일은 `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/scripts/qa` 아래에 둔다.
- 실행 경로는 루트 `package.json` + `Nx target`로 노출한다.
- shell script 하나로 모든 로직을 숨기지 말고, app/project 단위 target을 유지한다.

### 2) Feature documentation format

- 별도 YAML registry 디렉토리를 만들지 않는다.
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/docs/features` 아래 Markdown + frontmatter를 source of truth로 사용한다.
- 문서와 기계 판독 metadata를 한 파일에 통합해 중복 관리 비용을 줄인다.

예시 frontmatter:

```md
---
id: metronome.playback
name: Metronome Playback
status: implemented
platforms:
  - web
  - ios
  - android
tests:
  unit:
    - packages/audio/src/metronome/metronome-engine.test.ts
  e2eWeb:
    - apps/web/e2e/metronome-playback.spec.ts
  e2eDevice:
    - apps/mobile/appium/specs/metronome-bridge.smoke.spec.ts
criticalPaths:
  - packages/audio/src/metronome/metronome-engine.ts
  - apps/web/hooks/use-metronome.ts
  - apps/mobile/src/App.tsx
manualChecks:
  - docs/qa/ui-qa-checklist.md
---
```

### 3) Web E2E

- `Playwright`를 사용한다.
- web E2E는 UI flow regression 전담이다.
- audio/mic 의존이 큰 시나리오는 test seam 또는 mock을 먼저 만들고 나서 넣는다.

### 4) Mobile on-device

- `Appium`을 사용한다.
- test runner/client는 `WebdriverIO + Appium` 조합으로 고정한다.
- Android는 `UiAutomator2`, iOS는 `XCUITest` driver를 사용한다.
- Appium scope는 shell/native/bridge smoke에 한정한다.
- physical iOS support가 필요하므로 Maestro/Detox를 기본 runner로 선택하지 않는다.

### 5) Device execution model

- 초기 구현은 `local-dev-attached` 모드로 고정한다.
- mobile on-device smoke는 local web dev server + Metro + debug app attach를 전제로 한다.
- simulator/emulator는 자동 launch를 지원하고, physical device는 설치된 debug build attach를 우선 지원한다.
- release IPA/APK를 빌드해서 배포하는 packaged mode는 1차 구현 범위에서 제외한다.

### 6) Setup contract

- `pnpm qa:setup:web`는 Playwright browser/runtime 설치를 담당한다.
- `pnpm qa:setup:device`는 Appium driver 설치와 mobile preflight 점검을 담당한다.
- Appium drivers는 npm devDependency로 두지 않고, `pnpm exec appium driver install ...` 방식으로 설치한다.
- driver 설치 위치는 global drift를 줄이기 위해 repo-local `APPIUM_HOME=.appium` 기준으로 고정한다.
- `pnpm qa:device`는 실행 전에 preflight를 수행하고, prerequisite 누락 시 actionable error를 출력해야 한다.

### 7) Default execution contract

- `pnpm qa`는 기본적으로 개발자가 언제든 돌릴 수 있는 fast path여야 한다.
- 실기기 연결이 없으면 `pnpm qa`가 실패하면 안 된다.
- 실기기/시뮬레이터 검증은 `pnpm qa:device` 또는 `pnpm qa:full`에서 수행한다.
- `pnpm qa:device`는 prerequisite가 충족되지 않으면 fail-fast 하되, 어떤 준비가 필요한지 바로 알 수 있어야 한다.

---

## Work Objectives

1. 기존 `lint`, `type-check`, `unit test`를 Nx 기준 QA 파이프라인으로 정리한다.
2. web regression을 위한 Playwright smoke suite를 추가한다.
3. iOS/Android simulator + connected device를 대상으로 Appium smoke suite를 추가한다.
4. feature 문서와 테스트/critical path를 연결하여 변경 파일 기준 회귀 리포트를 만든다.
5. Claude가 순차적으로 구현 가능한 수준으로 target, 파일, acceptance criteria를 명확히 정의한다.

---

## Guardrails

### Must Have

- `apps/web`, `apps/mobile`, `packages/audio`, `packages/shared`의 기존 type-check/lint/test 동작 유지
- web unit test를 CI regression gate에 포함
- mobile Appium은 shell/native/bridge smoke에 집중
- feature 문서는 실제 구현된 기능만 `implemented`로 기록
- 실기기 미연결 상태에서도 기본 `pnpm qa`는 실행 가능
- root script와 Nx target 이름을 일관되게 유지

### Must NOT Have

- Appium으로 web UI 전체를 재테스트하려고 시도
- placeholder UI/disabled UI를 implemented feature로 문서화
- 실기기 필요 없는 작업까지 `qa:device`에 묶어 기본 흐름을 느리게 만들기
- raw bash orchestrator만으로 affected/cache 구조를 우회
- Android physical device에서 host resolution 문제를 방치한 채 Appium 도입

### Mobile Scope Rule

- Mobile Appium이 검증하는 것:
- 앱 실행
- WebView 로드
- permission prompt
- web -> native bridge
- native metronome/tuner start/stop smoke
- background/foreground 복귀

- Mobile Appium이 검증하지 않는 것:
- 일반 tab navigation 전체
- BPM slider 세부 회귀
- settings UI 세부 회귀
- 튜너 그래프/레이아웃 세부 회귀

이 항목들은 Playwright가 담당한다.

---

## External References

- Appium Drivers: https://appium.io/docs/en/latest/ecosystem/drivers/
- Appium XCUITest real device config: https://appium.github.io/appium-xcuitest-driver/latest/preparation/real-device-config/
- Appium XCUITest hybrid guide: https://appium.github.io/appium-xcuitest-driver/latest/guides/hybrid/
- Detox docs: https://wix.github.io/Detox/
- Detox devices config: https://wix.github.io/Detox/docs/config/devices/
- Maestro iOS UIKit limitations: https://docs.maestro.dev/get-started/supported-platform/ios/uikit

Claude는 위 링크를 필요 시 참고하되, 이번 구현 기본안은 Appium 기준으로 진행한다.

---

## 대상 파일 (핵심)

### Root / Infra
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/package.json`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/nx.json`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/pnpm-workspace.yaml`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/.github/actions/setup/action.yml`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/.github/workflows/deploy.yml`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/.gitignore`

### QA Scripts / Docs
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/scripts/qa/validate-feature-docs.ts` (신규)
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/scripts/qa/check-regression.ts` (신규)
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/scripts/qa/check-mobile-preflight.ts` (신규)
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/scripts/qa/bootstrap-device-run.ts` (신규)
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/scripts/qa/discover-mobile-targets.ts` (신규)
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/scripts/qa/run-appium.ts` (신규)
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/docs/features/` (신규 디렉토리)
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/docs/qa/ui-qa-checklist.md`

### Web
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/package.json`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/project.json`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/playwright.config.ts` (신규)
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/e2e/` (신규)
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/components/common/tab-navigation.component.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/components/metronome/metronome-control.component.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/components/tuner/tuner-control.component.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/app/page.tsx`

### Mobile
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/package.json`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/project.json`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/src/App.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/scripts/generate-dev-config.sh`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/wdio.conf.ts` (신규)
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/appium/specs/` (신규)
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/mobile/appium/helpers/` (신규)

---

## Task Flow (우선순위 순)

```text
Phase 0: Baseline Hardening
  [WU-1] CI baseline fix (web test 포함, Node version 정합성)
  [WU-2] root QA dependencies + setup contract 추가

Phase 1: QA Target Scaffold
  [WU-3] root package scripts + Nx target 정리
  [WU-4] feature docs validator / regression report 스크립트 추가

Phase 2: Feature Documentation
  [WU-5] docs/features frontmatter 스키마 도입 + 실제 feature 문서 작성

Phase 3: Web Regression Layer
  [WU-6] stable selector/accessibility 정리
  [WU-7] Playwright web smoke suite 추가

Phase 4: Mobile On-Device Layer
  [WU-8] device preflight + local runtime bootstrapping
  [WU-9] Appium runner/config + target discovery 추가
  [WU-10] Appium smoke tests 작성
  [WU-11] device matrix 실행 플로우 정리

Phase 5: CI / Docs / Final QA
  [WU-12] CI에 web e2e + docs validation + regression report 반영
  [WU-13] 실행 문서/운영 문서 업데이트
```

---

## Detailed Work Units

### WU-1: CI baseline fix

작업:
- `.github/workflows/deploy.yml`의 `test` job이 web를 제외하는 구조를 수정
- web affected 시 `apps/web` test도 CI에서 실행되도록 변경
- `.github/actions/setup/action.yml`의 Node version과 root `engines` 정책 정합성 검토 후 통일

Acceptance Criteria:
- [ ] web 관련 변경 시 CI에서 `apps/web` unit test가 실행됨
- [ ] 로컬/CI Node version mismatch가 설명 가능하거나 제거됨
- [ ] `pnpm test`와 CI 결과가 구조적으로 일치함

### WU-2: root QA dependencies + setup contract 추가

작업:
- root devDependencies에 공통 QA helper 도구 추가
- 최소 후보:
- `tsx`
- `gray-matter` 또는 동등 frontmatter parser
- `glob`
- `apps/web/package.json`에 Playwright 추가
- 최소 후보:
- `@playwright/test`
- `apps/mobile/package.json`에 Appium runner/client 추가
- 최소 후보:
- `appium`
- `webdriverio`
- `@wdio/cli`
- `@wdio/local-runner`
- `@wdio/mocha-framework`
- `@wdio/spec-reporter`
- Playwright browser install, Appium driver install 절차를 스크립트로 노출
- Appium drivers는 `qa:setup:device`에서 CLI 설치
- 권장 설치 방식:
- `APPIUM_HOME=.appium pnpm exec appium driver install uiautomator2`
- `APPIUM_HOME=.appium pnpm exec appium driver install xcuitest`

권장 스크립트:

```json
{
  "qa:setup:web": "...",
  "qa:setup:device": "..."
}
```

Acceptance Criteria:
- [ ] QA helper scripts가 로컬/CI에서 실행 가능
- [ ] parser/runner dependency가 workspace 기준으로 정리됨
- [ ] Appium/Playwright 설치 지침이 문서와 스크립트에 반영됨
- [ ] Appium driver 설치 전략이 npm devDep가 아닌 CLI install로 명시됨

### WU-3: root package scripts + Nx target 정리

작업:
- 루트 `package.json`에 아래 스크립트 추가

```json
{
  "qa:setup:web": "...",
  "qa:setup:device": "...",
  "qa": "...",
  "qa:affected": "...",
  "qa:web": "...",
  "qa:device": "...",
  "qa:full": "..."
}
```

- `apps/web/project.json`에 `e2e` target 추가
- `apps/mobile/project.json`에 `e2e-device` 및 `e2e-device-discover` target 추가
- `nx.json`에 `e2e` 계열 targetDefaults/cacheableOperations 반영

권장 실행 의미:
- `qa`: type-check + lint + unit + feature docs validate + regression report
- `qa:affected`: `nx affected` 기반 선별 QA(type-check + lint + unit + feature docs validate + regression report)
- `qa:web`: `qa` + web Playwright
- `qa:device`: preflight + bootstrap + Appium device/simulator smoke
- `qa:full`: `qa:web` + `qa:device`

Acceptance Criteria:
- [ ] 루트에서 QA 진입점이 일관되게 제공됨
- [ ] app/project 단위로도 target 실행 가능
- [ ] `pnpm qa`가 실기기 없이도 실행 가능

### WU-4: feature docs validator / regression report

작업:
- `scripts/qa/validate-feature-docs.ts`
- frontmatter 필수 필드 검증
- status 값 검증
- tests path / criticalPaths path 존재 여부 검증
- `scripts/qa/check-regression.ts`
- `git diff --name-only` 기준 변경 파일 수집
- feature docs의 `criticalPaths`와 매칭
- 영향받은 feature 목록과 test refs 출력

Acceptance Criteria:
- [ ] feature 문서 누락/오타/path mismatch를 잡아냄
- [ ] 변경 파일 기준 영향받는 feature 리포트가 출력됨
- [ ] `NO TESTS`, `PARTIAL`, `IMPLEMENTED` 구분이 출력됨

### WU-5: docs/features frontmatter 스키마 도입 + 실제 feature 문서 작성

작업:
- `/docs/features` 디렉토리 생성
- 최소 문서 단위:
- metronome.playback
- metronome.bpm-control
- navigation.tabs
- tuner.pitch-detection
- bridge.webview-protocol
- settings.general 상태는 현재 구현 수준에 맞춰 `partial` 또는 `planned`

필수 frontmatter:
- `id`
- `name`
- `status`
- `platforms`
- `tests`
- `criticalPaths`
- `manualChecks`
- 실제 코드 기준으로 feature status를 판별
- 다음과 같은 현재 상태를 반영:
- settings placeholder는 `partial` 또는 `planned`
- disabled metronome sound presets는 `planned`
- bridge/native metronome path는 구현 여부에 따라 status 명시

Acceptance Criteria:
- [ ] feature 문서가 현재 shipped behavior와 일치
- [ ] Claude가 feature status를 과장하지 않음
- [ ] `docs/qa/ui-qa-checklist.md`와 중복 없이 연결됨

### WU-6: stable selector/accessibility 정리

작업:
- Playwright/Appium용 stable locator를 도입
- 우선순위:
- `aria-label`
- 명시적 button name
- 필요한 경우 `data-testid`

대상 예시:
- 탭 내비게이션
- 메트로놈 시작/정지
- BPM slider
- 튜너 시작/정지
- 주요 preset/mode toggle

Acceptance Criteria:
- [ ] web/mobile automation이 brittle text selector에 과도하게 의존하지 않음
- [ ] DOM/UI 변경에도 smoke test 유지보수성이 확보됨

### WU-7: Playwright web smoke suite 추가

작업:
- `apps/web/playwright.config.ts`
- `apps/web/e2e/navigation.spec.ts`
- `apps/web/e2e/metronome-bpm.spec.ts`
- `apps/web/e2e/metronome-playback.spec.ts`는 오디오 의존성 안정화 후 도입
- `apps/web/e2e/tuner-shell.spec.ts`는 mic 없는 범위에서만 smoke
- deep mic/audio 테스트는 mock/test seam 이후에만 추가

최소 web smoke 범위:
- `/` -> `/metronome` redirect
- 탭 내비게이션
- BPM 변경 UI
- settings 페이지 로드

Acceptance Criteria:
- [ ] 브라우저 환경에서 최소 사용자 흐름이 자동 검증됨
- [ ] 실제 mic/audio hardware 없이도 안정적으로 통과하는 suite만 기본 포함

### WU-8: device preflight + local runtime bootstrapping

작업:
- `scripts/qa/check-mobile-preflight.ts` 추가
- local 실행에 필요한 prerequisite를 점검
- 필수 점검 항목:
- `adb`
- Android emulator CLI
- `xcrun simctl`
- `xcodebuild`
- Appium 설치 여부
- Appium driver 설치 여부
- iOS real device 실행 시 WebDriverAgent signing 전제조건
- iOS real device 실행 시 Web Inspector / 개발자 설정 안내

- `scripts/qa/bootstrap-device-run.ts` 추가
- 초기 구현의 device 실행 모드를 `local-dev-attached`로 명시
- bootstrap 책임:
- `apps/mobile/scripts/generate-dev-config.sh` 실행
- `apps/mobile/src/App.tsx` / dev URL 로직이 Android physical device에도 맞는지 검토
- Next dev server 준비 여부 확인
- Metro 준비 여부 확인
- target device/simulator용 app launch/install 경로 결정
- simulator/emulator는 자동 launch 가능하도록
- physical device는 기본적으로 이미 설치된 debug build attach를 우선 지원
- 필요 시 `adb reverse` 같은 Android preflight 수행

Acceptance Criteria:
- [ ] `qa:device` 실행 전에 prerequisite 누락을 명확한 메시지로 보여줌
- [ ] iOS simulator / Android emulator / connected device 각각에 대해 bootstrap 경로가 정의됨
- [ ] Android physical device의 host/port preflight가 자동화됨
- [ ] iOS real device의 WDA signing / Web Inspector prerequisite가 Phase 4 시작 전에 검증 가능함

### WU-9: Appium runner/config + target discovery

작업:
- `apps/mobile/wdio.conf.ts` 추가
- `scripts/qa/discover-mobile-targets.ts` 추가
- discovery 대상:
- connected Android device
- available Android emulator/AVD
- booted/available iOS simulator
- connected iOS device

출력 형태:
- JSON summary
- 사람이 읽는 table summary

WebdriverIO/Appium 실행 규칙:
- WDIO가 Appium session lifecycle을 관리
- Appium server는 `run-appium.ts` 또는 WDIO service로 관리

Appium capability 규칙:
- Android:
- `platformName=Android`
- `automationName=UiAutomator2`
- `udid`
- WebView 필요 시 `autoWebview` 또는 수동 context switch
- 병렬 시 unique `systemPort`, `chromedriverPort`
- iOS:
- `platformName=iOS`
- `automationName=XCUITest`
- `udid`
- 필요 시 `bundleId` 또는 signed app path
- 병렬 시 unique `wdaLocalPort`

Acceptance Criteria:
- [ ] 현재 연결된 실기기와 사용 가능한 simulator/emulator를 식별 가능
- [ ] 실행할 target list를 스크립트로 생성 가능
- [ ] 병렬 포트 충돌 전략이 정리됨
- [ ] WDIO 기준으로 TS spec 실행 구조가 확정됨

### WU-10: Appium smoke tests 작성

작업:
- `apps/mobile/appium/specs/launch.smoke.spec.ts`
- `apps/mobile/appium/specs/webview-load.smoke.spec.ts`
- `apps/mobile/appium/specs/metronome-bridge.smoke.spec.ts`
- `apps/mobile/appium/specs/tuner-permission.smoke.spec.ts`

Smoke 시나리오:
- 앱이 실행된다.
- WebView가 기본 route를 로드한다.
- 메트로놈 시작/정지 시 UI state가 변한다.
- 튜너 시작 시 permission flow가 동작한다.
- background -> foreground 후 앱이 복귀한다.

중요:
- Appium은 가능하면 실제 화면 흐름에서 검증
- iOS real device WebView context 진입이 불안정하면 native context smoke만 유지하고 deep UI는 Playwright로 남긴다.

Acceptance Criteria:
- [ ] Android emulator에서 smoke 통과
- [ ] iOS simulator에서 smoke 통과
- [ ] 최소 1대 physical device(iOS 또는 Android)에서 smoke 검증 가능

### WU-11: device matrix 실행 플로우 정리

작업:
- `qa:device` 실행 시 기본 정책 정의

권장 정책:
- booted simulator + connected physical device 우선
- booted simulator가 없으면 allowlist된 simulator/emulator만 자동 부팅
- 모든 설치 기기를 무조건 다 돌리지 않음
- 환경 변수로 선택 가능:
- `QA_PLATFORM=ios|android|all`
- `QA_DEVICE_MODE=booted|connected|all|allowlist`
- `QA_ALLOWLIST=...`

Acceptance Criteria:
- [ ] 실행 시간이 통제 가능
- [ ] 사용자가 현재 연결된 기기 대상으로 쉽게 smoke를 돌릴 수 있음

### WU-12: CI에 web e2e + docs validation + regression report 반영

작업:
- PR CI에 아래를 추가
- feature docs validate
- regression report
- web Playwright smoke
- device Appium은 기본 CI가 아니라 local/self-hosted 전용으로 시작

주석:
- connected physical device를 CI에서 돌리려면 self-hosted macOS runner가 사실상 필요
- GitHub hosted runner를 전제로 physical device를 기본 gate로 두지 않는다.
- GitHub Actions에서 web Playwright를 돌리기 위한 browser install 단계를 포함한다.

Acceptance Criteria:
- [ ] PR에서 web regression + feature docs + regression report가 자동 실행
- [ ] device QA는 local 또는 self-hosted에서 재현 가능
- [ ] CI setup에 Playwright runtime 설치 단계가 명시됨

### WU-13: 실행 문서/운영 문서 업데이트

작업:
- `docs/qa/ui-qa-checklist.md`를 새 구조에 맞게 업데이트
- Appium 실행 전제조건 문서화
- iOS real device 준비사항 문서화
- Android physical device preflight(`adb reverse` 또는 host IP) 문서화
- `.omc/plans` 플랜 문서를 최종 반영 상태로 유지

Acceptance Criteria:
- [ ] 새 팀원이 문서만 보고 `qa`, `qa:web`, `qa:device` 실행 가능
- [ ] physical device 준비사항이 문서에 명시됨

---

## QA 체크리스트

1. web 변경 시 CI가 web unit test와 web Playwright smoke를 모두 실행하는지
2. `pnpm qa`가 실기기 없이 통과 가능한지
3. `pnpm qa:device`가 연결된 Android/iOS target을 감지하는지
4. Android physical device에서 local web URL resolution이 되는지
5. iOS simulator에서 앱 실행 + WebView load + metronome smoke가 되는지
6. Android emulator에서 앱 실행 + WebView load + tuner permission smoke가 되는지
7. feature docs validator가 잘못된 path/status를 잡는지
8. regression report가 변경된 critical path를 feature 단위로 보여주는지

---

## Verification Commands

기본:

```bash
pnpm qa:setup:web
pnpm qa:setup:device
pnpm qa
pnpm qa:affected
pnpm qa:web
pnpm qa:device
pnpm qa:full
```

개별:

```bash
pnpm exec nx run web:test
pnpm exec nx run web:e2e
pnpm exec nx run mobile:test
pnpm exec nx run mobile:e2e-device-preflight
pnpm exec nx run mobile:e2e-device-bootstrap
pnpm exec nx run mobile:e2e-device-discover
pnpm exec nx run mobile:e2e-device
pnpm exec tsx scripts/qa/validate-feature-docs.ts
pnpm exec tsx scripts/qa/check-regression.ts
```

선택 실행:

```bash
QA_PLATFORM=ios pnpm qa:device
QA_PLATFORM=android pnpm qa:device
QA_DEVICE_MODE=connected pnpm qa:device
QA_DEVICE_MODE=booted pnpm qa:device
```

---

## Deliverables

- 루트 QA 진입점(`qa`, `qa:affected`, `qa:web`, `qa:device`, `qa:full`)
- setup/preflight/bootstrap 스크립트(`qa:setup:web`, `qa:setup:device`)
- web Playwright smoke suite
- mobile Appium smoke suite
- mobile target discovery 스크립트
- feature docs + frontmatter validator
- regression report 스크립트
- CI 반영
- 실행 문서 업데이트

---

## Claude 실행 지시문 (복붙용)

다음 요구사항을 순서대로 구현하세요.

1. CI baseline을 먼저 정리해서 web unit test가 gate에 포함되게 만들 것
2. root QA 스크립트와 Nx target을 추가해 `qa`, `qa:affected`, `qa:web`, `qa:device`, `qa:full` 실행 경로를 만들 것
3. `qa:setup:web`, `qa:setup:device`, device preflight/bootstrap 경로를 먼저 만들 것
4. mobile Appium runner/client는 `WebdriverIO + Appium`으로 고정할 것
5. 별도 YAML registry 대신 `docs/features/*.md` frontmatter를 source of truth로 도입할 것
6. feature docs validator와 regression report 스크립트를 추가할 것
7. web regression용 Playwright smoke suite를 추가할 것
8. mobile on-device는 Appium으로 구현하되, WebView shell 특성상 shell/native/bridge smoke에 한정할 것
9. Android physical device의 local web host 문제를 먼저 해결한 뒤 Appium을 붙일 것
10. iOS real device의 WDA signing / Web Inspector prerequisite를 Phase 4 초기에 검증할 것
11. iOS/Android simulator + connected device discovery 스크립트를 추가할 것
12. device QA는 기본 `pnpm qa`가 아니라 `pnpm qa:device`와 `pnpm qa:full`에서 실행되게 할 것
13. CI에는 우선 web Playwright + docs validation + regression report를 넣고, Appium physical device는 local/self-hosted 전용으로 시작할 것
14. 문서 업데이트까지 완료할 것

필수 제약:

- placeholder 기능을 implemented로 문서화하지 말 것
- Appium으로 web UI 전체를 재검증하지 말 것
- 실기기 미연결 상태에서 기본 `pnpm qa`가 실패하게 만들지 말 것
- Appium server만 설치하고 runner/client 결정을 미루지 말 것
- setup/install 단계를 문서에만 남기지 말고 스크립트로 노출할 것
- raw shell aggregator 하나로 Nx 구조를 무력화하지 말 것
- 수정 후 검증 명령 결과와 남은 리스크를 보고할 것
