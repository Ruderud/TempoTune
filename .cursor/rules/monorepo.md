# 모노레포 규칙 (Nx + pnpm)

## Nx 워크스페이스 규칙

### 프로젝트 생성
- **앱 생성**: `nx generate @nx/next:application web` 또는 `nx generate @nx/react-native:application mobile`
- **라이브러리 생성**: `nx generate @nx/js:library shared`
- **프로젝트 이름**: kebab-case 사용 (예: `shared-types`, `audio-utils`)

### 태스크 실행
- **개발 서버**: `nx serve web` 또는 `nx start mobile`
- **빌드**: `nx build web` 또는 `nx build mobile`
- **테스트**: `nx test <project-name>`
- **린트**: `nx lint <project-name>`
- **타입 체크**: `nx type-check <project-name>`

### 의존성 관리
- **프로젝트 간 의존성**: `nx.json`의 `implicitDependencies` 또는 `project.json`의 `targets`에서 관리
- **타입 의존성**: `tsconfig.base.json`의 `paths`에 경로 매핑 정의

## 공통 패키지 사용

### 타입 공유
```typescript
// packages/shared/src/types/metronome.types.ts
export type MetronomeConfig = {
  bpm: number;
  timeSignature: [number, number];
  enabled: boolean;
};

// apps/web/components/metronome.tsx
import type { MetronomeConfig } from '@tempo-tune/shared/types';
```

### 유틸리티 공유
```typescript
// packages/shared/src/utils/audio.util.ts
export function frequencyToNote(frequency: number): string {
  // Implementation
}

// apps/web/services/tuner.service.ts
import { frequencyToNote } from '@tempo-tune/shared/utils';
```
