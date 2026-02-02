# Next.js/React 웹 규칙

## React/Next.js 규칙

### 컴포넌트 구조
- **함수 컴포넌트 사용**: 클래스 컴포넌트 사용 금지
- **Server Components 기본**: Client Components는 `'use client'` 명시
- **컴포넌트 분리**: 단일 책임 원칙 준수

### Hooks 사용
- **Custom Hooks**: `use` 접두사 사용 (예: `useMetronome`, `useTuner`)
- **의존성 배열**: `useEffect`, `useMemo`, `useCallback`의 의존성 배열 정확히 명시

### 상태 관리
- **로컬 상태**: `useState` 사용
- **전역 상태**: 필요시 Context API 또는 상태 관리 라이브러리
- **서버 상태**: React Query 또는 SWR 고려

### 예시
```typescript
'use client';

import { useState, useEffect } from 'react';
import type { MetronomeConfig } from '@tempo-tune/shared/types';

export function Metronome() {
  const [config, setConfig] = useState<MetronomeConfig>({
    bpm: 120,
    timeSignature: [4, 4],
    enabled: false,
  });

  useEffect(() => {
    // Effect logic
  }, [config.bpm]);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

## 성능 최적화

### Next.js
- **이미지 최적화**: `next/image` 사용
- **코드 스플리팅**: 동적 import 사용
- **서버 컴포넌트**: 가능한 한 Server Components 사용
