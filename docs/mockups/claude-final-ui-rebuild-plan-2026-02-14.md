# TempoTune Final UI Rebuild Plan (for Claude)

작성일: 2026-02-14  
목표: Stitch 최종 도안 기준으로 TempoTune 화면을 전면 재구성한다.  
기준 소스(SSOT):
- `docs/mockups/stitch-tempotune-v1.0-2026-02-14`
- `docs/mockups/stitch-tempotune-branding-v1-2026-02-14`

## 1) 재구성 범위

1. 앱 핵심 화면(모바일 + 데스크탑)
- 튜너 자동/수동
- 메트로놈 메인
- 설정
- 로딩/초기화 상태

2. 브랜딩/마케팅 화면
- 랜딩 데스크탑/모바일
- 브랜드 키 비주얼

3. 앱 아이콘/에셋 반영
- iOS AppIcon 세트
- Android launcher 아이콘 세트
- 웹 메타 아이콘/오픈그래프 이미지

## 2) 고정 제약 (Claude 작업 규칙)

1. UI 품질 규칙 (`CLAUDE.md` 반영)
- 텍스트 최소 12px
- 터치 타겟 최소 44px
- 모바일 뷰포트 `100dvh`, 스크롤 없는 앱 셸 우선

2. 코드 규칙
- 작업 단위(WU)별 커밋 분리
- `apps/web` 수정 후 `bash .claude/scripts/ui-screenshot.sh` 필수
- 기존 오디오/튜닝 로직 계약(`hooks/services`)은 우선 유지, UI 계층부터 교체

3. 정적 텍스트 정책
- 릴리즈 하드코드 금지: 연도/버전/법인명은 토큰 또는 단일 상수에서만 관리
- `href="#"` 단독 사용 금지 (실제 route 또는 `data-route` + 버튼 처리)

## 3) 구현 전략

1. 디자인 토큰 먼저 고정
- 색상/글로우/패널/그리드/반경/폰트 스케일을 공통 토큰화
- 이후 모든 화면이 같은 토큰을 재사용하도록 강제

2. 화면을 “레이아웃 셸 + 도메인 위젯”으로 분리
- 셸: 상단바, 바텀탭, 좌우 패널, 공통 카드
- 위젯: 튜너 노트카드, 헤드스탁, 추세그래프, BPM 컨트롤

3. 모바일 우선 구현 후 데스크탑 확장
- 모바일을 기준으로 도안 fidelity 확보
- 데스크탑은 같은 위젯을 패널 배치만 변경

## 4) WU (Work Units)

## WU-0: Baseline Freeze
목적:
- 최종 mockup 2개 폴더를 기준선으로 고정하고 변경 리스크를 줄인다.

작업:
1. 기준 문서와 참조 파일 목록 고정
2. 라우트 전략 확정
- 권장: 앱 기능은 `/metronome`, `/tuner`, `/settings`
- 랜딩은 `/landing` (또는 `/`)

산출물:
- 본 문서 + 라우트 결정 메모

---

## WU-1: Design Tokens + App Shell
대상 파일(예시):
- `apps/web/app/globals.css`
- `apps/web/app/(tabs)/layout.tsx`
- `apps/web/components/common/tab-navigation.component.tsx`
- `apps/web/components/common/*` (신규 공통 패널 컴포넌트 필요 시)

작업:
1. `:root` CSS 변수로 색/글로우/보더/패널 스타일 정의
2. 공통 앱 셸 재작성(헤더 슬롯 + 콘텐츠 + 바텀 네비)
3. 모바일/데스크탑 breakpoints에 따른 셸 레이아웃 분기

완료 기준:
1. 모든 화면이 동일 토큰 사용
2. 바텀 네비/헤더/패널 스타일이 mockup 톤과 일치

---

## WU-2: Tuner UI Rebuild (Auto + Manual)
대상 파일(예시):
- `apps/web/app/(tabs)/tuner/page.tsx`
- `apps/web/components/tuner/tuner-control.component.tsx`
- `apps/web/components/tuner/guitar-headstock.component.tsx`
- `apps/web/components/tuner/tuning-trend-graph.component.tsx`
- `apps/web/components/tuner/tuner-options-drawer.component.tsx`

작업:
1. 자동/수동 모드 UI를 mockup 레이아웃으로 재배치
2. 노트 표기(E2), cents, 주파수, 신호상태 계층 정리
3. 헤드스탁/스트링 선택 UI를 모바일/데스크탑 각각 최적화

완료 기준:
1. 숫자/문자 겹침 0
2. 320px 폭에서 정보 영역 잘림 0
3. `useTuner` API 변경 없이 UI 교체 완료

---

## WU-3: Metronome UI Rebuild
대상 파일(예시):
- `apps/web/app/(tabs)/metronome/page.tsx`
- `apps/web/components/metronome/metronome-display.component.tsx`
- `apps/web/components/metronome/metronome-control.component.tsx`

작업:
1. BPM 대형 표시, 박자 선택, 시작/정지 CTA를 도안에 맞게 재설계
2. 모바일 메인과 데스크탑 대시보드형 레이아웃 분기
3. 사운드 타입 선택/히스토리/통계 카드 UI 반영(기능 없으면 disabled skeleton)

완료 기준:
1. 메트로놈 핵심 동작(start/stop/bpm/박자) 회귀 없음
2. 모바일/데스크탑 모두 버튼 hit target 44px 이상

---

## WU-4: Settings + Loading + Error/Permission States
대상 파일(예시):
- `apps/web/app/(tabs)/settings/page.tsx` (신규)
- `apps/web/components/*` (settings section 컴포넌트 신규)
- `apps/web/app/global-error.tsx`
- 로딩 상태 컴포넌트 신규 (`apps/web/components/common`)

작업:
1. settings 화면을 mockup 구조로 신설
2. loading/engine init/권한 미허용/마이크 오류 상태 화면 추가
3. 실제 상태 연결: `useAudioPermission`, `useTuner` 에러값 표시

완료 기준:
1. “정상/로딩/오류/권한” 상태 전환 시각화 완료
2. 비정상 상태에서 사용자 액션(재시도/설정 이동) 제공

---

## WU-5: Desktop Composition Pass
대상:
- WU-2, WU-3, WU-4 산출 UI 전체

작업:
1. 데스크탑 전용 3단 패널 레이아웃(좌:노트/계기, 중:핵심, 우:빠른설정)
2. widescreen(1280+)와 laptop(1024) 둘 다 점검
3. 오버플로/겹침/정렬 깨짐 수정

완료 기준:
1. 1024, 1280, 1440 해상도에서 레이아웃 안정
2. panel 간 간격/정렬 규칙 일관성 확보

---

## WU-6: Branding & Landing Implementation
대상 파일(예시):
- `apps/web/app/landing/page.tsx` (또는 라우트 확정 결과)
- `apps/web/components/landing/*` (신규)
- `apps/web/public/images/*` (브랜딩 이미지)

작업:
1. 데스크탑/모바일 랜딩을 실제 Next.js 페이지로 구현
2. Hero/Feature/Card/Footer 섹션 컴포넌트화
3. 랜딩 내 링크를 실제 route 체계와 연결

완료 기준:
1. mockup 대비 visual fidelity 확보
2. 랜딩에서 앱 주요 화면으로 자연스럽게 이동 가능

---

## WU-7: App Icon + Asset Pipeline (iOS/Android/Web)
대상 파일(예시):
- `apps/mobile/ios/TempoTune/Images.xcassets/AppIcon.appiconset/*`
- `apps/mobile/android/app/src/main/res/mipmap-*/ic_launcher*.png`
- `apps/web/app/layout.tsx` (metadata icons)
- `apps/web/public/*` (favicon/og)

작업:
1. 최종 아이콘(`app-icon-final-*`) 기준으로 플랫폼별 사이즈 생성/반영
2. iOS `Contents.json` 파일명 매핑 정리
3. Android mipmap 교체 및 라운드 아이콘 확인

완료 기준:
1. iOS/Android 빌드에서 기본 아이콘이 아닌 신규 아이콘 노출
2. 웹 favicon/앱 메타 아이콘 일치

---

## WU-8: Static Guardrail + QA
대상 파일(예시):
- `package.json` scripts
- `apps/web/scripts/*` 또는 `scripts/*` (검사 스크립트 신규)
- `.screenshots/*` (검증 산출)

작업:
1. 정적 검사 규칙 추가
- `href=\"#\"` 검출
- `text-[10px]`, `text-[11px]` 검출
- 연도/버전/법인명 하드코드 검출
2. 화면별 스크린샷 회귀 검증 루틴 문서화
3. PR 체크리스트 생성

완료 기준:
1. 새 UI PR에서 품질 규칙 자동 검사 가능
2. 스크린샷 기준 비교 절차 문서화 완료

## 5) 병렬 실행 매트릭스

1. 선행
- `WU-0` -> `WU-1`

2. 병렬 1차
- `WU-2` || `WU-3` || `WU-4` || `WU-6` || `WU-7`

3. 병렬 2차
- `WU-5` (WU-2/3/4 결과 필요)
- `WU-8` (WU-2~7 결과 반영하며 병행 가능)

4. 최종 통합
- 전 화면 QA + 라우트/상태 플로우 점검 + 커밋 정리

## 6) 검증 체크리스트

1. 기능 회귀
- 튜너 start/stop, 자동/수동 전환, 스트링 선택 정상
- 메트로놈 start/stop, BPM/박자 변경 정상

2. 반응형
- 모바일: 320/360/390 폭
- 데스크탑: 1024/1280/1440 폭

3. 접근성/가독성
- 텍스트 12px 이상
- 주요 버튼 44px 이상
- 대비 부족 구간 없음

4. 정적 정책
- `href="#"` 단독 0건
- 법적/버전/연도 하드코드 0건(상수/토큰만 허용)

## 7) Claude 실행 템플릿 (복붙용)

```md
목표: docs/mockups의 최종 도안 기준으로 TempoTune UI를 전면 재구성해.

반드시 지킬 것:
1) docs/mockups/stitch-tempotune-v1.0-2026-02-14 + docs/mockups/stitch-tempotune-branding-v1-2026-02-14를 SSOT로 사용
2) 작업 단위를 WU-1~WU-8로 나누고 병렬 가능한 것은 병렬로 진행
3) 텍스트 12px 미만 금지, 터치 타겟 44px 미만 금지
4) apps/web 수정 후 bash .claude/scripts/ui-screenshot.sh 실행하고 결과 검토
5) 기존 오디오 훅(useTuner/useMetronome) 계약은 깨지지 않게 UI 계층 위주로 교체
6) 커밋은 WU 단위로 분리해서 남겨

산출:
- 변경 파일 목록
- 스크린샷 검증 결과
- 남은 리스크와 후속 TODO
```

