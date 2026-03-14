# TempoTune 모바일 UX 리프레시 실행 플랜 (Claude 작업용)

## Context

현재 모바일 UI는 기능은 동작하지만, 실제 사용성 기준에서 다음 문제가 누적되어 있다.

- 상단 정보 과밀: 메트로놈/튜너 전환 + 프리셋 + 시작/정지 + 모드가 한 영역에 몰려 있음
- 탭 위치 비효율: 화면 전환(메트로놈/튜너)이 상단에 있어 한 손 조작성이 낮음
- 타이포 스케일 불안정: 10~11px 텍스트 과다 사용으로 가독성 저하
- 레이아웃 밀도 불균형: 핵심 액션 대비 보조 정보의 시각적 비중이 큼
- 튜너/메트로놈 스타일 일관성 부족: 컴포넌트 톤, 간격, 강조 레벨이 화면마다 다름

이 문서는 Claude가 즉시 구현 가능한 수준으로 UX 구조 개편 범위/순서/수용 기준을 정의한다.

---

## UX 목표

1. 메트로놈/튜너 전환을 하단 고정 탭으로 이동한다.
2. 튜너와 메트로놈의 타이포, 간격, 버튼 규칙을 하나의 시스템으로 통일한다.
3. 모바일 한 화면 집중 사용을 위해 정보 위계를 재정렬한다.
4. 튜너 페이지는 스크롤 없는 고정 레이아웃을 유지하고, 옵션은 오버레이로 제공한다.
5. 헤드스톡/버튼 매칭/중앙 정렬을 유지보수 가능한 config 중심 구조로 고정한다.

---

## Non-Goals

- 오디오 엔진/피치 검출 알고리즘 변경 금지
- API/Bridge 스펙 변경 금지
- 디자인 테마 전면 교체 금지(현재 다크톤 유지, 정제만 수행)

---

## 대상 파일

### Core Layout
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/app/(tabs)/layout.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/components/common/tab-navigation.component.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/app/globals.css`

### Tuner
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/app/(tabs)/tuner/page.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/components/tuner/tuner-control.component.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/components/tuner/tuning-trend-graph.component.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/components/tuner/tuner-options-drawer.component.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/components/tuner/guitar-headstock.component.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/components/tuner/headstock-layout.config.ts` (신규/또는 기존 분리)

### Metronome
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/app/(tabs)/metronome/page.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/components/metronome/metronome-display.component.tsx`
- `/Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web/components/metronome/metronome-control.component.tsx`

---

## Design System 규칙 (반드시 준수)

### 1) Typography Scale (모바일 기준)

- Display: 40/48 (숫자 BPM 등 핵심 단일값)
- Heading: 20/28
- Section title: 16/24
- Body: 14/20
- Caption/Meta: 12/16 (이보다 작게 금지)

금지:
- 본문성 텍스트에 11px 이하 사용 금지
- 정보 라벨 난립(동일 정보 반복) 금지

### 2) Spacing & Touch

- 기본 간격 단위: 4px
- 블록 간격: 8/12/16/24 체계만 사용
- 최소 터치 영역: 44x44
- 주요 CTA(시작/정지): 최소 48 높이 이상

### 3) Color & Emphasis

- 상태 색상 역할 고정:
- Primary: 앱 인터랙션(탭 활성, 선택 상태)
- Success: In tune / 재생 상태
- Warning: 감지 낮음/주의
- Danger: 에러/극단 벗어남

- 같은 의미의 상태를 화면마다 다른 색으로 표현 금지

### 4) Layout Behavior

- 페이지 전체: `100dvh` 기준
- 탭 바: 하단 고정 + safe-area 반영
- 본문: 탭 높이만큼 패딩 확보
- 튜너: 본문 무스크롤 (옵션 패널만 내부 스크롤 허용)

---

## 구현 작업 단위 (Claude 실행 순서)

### WU-1: 하단 탭 내비게이션 전환

작업:
- `TabNavigation`을 상단에서 하단 고정 바 형태로 재작성
- `layout.tsx`에서 탭을 콘텐츠 아래에 렌더링
- safe-area 하단 대응 (`env(safe-area-inset-bottom)`)

Acceptance Criteria:
- [ ] 메트로놈/튜너 전환 탭이 하단에 표시됨
- [ ] 탭이 본문 콘텐츠를 가리지 않음
- [ ] 한 손 조작에서 도달성 개선

### WU-2: 글로벌 타이포/기본 토큰 정리

작업:
- `globals.css`에 타이포/간격 토큰(또는 utility class) 정리
- 11px 이하 텍스트 제거 가이드 반영
- range slider thumb/track 일관성 점검

Acceptance Criteria:
- [ ] 본문성 텍스트 최소 12px 이상
- [ ] 주요 정보(프리셋, 상태, 모드, 값)의 시각적 위계가 명확

### WU-3: 튜너 상단 컨트롤 정보 구조 축소

작업:
- `tuner-control.component.tsx`에서 상단 요소를 2줄 이내로 재구성
- “악기/프리셋 + 시작/정지”를 1차 정보로, 모드는 2차 정보로 재배치
- 중복 라벨/작은 보조텍스트 정리

Acceptance Criteria:
- [ ] 상단 정보가 과밀하지 않음
- [ ] 시작/정지 버튼이 명확히 보임
- [ ] 작은 화면에서도 텍스트 겹침 없음

### WU-4: 튜너 그래프/헤드스톡 영역 비율 재조정

작업:
- `tuner/page.tsx`에서 그래프와 헤드스톡 공간 비율 재조정
- 헤드스톡은 중앙 정렬 고정
- 수동/자동 안내 문구를 간결화하고 위치 최적화

Acceptance Criteria:
- [ ] 헤드스톡이 시각 중심에서 벗어나지 않음
- [ ] 그래프와 헤드스톡이 서로 영역 침범하지 않음

### WU-5: 헤드머신 버튼 매핑/유지보수 구조 정리

작업:
- 레이아웃별 앵커 좌표 + `stringToAnchorMap`를 config 파일로 분리
- `guitar-headstock.component.tsx`는 config 기반 렌더러로 유지
- 디버그 모드(`?headstockDebug=1`)에서 앵커 표시

Acceptance Criteria:
- [ ] 3+3 / 6-inline 모두 버튼 위치가 실제 페그와 정렬됨
- [ ] 좌표 수정이 config만으로 가능

### WU-6: 튜너 옵션 패널 UX 개선

작업:
- `tuner-options-drawer`를 오버레이/바텀시트로 전환
- 옵션 항목 그룹화(튜닝/감도/헤드스톡)
- 모바일에서 옵션만 스크롤 가능

Acceptance Criteria:
- [ ] 옵션 열고 닫아도 본문 레이아웃 점프 없음
- [ ] 조작성이 떨어지는 작은 글씨/촘촘한 간격 해소

### WU-7: 메트로놈 화면 스타일 동기화

작업:
- 메트로놈 타이포/버튼/간격을 튜너와 동일 체계로 정렬
- BPM 표시와 주요 컨트롤 우선순위 재정리
- 업로드 버튼 등 2차 액션 시각적 비중 축소

Acceptance Criteria:
- [ ] 메트로놈과 튜너가 같은 앱으로 느껴지는 시각 일관성 확보
- [ ] 주요 CTA가 항상 눈에 먼저 들어옴

### WU-8: 반응형 QA 및 미세 보정

작업:
- iPhone 12(390), Pixel 7(412) 기준 점검
- safe-area, 세로 짧은 화면, 폰트 크기 확대 환경 확인
- 텍스트 잘림/버튼 겹침/스크롤 발생 여부 최종 수정

Acceptance Criteria:
- [ ] 지정 해상도에서 레이아웃 깨짐 없음
- [ ] 탭/CTA/헤드스톡 조작 가시성 충족

---

## QA 체크리스트 (수동 검증)

1. 메트로놈/튜너 전환 탭이 하단 고정인지 확인
2. 튜너 화면에서 페이지 스크롤이 발생하지 않는지 확인
3. 옵션 열림 상태에서도 본문 높이가 흔들리지 않는지 확인
4. 3+3/6-inline 각각 줄 버튼이 해드머신과 맞는지 확인
5. 390/412 해상도에서 폰트 가독성(최소 12px) 확인
6. 시작/정지, 모드 전환, 프리셋 선택 버튼의 터치 영역 확인

---

## 검증 명령어

```bash
pnpm -C /Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web exec tsc --noEmit
pnpm -C /Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web lint
```

옵션:

```bash
pnpm -C /Users/jeong-gyeonghun/Desktop/Coding/TempoTune/apps/web dev
```

---

## Claude 실행 프롬프트 (복붙용)

아래 요구사항을 순서대로 구현하세요.

1. 메트로놈/튜너 탭을 상단에서 하단 고정으로 이동
2. 모바일 타이포 스케일(본문 최소 12px, 기본 14px) 정리
3. 튜너 상단 컨트롤을 2줄 이내로 정보 구조 단순화
4. 튜너 그래프/헤드스톡 영역 비율 재조정 및 중앙 정렬 고정
5. 해드머신 버튼 배치를 layout config 기반으로 분리하고 줄 매핑 정확히 보정
6. 옵션 패널을 바텀시트형 오버레이로 바꾸고 본문 무스크롤 유지
7. 메트로놈 컴포넌트 스타일을 같은 디자인 시스템으로 동기화
8. 390/412 화면에서 최종 QA 후 타입체크/린트 통과

필수 제약:

- 오디오 엔진/훅 로직 변경 금지
- 좌표 하드코딩 분산 금지 (config 집중)
- 44px 미만 터치 타겟 금지
- 구현 후 변경 요약 + 남은 UX 리스크를 보고
