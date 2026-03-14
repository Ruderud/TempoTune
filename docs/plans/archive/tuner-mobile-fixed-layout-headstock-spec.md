# Tuner 모바일 고정 레이아웃 + 헤드스톡 정렬/매칭 리팩터링 스펙

## Context

현재 튜너 페이지는 모바일 실사용 기준에서 다음 문제가 있다.

- 페이지가 세로 스크롤되어 한 화면 집중 사용성이 깨진다.
- 헤드스톡 이미지가 화면 수평 중앙에서 어긋나 보인다.
- 해드머신 버튼이 실제 튜닝머신 위치/줄 매핑과 직관적으로 일치하지 않는다.
- 버튼 위치값이 컴포넌트 내부에 산재되어, 이미지 교체/미세조정 시 유지보수가 어렵다.

이 문서는 Claude OMC가 바로 실행 가능한 수준으로 작업 범위, 구현 순서, 파일 단위 변경사항, 검증 기준을 정의한다.

---

## Work Objectives

1. 모바일 튜너 화면을 `100dvh` 고정 레이아웃으로 바꾸고, 본문 스크롤을 제거한다.
2. 헤드스톡 이미지를 레이아웃 기준으로 항상 수평 중앙 정렬한다.
3. 6현 기준 각 줄 버튼을 실제 해드머신 위치에 정확히 대응되게 배치한다.
4. 버튼 좌표/매핑을 데이터 중심 구조로 분리해 유지보수성을 높인다.
5. 옵션 패널을 메인 레이아웃을 밀어내지 않는 구조(오버레이/바텀시트)로 정리한다.

---

## Must Have

- 모바일 뷰포트(390x844, 412x915 기준)에서 튜너 페이지 세로 스크롤이 없어야 한다.
- 헤드스톡 컨테이너는 좌우 기준 정확히 중앙 정렬되어야 한다.
- `three-plus-three`, `six-inline` 각각 버튼 앵커 좌표가 독립적으로 정의되어야 한다.
- 문자열 인덱스와 페그(버튼) 앵커 인덱스 매핑은 config 파일에서 선언형으로 관리해야 한다.
- 버튼 최소 터치 영역은 44x44px 이상이어야 한다.
- 비6현 프리셋(예: 베이스 4현)은 안전한 폴백 UI를 제공해야 한다.
- 타입체크 통과: `pnpm -C apps/web exec tsc --noEmit`

## Must NOT Have

- 좌표 숫자를 JSX 스타일 객체에 직접 하드코딩
- 레이아웃 전환 시 `window.innerHeight` 기반 즉흥 계산
- 옵션 열림/닫힘으로 본문 높이가 밀리며 재배치되는 구조
- 6현 전용 좌표를 4현/다른 프리셋에 강제 적용

---

## Scope

### In Scope

- `/apps/web/app/(tabs)/tuner/page.tsx`
- `/apps/web/components/tuner/guitar-headstock.component.tsx`
- `/apps/web/components/tuner/tuner-options-drawer.component.tsx`
- `/apps/web/components/tuner/headstock-layout.config.ts` (신규)

### Out of Scope

- 피치 검출 엔진 로직 변경 (`use-tuner`, `packages/audio`)
- 튜너 그래프 알고리즘 변경
- 이미지 리터칭/교체 자체 (현재 PNG 자산 유지)

---

## Design Blueprint

### A. 페이지 레이아웃 (무스크롤 고정)

- 루트 컨테이너를 `h-[100dvh] overflow-hidden`으로 변경한다.
- 튜너 페이지를 4개 수직 영역으로 고정 그리드화한다.
- 상단 제어부: 프리셋/시작/모드
- 중단 그래프: 남는 공간을 차지하되 내부 높이 계산 안정화
- 하단 헤드스톡: 고정 비율 박스(`aspect-[2/3]` or config 기반)
- 옵션 진입 버튼: 하단 오버레이 트리거

권장 구조:

```tsx
<main className="h-[100dvh] overflow-hidden">
  <section className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto_auto]">
    {/* control */}
    {/* trend graph */}
    {/* headstock */}
    {/* options trigger */}
  </section>
</main>
```

### B. 옵션 패널 구조

- `TunerOptionsDrawer`는 인라인 확장 대신 바텀시트(absolute/fixed overlay)로 전환한다.
- 닫힘 상태에서는 레이아웃 영향 0.
- 열림 상태에서 옵션 자체만 `overflow-y-auto` 허용 (본문은 계속 고정).
- 기존 옵션(감도/A4/헤드스톡 선택)은 그대로 유지하되 정보 밀도를 줄여 모바일 가독성 확보.

### C. 헤드스톡 좌표 시스템 (핵심)

신규 파일 `headstock-layout.config.ts`를 만들고 다음을 관리한다.

- 레이아웃별 이미지 경로
- 레이아웃별 앵커 좌표 목록 (`x`, `y`, `%`)
- 문자열 인덱스 -> 앵커 인덱스 매핑
- 버튼 기본 크기, 좌우 오프셋, 디버그 색상 옵션

타입 예시:

```ts
export type HeadstockLayout = 'three-plus-three' | 'six-inline';

export type AnchorPoint = {
  x: number; // 0..1
  y: number; // 0..1
  side: 'left' | 'right';
};

export type HeadstockLayoutSpec = {
  imageSrc: string;
  imageAlt: string;
  anchors: AnchorPoint[];
  stringToAnchorMap: number[]; // string index -> anchors index
  buttonSizePx: number;
  maxWidthPx: number;
  aspectRatio: number;
};
```

### D. 버튼 매핑 규칙

- 문자열 배열은 저음 -> 고음 순서라고 가정한다.
- `stringToAnchorMap`으로 시각적 위치를 명시적으로 연결한다.
- 예시:
- 6-inline: `[5, 4, 3, 2, 1, 0]` 혹은 이미지 실제 위치 기준으로 조정
- 3+3: 좌/우 페그 배열 순서 기준으로 명시
- 실제 값은 디버그 오버레이 확인 후 확정한다.

### E. 중앙 정렬 규칙

- 헤드스톡 렌더 컨테이너는 `mx-auto` + 고정 `max-width`.
- 이미지는 `object-contain` + `inset-0` + `justify-center`.
- 버튼 오버레이 기준 좌표는 항상 **이미지 컨테이너 좌표계**를 기준으로 배치한다.
- 좌표계 일관성을 위해 `position: relative` 단일 루트만 사용한다.

### F. 폴백 정책

- 기타 6현이 아닌 경우:
- 옵션 선택은 유지하되 이미지 기반 버튼 오버레이를 비활성화
- 기존 중립형 UI 또는 문자열 리스트 버튼 UI로 폴백
- 이유를 작은 힌트 텍스트로 안내 (예: “현재 프리셋은 기본 헤드스톡 UI 사용”)

### G. 유지보수 디버그 모드

- 쿼리 `?headstockDebug=1`에서 앵커 점, 인덱스, 문자열 라벨을 표시한다.
- 좌표 보정은 config 숫자만 조정하도록 설계한다.
- 디버그 모드는 프로덕션 사용자 기본 경로에서는 비활성화한다.

---

## Detailed Task Flow

### WU-1: 좌표 config 분리

- `headstock-layout.config.ts` 신규 생성
- 레이아웃 스펙/타입/기본값 이동
- 기존 `guitar-headstock.component.tsx`의 레이아웃 상수 제거

Acceptance Criteria

- [ ] 좌표/매핑 숫자가 컴포넌트 JSX에서 제거됨
- [ ] 모든 레이아웃 정보가 config 파일로 이동됨

### WU-2: 헤드스톡 렌더러 리팩터링

- 컴포넌트가 config를 읽어 버튼 좌표 계산
- 버튼은 `translate(-50%, -50%)` 중심 배치
- 중앙 정렬 고정

Acceptance Criteria

- [ ] 이미지가 모바일에서 수평 중앙 유지
- [ ] 버튼이 이미지와 함께 스케일되어 어긋남 없음

### WU-3: 버튼-줄 매칭 보정

- 6-inline / 3+3 각각 `stringToAnchorMap` 조정
- 디버그 오버레이로 육안 검증 후 좌표 고정

Acceptance Criteria

- [ ] 각 줄 버튼이 대응 튜닝머신 위치와 직관적으로 일치
- [ ] Standard/Drop D 두 프리셋에서 오매칭 없음

### WU-4: 페이지 무스크롤화

- 튜너 페이지 루트/섹션 레이아웃 조정
- 불필요한 `overflow-y-auto` 제거

Acceptance Criteria

- [ ] 모바일 뷰포트에서 페이지 스크롤 0
- [ ] 헤더/그래프/헤드스톡/옵션 트리거 한 화면 내 유지

### WU-5: 옵션 패널 재구조화

- 바텀시트/오버레이로 전환
- 패널 내부만 스크롤 허용

Acceptance Criteria

- [ ] 옵션 열림 시 본문 레이아웃 점프 없음
- [ ] 작은 화면에서 옵션 조작 가능

### WU-6: 폴백 및 QA

- 비6현 폴백 UI 구현
- 접근성/터치 영역 점검

Acceptance Criteria

- [ ] 4현 프리셋에서 깨짐 없음
- [ ] 버튼 터치 영역 44px 이상 유지

---

## QA Scenarios

1. iPhone 12/13 mini 폭(390)에서 튜너 진입 후 스크롤 시도 -> 스크롤되지 않아야 함
2. `three-plus-three` 선택 -> 버튼 6개가 좌/우 헤드머신과 대응
3. `six-inline` 선택 -> 버튼 6개가 한쪽 헤드머신 배열과 대응
4. Standard/Drop D 전환 -> 동일한 물리 줄 위치 기준으로 버튼 매핑 유지
5. 베이스 프리셋 전환 -> 폴백 UI 정상 표시
6. 옵션 열기/닫기 반복 -> 중앙 정렬/레이아웃 흔들림 없음
7. `?headstockDebug=1` -> 앵커 점/인덱스 표시

---

## Verification Commands

```bash
pnpm -C apps/web exec tsc --noEmit
pnpm -C apps/web lint
```

선택 실행(로컬 확인):

```bash
pnpm -C apps/web dev
```

---

## Deliverables

- 수정 코드 3개 + 신규 config 1개
- 모바일 스크롤 제거
- 헤드스톡 중앙 정렬
- 레이아웃별 정확한 버튼 매칭
- 유지보수 가능한 좌표/매핑 구조

---

## Claude OMC 실행 지시문 (복붙용)

다음 요구사항을 순서대로 구현하세요.

1. 튜너 페이지를 모바일 `100dvh` 무스크롤 레이아웃으로 리팩터링
2. `headstock-layout.config.ts`를 신설하고 레이아웃별 앵커/매핑 분리
3. `guitar-headstock.component.tsx`를 config 기반 렌더러로 변경
4. 버튼-줄 매칭을 3+3/6-inline 각각 정확히 보정
5. 옵션 패널을 오버레이 바텀시트 구조로 변경
6. 비6현 프리셋 폴백 처리
7. `?headstockDebug=1` 디버그 오버레이 추가
8. 타입체크 통과 후 변경 요약 및 남은 리스크 보고

필수 준수:

- JSX 내부 하드코딩 좌표 금지
- 버튼 최소 터치 영역 44px
- 모바일 화면 스크롤 금지
- 파일별 변경 이유를 PR 요약에 포함
