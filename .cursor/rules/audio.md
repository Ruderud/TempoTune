# 오디오 처리 규칙

## Web Audio API (웹)
- **서비스 분리**: `apps/web/services/audio/` 디렉토리에 오디오 관련 서비스 분리
- **에러 핸들링**: 오디오 권한, 디바이스 접근 실패 등 에러 처리 필수

## React Native 오디오
- **네이티브 서비스**: `apps/mobile/src/services/audio/` 디렉토리에 분리
- **권한 관리**: `react-native-permissions` 사용

## 공통 로직
- **패키지 분리**: `packages/audio/`에 메트로놈, 튜너 공통 로직 구현
- **타입 공유**: 오디오 관련 타입은 `packages/shared/types/`에 정의
