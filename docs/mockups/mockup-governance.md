# Mockup Governance

작성일: 2026-02-14

## Token Policy

Mockup HTML에서 릴리즈 시점에 바뀔 수 있는 값은 하드코딩하지 않고 아래 토큰을 사용한다.

- `{{APP_VERSION}}`
- `{{COPYRIGHT_YEAR}}`
- `{{LEGAL_ENTITY}}`
- `{{BUILD_CHANNEL}}`

## Link Policy

- `href="#"` 단독 사용 금지
- 미확정 링크는 아래 중 하나로 처리
  - 실제 라우트로 연결 (`href="/path"`)
  - `data-route` 기반 링크 (`href="/path" data-route="/path"`)
  - 클릭 불가 상태를 명시한 `button` 요소

## Static Audit Commands

```bash
rg -n --glob '*.html' 'href="#"' docs/mockups/stitch-tempotune-branding-v1-2026-02-14 docs/mockups/stitch-tempotune-v1.0-2026-02-14
rg -n --glob '*.html' 'v[0-9]+\.[0-9]+\.[0-9]+' docs/mockups/stitch-tempotune-branding-v1-2026-02-14 docs/mockups/stitch-tempotune-v1.0-2026-02-14
rg -n --glob '*.html' '2023|2024|2025' docs/mockups/stitch-tempotune-branding-v1-2026-02-14 docs/mockups/stitch-tempotune-v1.0-2026-02-14
```
