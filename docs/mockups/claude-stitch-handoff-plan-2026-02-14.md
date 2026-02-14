# Claude Handoff Plan (Stitch Mockups)

작성일: 2026-02-14  
대상 범위:
- `docs/mockups/stitch-tempotune-branding-v1-2026-02-14`
- `docs/mockups/stitch-tempotune-v1.0-2026-02-14`

## 1) 목적

두 개의 Stitch 산출물만 기준으로, Claude가 바로 실행 가능한 작업 플랜을 제공한다.  
핵심은 아래 3가지다.

1. 정적으로 잘못 고정된 값(연도/버전/회사명/샘플 데이터)을 제거 또는 정책화
2. HTML 목업의 실사용 리스크(외부 CDN/플레이스홀더 링크/가독성)를 정리
3. 충돌 없이 병렬 실행 가능한 작업 단위로 분해

---

## 2) 정적 감사 결과 (파일/라인 근거)

### A. 날짜/버전/저작권 하드코드

1. `docs/mockups/stitch-tempotune-v1.0-2026-02-14/desktop-settings.html:296`
- `v1.0.4-build.2024` 하드코드

2. `docs/mockups/stitch-tempotune-v1.0-2026-02-14/desktop-settings.html:315`
- `© 2024 AudioPrecision Tech...`

3. `docs/mockups/stitch-tempotune-v1.0-2026-02-14/desktop-tuner-auto.html:265`
- `v2.4.0 Build Stable`

4. `docs/mockups/stitch-tempotune-v1.0-2026-02-14/desktop-tuner-auto.html:266`
- `© 2024 TEMPOTUNE LABS`

5. `docs/mockups/stitch-tempotune-v1.0-2026-02-14/mobile-loading.html:82`
- `v2.4.0`

6. `docs/mockups/stitch-tempotune-v1.0-2026-02-14/mobile-settings.html:171`
- `버전 v1.0.42 (Stable Build)`

7. `docs/mockups/stitch-tempotune-v1.0-2026-02-14/desktop-metronome-main.html:206`
- `2023.10.27`

8. `docs/mockups/stitch-tempotune-v1.0-2026-02-14/desktop-metronome-main.html:216`
- `2023.10.26`

9. `docs/mockups/stitch-tempotune-v1.0-2026-02-14/desktop-metronome-main.html:226`
- `2023.10.25`

10. `docs/mockups/stitch-tempotune-v1.0-2026-02-14/desktop-metronome-main.html:250`
- `© 2024 TempoTune Pro Engine`

11. `docs/mockups/stitch-tempotune-branding-v1-2026-02-14/landing-desktop.html:277`
- `© 2024 TempoTune Inc.`

12. `docs/mockups/stitch-tempotune-branding-v1-2026-02-14/landing-mobile.html:149`
- `© 2024 TEMPOTUNE...`

13. `docs/mockups/stitch-tempotune-branding-v1-2026-02-14/app-icon-board.html:198`
- `Oct 24, 2023`

14. `docs/mockups/stitch-tempotune-branding-v1-2026-02-14/app-icon-board.html:209`
- `© 2023 TempoTune Design Lab`

15. `docs/mockups/stitch-tempotune-branding-v1-2026-02-14/app-icon-source.html:61`
- `Internal Asset v1.0`

영향:
- 현재 날짜(2026-02-14) 기준으로 문서 신뢰도 저하
- 화면 간 버전/법적 표기 불일치
- 추후 앱 빌드 시 스토어 심사/법무 텍스트 검수 리스크

권장 정책:
- 연도/버전/회사명/빌드번호를 전부 토큰화  
  예: `{{COPYRIGHT_YEAR}}`, `{{APP_VERSION}}`, `{{LEGAL_ENTITY}}`

---

### B. 플레이스홀더 링크 (`href="#"`)

- `landing-desktop.html`: 16개
- `landing-mobile.html`: 3개
- `brand-key-visual.html`: 4개
- `desktop-settings.html`: 4개
- `mobile-settings.html`: 3개

영향:
- 랜딩/설정 화면 클릭 동작 검증 불가
- QA 자동화에서 false-positive 증가

권장 정책:
- 최소 `data-route` 또는 실제 라우트(`/pricing`, `/terms`)로 교체
- 미확정 링크는 `button`으로 바꾸고 disabled 상태 명시

---

### C. 외부 의존성 고정 (런타임/오프라인 리스크)

공통 패턴:
- `https://cdn.tailwindcss.com` (대부분 HTML)
- Google Fonts / Material Icons CDN (대부분 HTML)
- `lh3.googleusercontent.com` 원격 이미지 (브랜딩 HTML 중심)

대표 위치:
- `app-icon-source.html:7-10`
- `app-icon-board.html:7-10`
- `landing-desktop.html:7-10,118,214`
- `landing-mobile.html:7-10,89,135,138`
- `brand-key-visual.html:7-10,66`
- `mobile-loading.html:123`
- `desktop-settings.html:81`

영향:
- 네트워크 차단 시 미리보기 깨짐
- 재현성 낮음(외부 리소스 변경 가능)

권장 정책:
- 릴리즈용 mockup은 로컬 에셋/로컬 CSS 번들 우선
- CDN 사용 시에도 fallback 스타일/대체 폰트 지정

---

### D. 타이포/가독성 리스크 (초소형 텍스트)

작은 텍스트 클래스 사용량:
- `mobile-tuner-manual.html`: 19회
- `mobile-tuner-auto.html`: 12회
- `desktop-metronome-main.html`: 11회
- `desktop-settings.html`: 8회

특히 `text-[8px]`, `text-[9px]`, `text-[10px]`가 반복 사용됨.  
프로젝트 가이드(`CLAUDE.md`)의 최소 텍스트 12px 원칙과 충돌한다.

대표 위치:
- `mobile-tuner-manual.html:91-95,124,131,141,148,155`
- `desktop-settings.html:315` (`text-[9px]`)

영향:
- 모바일 실기기에서 읽기 어려움
- 숫자/라벨 겹침(사용자가 이미 지적한 문제) 재발 가능성 큼

권장 정책:
- 최소 12px, 보조 라벨도 11px 미만 금지
- 큰 숫자(예: BPM, Note)와 단위(BPM, cents)를 별도 레이아웃 레일로 분리

---

### E. 카피/브랜드 일관성

혼합 표기 예시:
- `Features/Pricing/Login` vs 한글 내비
- `Woodblock`, `Electronic` vs 한국어 UI
- 법인명 혼재: `TempoTune Inc`, `TEMPOTUNE LABS`, `AudioPrecision Tech`, `TempoTune Design Lab`, `TempoTune Pro Engine`

영향:
- 제품 아이덴티티 모호
- 로컬라이즈 기준 부재

권장 정책:
- 기준 locale 1개(ko-KR 또는 en-US) 먼저 확정
- 법적 표기/브랜드명 단일 소스화 (`LEGAL_ENTITY`, `BRAND_NAME`)

---

## 3) Claude 병렬 실행 플랜

## Phase 0 (선행, 단일 작업)

1. 작업 브랜치/백업 스냅샷 생성
2. 두 폴더 외 수정 금지 규칙 명시
3. 토큰 정책 확정: `COPYRIGHT_YEAR`, `APP_VERSION`, `LEGAL_ENTITY`, `BUILD_CHANNEL`

산출물:
- `mockup-governance.md` 또는 기존 문서 내 섹션 추가

---

## Phase 1 (병렬 가능)

### Track A: Branding Pack 정리
대상:
- `stitch-tempotune-branding-v1-2026-02-14/*.html`

작업:
1. 연도/버전/법인명 토큰화
2. `href="#"` 제거 또는 disabled 처리
3. 외부 이미지/폰트 의존성 최소화
4. 한/영 카피 정책 적용

---

### Track B: Product UI Pack 정리
대상:
- `stitch-tempotune-v1.0-2026-02-14/*.html`

작업:
1. 버전/빌드/날짜/저작권 하드코드 제거
2. `text-[8|9|10|11]px` 정리 및 레이아웃 재정렬
3. 튜너/메트로놈 핵심 숫자 UI 겹침 방지 구조 반영
4. 설정/로딩/데스크탑 화면의 문구 일관화

---

### Track C: QA Guardrail 스크립트
대상:
- 두 폴더 전체

작업:
1. 정적 검사 스크립트 추가(정규식 기반)
2. 금지 패턴 검출:
   - `2023|2024|2025`
   - `href=\"#\"`
   - `text-[8|9|10|11]px`
   - `Build Stable` 등 릴리즈 고정 문구
3. CI 전 `pnpm` 스크립트로 실행 가능하도록 구성

---

## Phase 2 (병렬 결과 통합)

1. Track A/B 결과를 브랜드 토큰 규칙으로 합침
2. Track C 검사 통과 확인
3. 모바일/데스크탑 주요 화면 스냅샷 비교

검증 포인트:
- 숫자와 라벨 겹침 없음
- 320px 폭 모바일에서 하단 탭/단위 표기 깨짐 없음
- 데스크탑 1280px 기준 좌우 패널 오버플로 없음

---

## 4) Claude에게 바로 전달할 작업 단위 (권장)

1. `WU-MOCKUP-A`  
- Branding 폴더 정리 + 링크/카피/법적 문구 통일

2. `WU-MOCKUP-B`  
- v1.0 폴더 정리 + 텍스트 스케일/레이아웃 겹침 해결

3. `WU-MOCKUP-C`  
- 공통 정적 감사 스크립트 및 체크리스트 문서화

병렬 실행 순서:
- `WU-MOCKUP-A` || `WU-MOCKUP-B` 동시 진행
- `WU-MOCKUP-C`는 초안 즉시 시작 가능, A/B 완료 후 최종 룰 확정

---

## 5) 완료 기준 (Definition of Done)

1. 하드코딩 연도/버전/법인명 제거 또는 토큰화 완료
2. `href="#"` 0건
3. `text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]` 0건 (예외는 근거 문서화)
4. 외부 리소스 의존성 목록 문서화 + 대체 전략 명시
5. 모바일/데스크탑 핵심 화면(튜너/메트로놈/설정/로딩/랜딩) 검토 기록 완료

---

## 6) 재검증 명령 (운영 체크)

```bash
rg -n --glob '*.html' '2023|2024|2025|v[0-9]+\.[0-9]+\.[0-9]+|Build|Stable|©' docs/mockups/stitch-tempotune-branding-v1-2026-02-14 docs/mockups/stitch-tempotune-v1.0-2026-02-14
rg -n --glob '*.html' 'href="#"' docs/mockups/stitch-tempotune-branding-v1-2026-02-14 docs/mockups/stitch-tempotune-v1.0-2026-02-14
rg -n --glob '*.html' 'text-\[(8|9|10|11)px\]' docs/mockups/stitch-tempotune-branding-v1-2026-02-14 docs/mockups/stitch-tempotune-v1.0-2026-02-14
rg -n --glob '*.html' 'cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|lh3\.googleusercontent\.com' docs/mockups/stitch-tempotune-branding-v1-2026-02-14 docs/mockups/stitch-tempotune-v1.0-2026-02-14
```

