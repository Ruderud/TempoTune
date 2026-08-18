---
id: theme-settings
name: Theme Settings
status: partial
platforms: [web, ios, android]
tests:
  unit: []
  e2eWeb:
    - apps/web/e2e/theme-mode.spec.ts
    - apps/web/e2e/settings.spec.ts
  e2eDevice:
    - apps/mobile/appium/specs/theme-mode.smoke.spec.ts
criticalPaths:
  - apps/web/hooks/use-theme-preference.ts
  - apps/web/lib/theme.ts
  - apps/web/app/(tabs)/settings/page.tsx
manualChecks:
  - system 테마 변경 시 즉시 반영
  - 재실행 후 light/dark 선택 유지
---

# Theme Settings

사용자는 `system`, `light`, `dark` 중 하나를 선택할 수 있고 선택값은 로컬에 저장됩니다. 튜너·메트로놈 고급 옵션과 단축키 실행은 화면에 예고만 되어 있어 아직 기능 범위에 포함하지 않습니다.
