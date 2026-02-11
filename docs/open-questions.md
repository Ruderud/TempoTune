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
