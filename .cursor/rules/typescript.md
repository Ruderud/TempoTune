# TypeScript 규칙

## 타입 선언

### 기본 원칙
- **기본적으로 `type` 사용**: `interface`보다 `type` 우선 사용
- **필수적인 경우에만 `interface` 사용**: 확장이 필요한 경우
- **`any` 금지**: 타입 안정성을 위해 `any` 사용 금지, `unknown` 사용 고려

### 타입 예시
```typescript
// ✅ Good
type MetronomeConfig = {
  bpm: number;
  timeSignature: [number, number];
  enabled: boolean;
};

// ❌ Bad
interface MetronomeConfig {
  bpm: number;
  // ...
}
```

## 파일 구조

```typescript
// 1. Imports (Angular core → RxJS → Angular modules → Core → Shared → Relative)
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MetronomeConfig } from '@tempo-tune/shared/types';
import { MetronomeService } from './metronome.service';

// 2. Type/Interface definitions
type ComponentProps = {
  // ...
};

// 3. Component/Service/Class definition
export class ComponentName {
  // Properties
  // Methods
}

// 4. Exports
export { /* ... */ };
```
