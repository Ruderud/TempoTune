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

The CI pipeline automatically runs on every PR:

| Job                   | Trigger                          | What it does                              |
| --------------------- | -------------------------------- | ----------------------------------------- |
| **type-check**        | any project affected             | `nx affected -t type-check`               |
| **lint**              | any project affected             | `nx affected -t lint`                     |
| **test**              | audio/shared/mobile/web affected | `nx affected -t test` (Vitest)            |
| **ui-guardrails**     | web affected                     | `bash scripts/check-ui-quality.sh`        |
| **e2e-web**           | web affected                     | Playwright smoke suite (15 tests)         |
| **regression-report** | any project affected             | Feature docs validate + regression impact |

All jobs must pass before merge is allowed.

---

## QA Execution Layers

### Layer 1: Static QA (`pnpm qa`)

Runs without any browser or device. Safe for CI and local dev:

```bash
pnpm qa          # type-check + lint + test + feature docs validate + regression report
pnpm qa:affected  # nx affected 기반 선별 QA
```

### Layer 2: Web E2E (`pnpm qa:web`)

Requires Playwright browsers installed:

```bash
pnpm qa:setup:web   # Install Playwright chromium browser
pnpm qa:web         # Layer 1 + Playwright E2E tests
```

**Playwright tests** (`apps/web/e2e/`):

- `navigation.spec.ts` — Tab navigation (5 tests)
- `metronome-bpm.spec.ts` — BPM controls, time sig, play/stop (5 tests)
- `tuner-shell.spec.ts` — Tuner controls, presets, modes (3 tests)
- `settings.spec.ts` — Settings page load (2 tests)

### Layer 3: Device E2E (`pnpm qa:device`)

Requires connected device or simulator + Appium drivers:

```bash
pnpm qa:setup:device          # Install Appium 2-compatible Android + iOS drivers
pnpm qa:setup:device:android-emu  # Install Android emulator Appium driver set
pnpm qa:setup:device:android-real # Install Android real-device Appium driver set
pnpm qa:setup:device:ios-sim  # Install iOS simulator-only Appium driver
pnpm qa:setup:device:ios-real # Install iOS real-device Appium driver set
pnpm qa:device                # Preflight + bootstrap + Appium smoke tests
pnpm qa:device:android-emu    # Android emulator only, boot emulator if needed, build/install app, run Appium smoke, then shut emulator down
pnpm qa:device:android-real   # Connected Android device only, build/install QA app, run Appium smoke, then close the app
pnpm qa:device:ios-sim        # Booted iOS simulator only, build/install app, run Appium smoke, then shut simulator down
pnpm qa:device:ios-real       # Connected iPhone only, build/install QA app, verify WDA signing, run Appium smoke, then close the app
pnpm qa:full                  # Layer 2 + Layer 3
```

For Android local QA, the Android path now uses a Release APK with embedded JS so Metro is not required.
If you use a local web server instead of `QA_WEB_URL`, the runner will still set `adb reverse` for port `3000`.

For the current local setup, `pnpm qa:device:ios-sim` is the fastest path when an iOS simulator is already booted.
If you already have a connected iPhone, `pnpm qa:device:ios-real` will now build/install the QA app, run the Appium smoke suite, and then terminate the app so a stale WebView error screen is not left open.
If you already have a connected Android phone, `pnpm qa:device:android-real` will build/install the QA app, run the Appium smoke suite, and then force-stop the app.

**Appium tests** (`apps/mobile/appium/specs/`):

- `launch.smoke.spec.ts` — App launch
- `webview-load.smoke.spec.ts` — WebView content load
- `metronome-bridge.smoke.spec.ts` — Metronome start/stop via bridge
- `tuner-permission.smoke.spec.ts` — Mic permission flow

**Device QA reports**:

- `reports/qa/device/latest-device-report.md`
- `reports/qa/device/latest-device-report.json`
- per-target raw WDIO logs are saved in the same directory

### Layer 4: Feature Docs & Regression (`docs/features/`)

Feature docs with YAML frontmatter drive automated regression detection:

```bash
pnpm exec tsx scripts/qa/validate-feature-docs.ts   # Schema validation
pnpm exec tsx scripts/qa/check-regression.ts         # Git diff → affected features
```

---

## Device Testing Prerequisites

### iOS

- Xcode + command line tools installed
- Simulator available (`xcrun simctl list devices`)
- For simulator-only smoke: a booted simulator is enough, and `pnpm qa:device:ios-sim` will build/install the app automatically
- For real devices: `pnpm qa:device:ios-real` now builds and installs a Release QA build via `xcodebuild` + `devicectl`
- For real devices: Web Inspector enabled (Settings → Safari → Advanced → Web Inspector)
- For real devices: Xcode must have the Apple ID account for the WDA signing team added in Xcode > Settings > Accounts
- WDA signing: Xcode must have a valid signing identity for `WebDriverAgentRunner`
- If the iPhone cannot reach your Mac's local IP, set `QA_WEB_URL` to a reachable URL (for example a tunnel URL or a deployed preview URL)

If multiple Apple Development teams exist locally, you can override the auto-selected team:

```bash
QA_IOS_XCODE_ORG_ID=<TEAM_ID> pnpm qa:device:ios-real
```

If WDA provisioning needs a different bundle identifier, override it explicitly:

```bash
QA_IOS_UPDATED_WDA_BUNDLE_ID=com.example.tempotune.wda pnpm qa:device:ios-real
```

Recommended local setup: save your personal signing config in `.env.qa.local`.

```bash
QA_IOS_TEAM_ID=YOUR_TEAM_ID
QA_IOS_SIGNING_ID="Apple Development"
QA_IOS_BUNDLE_ID=com.rud.tempotune
QA_IOS_WDA_BUNDLE_ID=com.rud.tempotune.wda
# Optional: if the iPhone cannot reach http://<local-ip>:3000
QA_WEB_URL=https://your-reachable-tempotune-url.example
```

`pnpm qa:device:ios-real` will automatically read `.env.qa.local`, `.env.local`, then `.env` in that order.

### Android

- Android Studio + SDK + platform-tools
- `adb` in PATH, device/emulator visible (`adb devices`)
- Debug APK built and installed
- For WebView debugging: `WebView.setWebContentsDebuggingEnabled(true)` in app

### Environment Variables (Device E2E)

| Variable              | Values                                    | Default | Description        |
| --------------------- | ----------------------------------------- | ------- | ------------------ |
| `QA_PLATFORM`         | `ios`, `android`, `all`                   | `all`   | Target platform    |
| `QA_DEVICE_MODE`      | `booted`, `connected`, `all`, `allowlist` | `all`   | Device filter      |
| `QA_DEVICE_ALLOWLIST` | comma-separated UDIDs                     | —       | For allowlist mode |
| `QA_WEB_URL`          | full URL                                  | —       | Override WebView URL for real-device QA when local IP is unreachable |
| `QA_ANDROID_APP_PACKAGE` | Android application id                 | `com.tempotune` | Installed-app launch target |
| `QA_ANDROID_APP_ACTIVITY` | Android launch activity               | `com.tempotune.MainActivity` | Installed-app launch activity |
| `QA_ANDROID_SHUTDOWN_EMULATOR_AFTER_RUN` | `0`, `1`           | `0`     | Shut Android emulators down after Appium finishes |
| `QA_IOS_SHUTDOWN_SIMULATOR_AFTER_RUN` | `0`, `1`                    | `0`     | Shut booted simulators down after Appium finishes |

---

## Notes

- **UI screenshot tool** (`.claude/scripts/ui-screenshot.sh`) should be run after every `apps/web/` change
- **Manual viewport tests** can use browser DevTools responsive mode
- **Touch target verification** can use browser accessibility overlays (Chrome DevTools → More tools → Rendering → Show hit-test borders)
- **Contrast ratio** can be checked with browser DevTools color picker or https://webaim.org/resources/contrastchecker/
- **Playwright reports** are uploaded as CI artifacts (14-day retention)
- **Appium device tests** are local/self-hosted only — not included in CI
