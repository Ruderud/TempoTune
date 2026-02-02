# TempoTune

메트로놈과 기타/베이스 튜너 기능을 제공하는 하이브리드 모바일 앱

## 프로젝트 구조

```
TempoTune/
├── apps/
│   ├── mobile/          # React Native 네이티브 앱
│   └── web/              # Next.js 웹앱
├── packages/
│   ├── shared/          # 공통 코드 (타입, 유틸리티, 상수)
│   └── audio/            # 오디오 관련 공통 로직
```

## 기술 스택

- **모노레포**: Nx + pnpm
- **웹**: Next.js 14+ (App Router)
- **모바일**: React Native
- **언어**: TypeScript
- **패키지 매니저**: pnpm 10.x
- **Node.js**: 24.x (LTS)

## 시작하기

### 필수 요구사항

- Node.js >= 24.0.0
- pnpm >= 10.0.0

### 설치

```bash
# 의존성 설치
pnpm install
```

### 개발

```bash
# 모든 앱 개발 서버 실행
pnpm dev

# 특정 앱만 실행
nx serve web
nx start mobile
```

### 빌드

```bash
# 모든 프로젝트 빌드
pnpm build

# 특정 프로젝트 빌드
nx build web
nx build mobile
```

## 앱 초기화 가이드

### Next.js 웹앱

```bash
cd apps
npx create-next-app@latest web --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

### React Native 모바일 앱

```bash
cd apps
npx react-native@latest init mobile --template react-native-template-typescript
```

각 앱 초기화 후 `project.json` 파일을 생성하여 Nx 워크스페이스에 등록해야 합니다.

## 스크립트

- `pnpm dev` - 모든 앱 개발 서버 실행
- `pnpm build` - 모든 프로젝트 빌드
- `pnpm test` - 모든 프로젝트 테스트
- `pnpm lint` - 모든 프로젝트 린트
- `pnpm type-check` - 모든 프로젝트 타입 체크
- `pnpm format` - 코드 포맷팅
- `pnpm clean` - 빌드 캐시 및 아티팩트 정리

## 라이선스

MIT
