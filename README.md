<!-- TODO: 프로젝트 배너 이미지 추가 -->
<!-- <p align="center"><img src="docs/screenshots/banner.png" alt="TempoTune" width="100%" /></p> -->

<h1 align="center">TempoTune</h1>

<p align="center">
  뮤지션을 위한 올인원 메트로놈 & 튜너.
  <br />
  정밀한 오디오 엔진 위에 구축된, 웹과 모바일 모두에서 동작하는 하이브리드 음악 도구.
</p>

<p align="center">
  <a href="https://tempotune.rudbeckiaz.com">
    <img src="https://img.shields.io/badge/Live-tempotune.rudbeckiaz.com-blue?style=flat-square" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native" />
</p>

<br />

<!-- TODO: 메트로놈/튜너 앱 스크린샷 추가 -->
<!-- <p align="center"><img src="docs/screenshots/demo.png" alt="TempoTune Demo" width="80%" /></p> -->

## Features

- **High-Precision Metronome** — `performance.now()` 기반 스케줄러로 정확한 박자 제공. BPM 30~300, 다양한 박자표(2/4, 3/4, 4/4, 6/8) 지원.
- **Real-Time Tuner** — YIN 알고리즘 기반 피치 감지. 기타(Standard, Drop D)와 베이스(Standard) 튜닝 프리셋 내장.
- **Cross-Platform** — Next.js 웹앱과 React Native 모바일앱이 하나의 코드베이스를 공유하는 하이브리드 아키텍처.
- **Custom Sound** — 메트로놈 클릭 사운드를 직접 업로드하여 사용 가능. 기본 합성음 내장.
- **Cent-Accurate Display** — 목표 음정으로부터의 편차를 센트(cent) 단위로 실시간 표시.
- **Edge Deployment** — Cloudflare Workers에 배포되어 전 세계 어디서든 빠르게 접근.

## Tech Stack

| Layer | Technology |
|---|---|
| **Language** | TypeScript 5.9 |
| **Web** | Next.js 16, React 19, Tailwind CSS 4 |
| **Mobile** | React Native 0.81 (iOS & Android) |
| **Audio Engine** | Web Audio API, YIN Pitch Detection |
| **Monorepo** | Nx 22 + pnpm 10 |
| **Deploy** | Cloudflare Workers (OpenNext) |
| **Monitoring** | Sentry |
| **CI/CD** | GitHub Actions |

## Architecture

```
tempotune/
├── apps/
│   ├── web/                 # Next.js 16 웹 애플리케이션
│   └── mobile/              # React Native 하이브리드 앱
├── packages/
│   ├── audio/               # 메트로놈 & 튜너 오디오 엔진
│   └── shared/              # 공유 타입, 상수, 유틸리티
└── .github/workflows/       # CI/CD 파이프라인
```

**핵심 설계 원칙:**

- `packages/audio`에 플랫폼 독립적인 오디오 엔진을 분리하여 웹/모바일에서 공유
- 모바일 앱은 WebView에 Next.js 앱을 임베드하고, 네이티브 브릿지로 마이크/햅틱 API 연결
- `packages/shared`에 타입과 상수를 중앙화하여 플랫폼 간 일관성 보장

## Quick Start

```bash
# 의존성 설치
pnpm install

# 웹 개발 서버
pnpm --filter @tempo-tune/web dev

# 모바일 (iOS)
pnpm --filter @tempo-tune/mobile ios

# 모바일 (Android)
pnpm --filter @tempo-tune/mobile android
```

## Scripts

```bash
pnpm dev              # 모든 앱 개발 서버 실행
pnpm build            # 모든 프로젝트 빌드
pnpm test             # 모든 프로젝트 테스트 (bridge 회귀 테스트 포함)
pnpm lint             # 모든 프로젝트 린트
pnpm type-check       # TypeScript 타입 체크
pnpm format           # 코드 포맷팅 (Prettier)
```

### 로컬 검증 순서

```bash
# 1. 타입 체크
pnpm -C apps/web exec tsc --noEmit
pnpm --filter @tempo-tune/mobile type-check

# 2. 린트 + 테스트 (bridge 회귀 테스트 포함)
pnpm exec nx affected -t lint
pnpm exec vitest run

# 3. 웹 개발 서버 확인
pnpm --filter @tempo-tune/web dev
```

## Audio Engine

### Metronome

`MetronomeEngine`은 `performance.now()` 기반 고정밀 스케줄러를 사용합니다. `setInterval`의 불정확성을 우회하여 프로 수준의 타이밍 정밀도를 제공합니다.

```typescript
import { MetronomeEngine } from '@tempo-tune/audio';

const engine = new MetronomeEngine({
  bpm: 120,
  timeSignature: [4, 4],
  accentFirstBeat: true,
});

engine.onBeat((beat) => {
  console.log(`Beat ${beat.index} at ${beat.timestamp}ms`);
});

engine.start();
```

### Tuner

`TunerEngine`은 YIN 알고리즘으로 실시간 피치를 감지하고, 가장 가까운 음을 찾아 센트 편차를 계산합니다.

```typescript
import { TunerEngine } from '@tempo-tune/audio';

const tuner = new TunerEngine({
  preset: 'standard-guitar',  // E2 A2 D3 G3 B3 E4
  referenceFrequency: 440,    // A4 = 440Hz
});

tuner.onPitch((result) => {
  console.log(`${result.note} ${result.cents > 0 ? '+' : ''}${result.cents}cents`);
});
```

<!-- TODO: 메트로놈/튜너 동작 GIF 또는 스크린 녹화 추가 -->

## Mobile Bridge Protocol

모바일 앱은 WebView에 Next.js 앱을 임베드하고, JavaScript↔Native 간 메시지로 마이크/햅틱 기능을 연결합니다.

### Message Types

| Type | Direction | Description |
|---|---|---|
| `REQUEST_MIC_PERMISSION` | Web → Native | 마이크 권한 요청 |
| `MIC_PERMISSION_RESPONSE` | Native → Web | 권한 결과 응답 (`{ status: "granted" \| "denied" }`) |
| `START_LISTENING` | Web → Native | 피치 감지 시작 |
| `STOP_LISTENING` | Web → Native | 피치 감지 중지 |
| `PITCH_DETECTED` | Native → Web | 감지된 피치 데이터 전달 |
| `PLAY_CLICK` | Web → Native | 메트로놈 클릭음 재생 |
| `VIBRATE` | Web → Native | 햅틱 피드백 |
| `ERROR` | Native → Web | 네이티브 오류 전달 |

### Message Envelope Format

```typescript
// Web → Native (BridgeMessage)
{ type: BridgeMessageType; data?: unknown; requestId?: string }

// Native → Web (BridgeResponseEnvelope)
{ type: BridgeMessageType; success: boolean; data?: unknown; error?: string; requestId?: string }
```

`requestId`로 요청-응답을 1:1 매핑합니다. `requestPermission()` 호출은 `MIC_PERMISSION_RESPONSE` envelope로 resolve/reject 됩니다.

### Android 제약사항

- **PitchDetectorModule 필수**: Android 네이티브 피치 감지는 `PitchDetectorModule`에 의존합니다. 모듈 미탑재 환경에서는 `ERROR` 메시지를 web에 전송하고 크래시 없이 graceful fallback합니다.
- 모바일 튜너 기능을 사용하려면 Android 네이티브 모듈 빌드가 필요합니다.

## Deployment

웹 앱은 **Cloudflare Workers**에 자동 배포됩니다. `main` 브랜치에 푸시하면 GitHub Actions가 빌드와 배포를 수행합니다.

```
main push → Type Check → Lint → Test → Version Inject → Build & Deploy
```

## License

MIT License &copy; TempoTune

<!-- TODO: 프로젝트 로고 (라이트/다크 테마 대응) 추가 -->
<!--
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/logo-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="docs/logo-light.svg" />
    <img alt="TempoTune" src="docs/logo-light.svg" width="120" />
  </picture>
</p>
-->
