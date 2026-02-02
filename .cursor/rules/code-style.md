# 코드 스타일 규칙

## 파일 네이밍 컨벤션

### React/Next.js 컴포넌트
- **컴포넌트 파일**: `kebab-case.component.tsx` (예: `metronome-control.component.tsx`)
- **컴포넌트 디렉토리**: 컴포넌트가 복잡해지면 디렉토리로 분리
  ```
  /metronome-control/
    index.tsx
    /components/
      MetronomeControlButton.tsx
      MetronomeControlSlider.tsx
  ```

### React Native 컴포넌트
- **네이티브 컴포넌트**: `kebab-case.tsx` (예: `native-audio-bridge.tsx`)
- **서비스**: `kebab-case.service.ts` (예: `audio-recorder.service.ts`)

### 공통 패키지
- **타입 파일**: `kebab-case.types.ts` (예: `metronome.types.ts`)
- **유틸리티**: `kebab-case.util.ts` (예: `audio.util.ts`)
- **상수**: `kebab-case.constants.ts` (예: `audio.constants.ts`)

### 일반 규칙
- **모든 파일명**: kebab-case
- **디렉토리명**: kebab-case
- **컴포넌트명**: PascalCase (파일 내부)
- **함수/변수명**: camelCase
- **상수**: UPPER_SNAKE_CASE

## 코드 스타일

### 문자열
- **작은따옴표 사용**: `'string'` (큰따옴표 금지)
- **템플릿 리터럴**: 문자열 보간 또는 멀티라인 문자열에 사용

### 들여쓰기
- **2칸 스페이스**: 탭 사용 금지
- **트레일링 공백 금지**: 줄 끝 공백 제거

### 변수 선언
- **`const` 우선**: 변경 불가능한 값은 `const` 사용
- **`let`은 변경이 필요한 경우에만**: `var` 사용 금지
- **의미있는 이름**: `isUserLoggedIn`, `userPermissions`, `fetchData()` 등

### 로깅
- **디버그 로그**: `console.log('!!DEBUG [컨텍스트] 파라미터명:', value)`
- **프로덕션 로그**: 적절한 로깅 라이브러리 사용 (예: `winston`, `pino`)

### 예시
```typescript
// ✅ Good
console.log('!!DEBUG [MetronomeService.start] bpm:', bpm);
console.log('!!DEBUG [TunerService.detectPitch] frequency:', frequency);

// ❌ Bad
console.log(bpm);
console.log('frequency:', frequency);
```

## Import 순서

1. **Angular core 및 common 모듈** (해당하는 경우)
2. **RxJS 모듈** (해당하는 경우)
3. **Angular 특정 모듈** (FormsModule 등)
4. **Core 애플리케이션 imports**
5. **Shared 모듈 imports** (`@tempo-tune/shared/*`)
6. **환경별 imports** (`environment.ts` 등)
7. **상대 경로 imports** (`./`, `../`)

### 예시
```typescript
// 1. React/Next.js core
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { z } from 'zod';

// 3. Shared packages
import type { MetronomeConfig } from '@tempo-tune/shared/types';
import { frequencyToNote } from '@tempo-tune/shared/utils';

// 4. Environment
import { env } from '@/env';

// 5. Relative imports
import { MetronomeService } from './metronome.service';
import './metronome.styles.css';
```
