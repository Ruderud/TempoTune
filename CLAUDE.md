# TempoTune - Claude Code Project Guide

## Quick Commands

```bash
pnpm -C apps/web exec tsc --noEmit   # type-check (web)
pnpm exec nx affected -t lint         # lint affected
pnpm exec vitest run                  # test all
pnpm --filter @tempo-tune/web dev     # dev server
```

## Workflow Rules

### Context Management (#5)

- 작업 단위(WU)별로 대화를 분리하면 품질이 유지됨
- 긴 작업 전 `/compact`로 수동 압축하거나 핸드오프 문서를 작성할 것
- 하나의 대화에서 3개 이상의 독립 작업을 하지 말 것

### TDD Discipline (#34)

- Bug fix: 재현 테스트 먼저 → 수정 → 테스트 통과 확인
- 새 유틸/엔진: `.test.ts` 동반 필수
- 로직 변경: 관련 테스트도 함께 업데이트

### Background Execution (#36)

- `pnpm build`, `nx affected` 등 긴 명령은 Ctrl+B로 백그라운드 실행
- 여러 서브에이전트를 병렬로 활용해 대규모 분석 수행

### UI 작업 후 자동 스크린샷

- `apps/web/` 파일 수정 후 반드시 `bash .claude/scripts/ui-screenshot.sh` 실행
- `.screenshots/` 결과를 Read tool로 시각 확인

### Git Convention

- Pre-commit: `nx affected -t type-check lint test`
- 커밋은 작업 단위(WU)별로 분리
- 버전: `tempotune-{web|mobile}-{semver}-{git-short-hash}`

### Code Quality

- 최소 텍스트 크기: 12px (`text-xs`), 하드코딩 `text-[10px]`/`text-[11px]` 금지
- 최소 터치 타겟: 44px (`min-h-[44px]` or `w-11 h-11`)
- 모바일 뷰포트: `100dvh`, 스크롤 금지 레이아웃

## Coding Principles (Karpathy)

### 1. Think Before Coding

- 가정을 명시적으로 밝힐 것. 불확실하면 질문할 것.
- 해석이 여러 개면 제시할 것 — 임의로 고르지 말 것.
- 더 단순한 방법이 있으면 말할 것. 필요하면 반론할 것.
- 혼란스러우면 멈추고, 무엇이 불명확한지 짚고, 질문할 것.

### 2. Simplicity First

- 요청받지 않은 기능 추가 금지.
- 한 번만 쓰는 코드에 추상화 금지.
- 요청되지 않은 "유연성"이나 "설정 가능성" 금지.
- 발생 불가능한 시나리오에 에러 핸들링 금지.
- 200줄을 50줄로 줄일 수 있다면 다시 쓸 것.

### 3. Surgical Changes

- 인접 코드, 주석, 포맷팅을 "개선"하지 말 것.
- 망가지지 않은 것을 리팩터하지 말 것.
- 기존 스타일에 맞출 것 — 내 취향이 달라도.
- 관련 없는 데드코드를 발견하면 언급만 — 삭제하지 말 것.
- 내 변경이 만든 orphan(미사용 import/변수/함수)만 정리할 것.
- **모든 변경 라인은 사용자 요청에 직접 연결되어야 한다.**

### 4. Goal-Driven Execution

- 작업을 검증 가능한 목표로 변환할 것:
  - "검증 추가" → 잘못된 입력 테스트 작성 후 통과시키기
  - "버그 수정" → 재현 테스트 작성 후 통과시키기
  - "리팩터" → 전후 테스트 통과 보장
- 다단계 작업은 단계별 계획과 검증 체크포인트를 명시할 것.
