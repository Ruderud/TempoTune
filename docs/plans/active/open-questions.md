# Open Questions

## tempotune-implementation - 2026-02-11

### 해결됨
- [x] 튜너 피치 감지 알고리즘 → **YIN 알고리즘** (저음역 정확도, 옥타브 오류 방지)
- [x] 메트로놈 클릭 사운드 → **OscillatorNode 합성 기본 + 커스텀 사운드 업로드 옵션**
- [x] 상태 관리 → **Context API**
- [x] PWA 지원 → **제외** (네이티브 앱 하이브리드이므로 불필요)
- [x] RN 오디오 라이브러리 → **react-native-audio-recorder-player**
- [x] 테스트 프레임워크 → **Vitest** (ESM 네이티브, TS 무설정)

### 추가 결정사항
- [x] 유틸리티 라이브러리 → **es-toolkit** (lodash 금지, ESM-first, tree-shakeable)
- [x] 모바일 USB 오디오 입력 지원 → **네이티브 브리지 중심 관리**
- [x] 공용 오디오 입력 인프라 선행 → **입력 장치 / 캡처 세션 / analyzer 파이프라인 분리**
- [x] 관련 handoff plan 작성 → `docs/plans/active/claude-audio-input-infra-handoff-plan-2026-03-14.md`
- [x] 오디오 입력 ownership 재정렬 → **`packages/audio-input` facade + 플랫폼 adapter 분리**
- [x] 관련 handoff plan 작성 → `docs/plans/active/claude-audio-input-package-bridge-plan-2026-03-14.md`
- [x] 새 오디오 입력 구조 테스트 작업 문서 작성 → `docs/plans/active/claude-audio-input-package-bridge-test-plan-2026-03-14.md`
- [x] 작업 문서 구조 정리 → `docs/README.md`, active handoff 문서는 `docs/plans/active/` 기준 사용
