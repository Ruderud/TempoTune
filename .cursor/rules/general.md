# TempoTune - 일반 규칙

## 프로젝트 개요
TempoTune은 메트로놈과 기타/베이스 튜너 기능을 제공하는 하이브리드 모바일 앱입니다.
- **아키텍처**: React Native + WebView 하이브리드 앱
- **웹 UI**: Next.js 14+ (App Router)
- **네이티브**: React Native (iOS/Android)
- **모노레포**: Nx + pnpm
- **배포**: GitHub Actions → Cloudflare Pages (웹), App Store/Play Store (네이티브)

## 모노레포 구조

```
TempoTune/
├── apps/
│   ├── mobile/              # React Native 네이티브 앱
│   │   ├── src/
│   │   │   ├── components/  # 네이티브 전용 컴포넌트
│   │   │   ├── services/    # 오디오, 권한 등 네이티브 서비스
│   │   │   ├── bridge/      # WebView 통신 브릿지
│   │   │   └── App.tsx
│   │   ├── android/
│   │   ├── ios/
│   │   └── project.json     # Nx 프로젝트 설정
│   │
│   └── web/                 # Next.js 웹앱
│       ├── app/             # Next.js App Router
│       ├── components/      # UI 컴포넌트
│       ├── hooks/           # React Hooks
│       ├── services/        # Web Audio API 서비스
│       └── project.json     # Nx 프로젝트 설정
│
├── packages/
│   ├── shared/              # 공통 코드
│   │   ├── src/
│   │   │   ├── types/       # 공통 타입 정의
│   │   │   ├── utils/       # 유틸리티 함수
│   │   │   ├── constants/   # 상수
│   │   │   ├── bridge/      # Bridge API 인터페이스 정의
│   │   │   └── index.ts
│   │   └── project.json
│   │
│   └── audio/               # 오디오 관련 공통 로직
│       ├── src/
│       │   ├── metronome/
│       │   ├── tuner/
│       │   └── index.ts
│       └── project.json
│
├── .github/
│   └── workflows/           # GitHub Actions
│
├── nx.json                  # Nx 워크스페이스 설정
├── pnpm-workspace.yaml      # pnpm 워크스페이스
├── package.json             # 루트 package.json
└── tsconfig.base.json       # 루트 TypeScript 설정
```

## 패키지 매니저: pnpm

- **항상 pnpm 사용**: `npm` 또는 `yarn` 대신 `pnpm` 사용
- **워크스페이스**: `pnpm-workspace.yaml`에 정의된 패키지 구조 준수
- **의존성 설치**: `pnpm install` (루트에서 실행)
- **특정 패키지 실행**: `pnpm --filter <package-name> <command>`
- **모든 패키지 실행**: `pnpm -r <command>` 또는 Nx 명령어 사용

## Git 규칙

### 브랜치 전략
- **main**: 프로덕션 브랜치
- **develop**: 개발 브랜치
- **feature/**: 기능 개발 브랜치
- **fix/**: 버그 수정 브랜치

### 커밋 메시지
- **컨벤셔널 커밋**: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:` 사용
- **영어 또는 한국어**: 일관성 유지

## 배포 규칙

### 웹 배포 (Cloudflare Pages)
- **자동 배포**: `apps/web` 변경 시 GitHub Actions로 자동 배포
- **환경 변수**: Cloudflare Pages 환경 변수 설정
- **빌드 명령**: `nx build web`

### 네이티브 배포
- **수동 배포**: 네이티브 코드 변경 시에만 스토어 배포
- **빌드**: `nx build mobile` (iOS/Android 각각)

## 보안 규칙

### WebView
- **HTTPS 필수**: 프로덕션에서는 HTTPS만 사용
- **보안 헤더**: 적절한 보안 헤더 설정
- **CSP**: Content Security Policy 설정

### 환경 변수
- **시크릿 관리**: GitHub Secrets 사용
- **`.env.example`**: 환경 변수 예시 파일 제공

## 문서화

### 코드 주석
- **복잡한 로직**: 주석으로 설명
- **JSDoc**: 공개 API는 JSDoc 주석 작성

### README
- **프로젝트 루트**: 전체 프로젝트 개요
- **각 앱/패키지**: 개별 README.md 제공

## 에러 핸들링

### 에러 타입
- **커스텀 에러**: 의미있는 에러 타입 정의
- **에러 바운더리**: React Error Boundary 사용

### 로깅
- **에러 로깅**: 적절한 에러 로깅 시스템 구축
- **프로덕션**: 민감한 정보 노출 금지

## 추가 참고사항

- **언어**: 모든 응답은 한국어로 작성
- **코드 리뷰**: PR 시 코드 리뷰 필수
- **린터**: ESLint, Prettier 설정 준수
- **타입 체크**: TypeScript strict mode 사용
