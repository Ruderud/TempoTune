---
id: navigation-tabs
name: Tab Navigation
status: implemented
platforms: [web, ios, android]
tests:
  unit: []
  e2eWeb: []
  e2eDevice: []
criticalPaths:
  - apps/web/components/common/tab-navigation.component.tsx
  - apps/web/app/(tabs)/layout.tsx
  - apps/web/app/(tabs)/metronome/page.tsx
  - apps/web/app/(tabs)/tuner/page.tsx
  - apps/web/app/(tabs)/settings/page.tsx
  - apps/web/app/layout.tsx
manualChecks:
  - 모바일 하단 탭바 3개 탭 표시 (메트로놈/튜너/설정)
  - 데스크톱 상단 헤더 내비게이션
  - 활성 탭 하이라이트 상태
  - 탭 전환 시 페이지 상태 유지
  - 320px ~ 1440px 반응형 레이아웃
---

# Tab Navigation

메트로놈, 튜너, 설정 3개 탭으로 구성된 내비게이션.

## Layout

- **Mobile (< lg)**: 하단 고정 탭바 (48px min height)
- **Desktop (>= lg)**: 상단 헤더 내비게이션
- Next.js App Router `(tabs)` 라우트 그룹 사용
- `usePathname()` 기반 활성 탭 감지
