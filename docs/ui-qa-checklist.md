# TempoTune UI Quality Assurance Checklist

This checklist ensures all UI changes meet TempoTune's quality standards before merging.

## Latest Progress (2026-02-14)

- [x] `bash scripts/check-ui-quality.sh` 통과
- [x] Playwright 스크린샷 수집 완료 (`.screenshots/qa/*.png`, 24장)
- [x] 모바일 뷰포트(320/375/414) 확인
- [x] 데스크탑 뷰포트(1024/1280/1440) 확인
- [ ] 다크모드 대비 수동(WCAG 수치) 측정
- [ ] 터치 타겟 간격(8px+) 수동 측정

## Automated Checks ✓

Run the static analysis script to catch common issues:

```bash
bash scripts/check-ui-quality.sh
```

This script enforces:

1. **No hardcoded years (2023-2025)** in source files
2. **No bare `href="#"`** without `data-route` attribute
3. **No text smaller than 12px** (`text-[8-11px]` classes forbidden)
4. **Touch target documentation** (checks for `min-h-[44px]`, `h-11`, etc.)
5. **No hardcoded blue colors** from old design system

**Requirement:** All automated checks must pass (exit code 0) before PR approval.

---

## Manual Checks 🔍

### 1. Mobile Viewport Tests

- [ ] **320px width test** (iPhone SE / small phones)
  - No horizontal scroll
  - All text readable (minimum 12px)
  - All touch targets ≥44px
  - Controls don't overlap or get cut off

- [ ] **375px width test** (iPhone 12/13/14)
  - Layout scales properly
  - No cramped controls
  - Margins/padding feel balanced

- [ ] **414px width test** (iPhone Max models)
  - Uses available space effectively
  - No excessive white space

### 2. Desktop Viewport Tests

- [ ] **1024px width test** (iPad Pro, small laptops)
  - Layout transitions smoothly from mobile
  - Controls appropriately sized
  - No stretched or compressed elements

- [ ] **1280px width test** (Standard laptop)
  - Content centered or max-width applied
  - Visual hierarchy maintained
  - Typography scales appropriately

- [ ] **1440px+ width test** (Large desktop)
  - Content doesn't stretch infinitely
  - Maintains readability
  - No excessive white space

### 3. Dark Mode Verification

- [ ] **Color contrast check**
  - All text meets WCAG AA contrast ratio (4.5:1 minimum)
  - Interactive elements clearly visible
  - No invisible text on dark backgrounds

- [ ] **Accent colors consistent**
  - Primary: `#0DF2F2` (cyan)
  - Hover/Active states use proper shade variations
  - No hardcoded blue colors (`#3b82f6`, etc.)

- [ ] **Borders and dividers visible**
  - Subtle borders don't disappear in dark mode
  - Cards/sections have clear boundaries

### 4. Touch Target Verification

- [ ] **All buttons ≥44px height**
  - Primary action buttons
  - Icon-only buttons
  - Navigation items
  - Drawer handles

- [ ] **Interactive elements well-spaced**
  - Minimum 8px gap between adjacent targets
  - No accidental taps on wrong control

- [ ] **Swipe targets ≥44px**
  - Bottom sheet drag handles
  - Slider thumbs
  - Dismissible cards

### 5. Navigation Flow

- [ ] **All routes accessible**
  - Tab bar works from every screen
  - No dead-end routes
  - Back navigation works as expected

- [ ] **Deep links tested**
  - `/tuner`, `/metronome`, `/settings` direct access
  - `/landing` direct access, `/`는 앱 라우트 정책대로 리디렉션 동작 확인

- [ ] **No `href="#"` remnants**
  - All links have proper `data-route` or `onClick`
  - No placeholder links in production

### 6. Typography Compliance

- [ ] **Minimum 12px enforced**
  - No `text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]`
  - Use `text-xs` (12px) as absolute minimum
  - Prefer `text-sm` (14px) for body text

- [ ] **Heading hierarchy clear**
  - h1: `text-2xl` or larger
  - h2: `text-xl`
  - h3: `text-lg`
  - Body: `text-sm` or `text-base`

### 7. Layout Constraints

- [ ] **Mobile uses `100dvh`** (not `100vh`)
  - Accounts for address bar collapse
  - No content cut off at bottom

- [ ] **No unexpected scrolling**
  - Main layout fills viewport exactly
  - Tab content scrolls independently
  - Modals/drawers overlay without shifting layout

- [ ] **Safe area respected**
  - Bottom tab bar uses `pb-safe`
  - Content doesn't hide behind notches/home indicators

### 8. Performance & Polish

- [ ] **Animations smooth**
  - 60fps transitions
  - No jank on low-end devices
  - Reduced motion respected (`prefers-reduced-motion`)

- [ ] **Loading states present**
  - Skeleton screens for delayed content
  - Spinners for async operations
  - No blank screens during load

- [ ] **Error states handled**
  - Graceful fallbacks for missing data
  - User-friendly error messages
  - Recovery actions provided

---

## Pre-Merge Checklist ✅

Before merging any UI changes:

1. [ ] Run `bash scripts/check-ui-quality.sh` → all checks pass
2. [ ] Test on mobile viewport (320px, 375px)
3. [ ] Test on desktop viewport (1280px)
4. [ ] Verify dark mode contrast
5. [ ] Manually test touch targets
6. [ ] Confirm navigation flow
7. [ ] Run full QA: `pnpm exec nx affected -t type-check lint test`
8. [ ] Take screenshot with `bash .claude/scripts/ui-screenshot.sh` (if applicable)

---

## Continuous Integration

The CI pipeline will automatically run:

- `pnpm exec tsc --noEmit` (type-check)
- `pnpm exec nx affected -t lint`
- `pnpm exec vitest run`
- `bash scripts/check-ui-quality.sh` ← **UI guardrails**

All steps must pass before merge is allowed.

---

## Notes

- **UI screenshot tool** (`.claude/scripts/ui-screenshot.sh`) should be run after every `apps/web/` change
- **Manual viewport tests** can use browser DevTools responsive mode
- **Touch target verification** can use browser accessibility overlays (Chrome DevTools → More tools → Rendering → Show hit-test borders)
- **Contrast ratio** can be checked with browser DevTools color picker or https://webaim.org/resources/contrastchecker/
