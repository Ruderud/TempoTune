---
id: core-feature-quality-contract
name: Core Feature Quality Contract
status: partial
platforms: [web, ios, android]
tests:
  unit:
    - packages/audio/src/metronome/metronome-engine.test.ts
    - packages/audio/src/tuner/audio-fixtures.test.ts
    - packages/audio/src/tuner/pitch-detector.test.ts
    - packages/audio/src/rhythm/rhythm-engine.test.ts
  e2eWeb:
    - apps/web/e2e/metronome-bpm.spec.ts
    - apps/web/e2e/tuner-audio-input.spec.ts
    - apps/web/e2e/navigation.spec.ts
    - apps/web/e2e/theme-mode.spec.ts
  e2eDevice:
    - apps/mobile/appium/specs/metronome-bridge.smoke.spec.ts
    - apps/mobile/appium/specs/tuner-audio-input.smoke.spec.ts
    - apps/mobile/appium/specs/rhythm-audio-sample.smoke.spec.ts
criticalPaths:
  - packages/audio/src
  - packages/audio-input/src
  - apps/web/hooks
  - apps/web/services/audio
  - apps/mobile/ios/TempoTune
  - apps/mobile/android/app/src/main/java/com/tempotune
manualChecks:
  - 실제 기기에서 유선·내장 마이크별 튜너 오차 확인
  - 백그라운드와 잠금 화면에서 메트로놈 장시간 재생 확인
  - 모바일과 데스크톱에서 네 개 탭 및 테마 상태 확인
---

# 핵심 기능 품질 기준

기준일은 2026-08-19입니다. 코드, 기능 문서, 자동화 테스트, 합성 QA 음원을 전수 확인했습니다. 실제 악기와 마이크 조합, 물리 기기의 장시간 재생은 자동화만으로 확정할 수 없어 후속 수동 검증으로 남깁니다.

## 문제와 목표

메트로놈은 짧은 실행에서는 드러나지 않는 sample 반올림 누적 오차가 있었고, 튜너는 마이크 분석 창이 짧아 베이스 E1을 포함한 저음 정확도가 떨어졌습니다. 목표는 핵심 기능의 성공 조건을 문서와 회귀 테스트에 함께 고정하고 웹·iOS·Android가 같은 정확도 기준을 따르게 하는 것입니다.

## 기능 범위

| 영역 | 사용자 기능 | 현재 상태 | 대표 검증 |
| --- | --- | --- | --- |
| 앱 셸 | 메트로놈·튜너·박자·설정 탭, 반응형 이동 | 구현 | Web E2E |
| 메트로놈 | 재생/정지, BPM, 박자표, 강박, Tap Tempo | 구현 | 단위·Web E2E·Appium |
| 모바일 메트로놈 | 백그라운드, 잠금 화면, 알림·위젯 제어 | 구현 | Appium + 실제 기기 점검 필요 |
| 튜너 | 마이크 수음, 음명·octave·cents 감지, Auto/Manual | 구현 | 19개 WAV 회귀 + Web E2E·Appium |
| 튜닝 프리셋 | Guitar Standard, Guitar Drop D, Bass Standard | 구현 | 단위 테스트 |
| 박자 연습 | 입력 onset과 기준 박자의 early/on-time/late 판정 | 구현 | 단위·Appium |
| 오디오 입력 | 권한, 장치 선택, 단일 capture session, route 변경 | 구현 | 단위·브리지 테스트 |
| 설정 | system/light/dark 테마 저장 | 구현 | Web E2E·Appium |
| 고급 설정 | 튜너·메트로놈 옵션, 단축키 실행 | 준비 중 | 문구 표시만 확인 |

## 정확도 정책

- 메트로놈: 각 beat deadline은 시작 sample 기준 절대 위치로 계산합니다. 소수 sample을 beat마다 버리지 않으며 44.1kHz, 123 BPM, 6시간 회귀에서 이상적인 위치와의 오차가 0.5 sample 이하여야 합니다.
- 웹 메트로놈: 123 BPM, 6시간 동안 예약 timestamp의 누적 위상 오차는 0.001ms 미만이어야 합니다. 브라우저·OS의 순간적인 callback 지연은 누적 drift와 별도로 봅니다.
- 튜너: 안정 구간의 유효 분석 창 90% 이상에서 음을 검출하고, 검출 오차 p95는 목표음 대비 5 cents 이하여야 합니다. 5 cents는 화면의 in-tune 판정과 같습니다.
- 튜너 입력 범위: 기본 감지 범위는 35–1400Hz이며 분석 창은 4096 samples입니다. 저지연 capture frame과 pitch 분석 창은 분리합니다.
- 합성 음원: bass·guitar 배음, 미세 vibrato, 결정론적 noise를 포함하며 생성기를 다시 실행해도 같은 파일이 나와야 합니다. 실제 공간 반사나 기기별 마이크 특성을 대체하지는 않습니다.

## 상태와 예외

오디오 기능은 `idle → starting → running → idle` 순서로 움직이며 권한 거부, 장치 소실, capture 실패는 `error`로 전환합니다. 튜너의 저신뢰·무신호 입력은 음을 추정하지 않고 마지막 표시를 정리합니다. 브라우저가 장시간 멈췄다가 복귀하면 웹 메트로놈은 밀린 beat를 한꺼번에 재생하지 않고 기존 위상을 유지한 채 건너뜁니다. 모바일 메트로놈의 BPM 변경은 다음 beat interval부터 반영합니다.

## 인수 조건

- 19개 단음 WAV가 각각 검출률 90% 이상, 오차 p95 5 cents 기준을 통과합니다.
- Android fractional sample clock과 웹 6시간 clock 회귀가 통과합니다.
- 웹 unit/type-check/lint/build와 핵심 E2E가 통과합니다.
- Android unit test와 debug build, iOS compile이 통과합니다.
- Appium에서 bass E1, guitar A2·D3·E2, reference C5가 native capture 경로로 감지됩니다.

## 결정과 미확정 항목

5 cents, 35–1400Hz, 4096 samples는 웹과 양쪽 네이티브 구현에 반영한 확정 기준입니다. 실제 악기의 attack 구간 처리, Bluetooth 입력 지연 보정, 기기별 YIN 처리 시간과 장시간 drift 허용치는 측정 자료가 부족해 미확정입니다. 배포 전에는 최소 1대의 iOS와 Android 실제 기기에서 YIN 처리 시간이 2048-sample capture 주기보다 짧은지 측정하고, 30분 이상 메트로놈 재생과 내장 마이크 튜너 검증을 수행해야 합니다.
