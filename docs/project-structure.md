# 프로젝트 구조

2026-10-15 기준 저장소 전체 지도. 에이전트가 지킬 규칙은 루트 `AGENTS.md`에 있고, 이 문서는 무엇이 어디에 왜 있는지를 기록한다. 폴더나 라우트, 패키지, 생성 파일이 바뀌면 이 문서도 고친다.

## 1. 한눈에

이 저장소에는 제품이 둘 있다.

| 제품 | 상태 | 위치 |
|---|---|---|
| **제철달력** (언제 뭐가 맛있을까): 열두 달·사계절·명절별 제철 품종, 먹음 기록 | MVP 화면 개발 중. `.scratch/seasonal-mvp/` 티켓 13개 가운데 11개 끝남 | `apps/web`의 `/seasonal`, `packages/seasonal` |
| **식자재 시세 판정 서비스** (가칭, "이 애호박 2,980원, 비싼 건가?") | 기획 P2(데이터 소스 명세) 진행 중. 코드는 P11부터 | `grocery-price/` 문서, `.scratch/p2~p4-*` |

두 제품은 같은 Next.js 앱(`apps/web`)에 들어간다. 지금은 `/`가 제철달력으로 넘어가고, 가격 비교 메인이 생기면 `/`를 그 화면으로 바꾼다.

전체 서비스의 브랜드 이름은 **장볼날**이다(2026-10-16 확정). ‘장볼’은 식료품을 고르는 장보기를, ‘날’은 제철·달력·계절·명절로 이어지는 시간을 뜻한다. `제철달력`은 제철 콘텐츠 이름으로 유지한다. 이름의 의미와 로고 서체 검토는 `apps/web/docs/brand-assets.md`에 기록한다.

pnpm(11) workspace와 Turborepo(2.11)로 묶은 모노레포다. Node 20.9 이상.

## 2. 최상위 디렉터리

```
grocery-fair-price/
├─ apps/web/                 Next.js 16.4 앱 (제철달력, 나중에 가격 비교)
├─ packages/
│  ├─ seasonal/              @workspace/seasonal: 제철 도메인 (순수 TS, React 없음)
│  ├─ ui/                    @workspace/ui: Oura 토큰, cojeev UI, 범용 컴포넌트
│  ├─ eslint-config/         @workspace/eslint-config: base, next-js, react-internal
│  └─ typescript-config/     @workspace/typescript-config: base, nextjs, react-library
├─ grocery-price/            가격 서비스 기획·도메인·API 조사 문서 (코드 없음)
├─ scripts/                  저장소 단위 스크립트 (일러스트 동기화, 비밀 값 검사)
├─ docs/
│  ├─ agents/                에이전트 스킬이 읽는 이슈 트래커·라벨·도메인 문서 규칙
│  └─ project-structure.md   이 문서
├─ .scratch/<feature>/       스펙(spec.md)과 티켓(issues/NN-slug.md)
├─ .githooks/pre-commit      scripts/check-no-secrets.sh 실행
├─ prototypes/               (Git 밖) 일러스트 원본, 와이어프레임, 브랜드 원본
├─ AGENTS.md                 에이전트 지침 (CLAUDE.md는 @AGENTS.md 한 줄)
├─ turbo.json, pnpm-workspace.yaml, package.json
└─ .mcp.json                 next-devtools-mcp (dev 서버의 /_next/mcp 연결)
```

Git에 없는 폴더:

| 폴더 | 내용 | 없으면 |
|---|---|---|
| `prototypes/seasonal-food/` | 품종별 그리기 코드(`foods/<id>/food.mjs`), 그림체(`styles/`), 렌더러(`kit/`), 제철 목록 조사(`docs/seasonal-lists/`), 와이어프레임(`wireframes/WIREFRAME-SPEC.md`, `DECISIONS.md`) | 앱 빌드는 된다. `pnpm foods:sync`, `build:foods`는 못 돌린다 |
| `prototypes/branding/` | 로고·파비콘 원본 | 앱 빌드는 된다 |
| `.claude/`, `.agents/` | 프로젝트 스킬(`seasonal-food-illustrator`, `next-dev-loop`, `shadcn`, `migrate-radix-to-base`), 설정 | `skills-lock.json`으로 공개 스킬은 다시 받을 수 있다 |
| `.env` | `DATA_GO_KR_SERVICE_KEY` 등 공공 API 키 | 비밀 값 검사를 건너뛴다 |

## 3. 레이어와 의존 방향

```
apps/web/app        라우트 파일. params 검증, 메타데이터, feature 컴포넌트 렌더
   ↓
apps/web/features   화면 컴포넌트·훅 (features끼리는 import하지 않는다)
   ↓
apps/web/shared     앱 전역: routes, providers, meta, today, eaten-store, brand-logo
   ↓
packages/seasonal   도메인: 품종·달·계절·명절·달력·배치·검색 (React·Next·DOM 없음)
packages/ui         디자인 시스템: 토큰, cojeev, 범용 컴포넌트 (도메인 단어 없음)
```

위 레이어만 아래 레이어를 import한다. 2026-10-15에 확인한 결과 `shared → features`, `features → app`, `seasonal → react/next/ui`, `ui → seasonal` import는 하나도 없다.

import 경로:

- 패키지는 파일 경로로 가져온다: `@workspace/seasonal/data/foods`, `@workspace/ui/components/button`. `packages/seasonal`의 `exports`가 `"./*": "./src/*.ts"`라 배럴 파일이 없다.
- `apps/web` 안에서는 `@/features/...`, `@/shared/...`.
- `apps/web/next.config.ts`의 `transpilePackages`가 두 패키지를 빌드 없이 소스로 읽는다.

## 4. apps/web

### 4.1 설정

| 파일 | 내용 |
|---|---|
| `next.config.ts` | `cacheComponents: true`, `partialPrefetching: true`, `agentRules: false`(AGENTS.md를 루트 하나로) |
| `proxy.ts` | `/seasonal/festivals` → 서울 날짜 기준 다가오는 명절로 리다이렉트. `matcher`는 정적 문자열이어야 해서 경로를 직접 쓴다 |
| `app/layout.tsx` | `<html lang="ko" data-mode="light">`, Pretendard(본문), Gowun Batang(`--font-serif-ko`, 제목), 사이트 기본 메타데이터, `Providers` |
| `app/globals.css` | `@workspace/ui/globals.css`와 `cojeev.css`를 불러오고, ViewTransition 키프레임과 reduced-motion 처리 |
| `components.json` | shadcn 설정. 실제 설치는 `packages/ui`에서 한다(`pnpm ui:add`) |
| `DESIGN.md` | Oura 디자인 언어 분석(색, 서체, 간격, 컴포넌트) |
| `docs/nextjs-16-patterns.md` | Next 16 렌더링·캐시 판단 근거(2026-10-14). 화면 개발 전에 쓴 문서라 예시 코드 일부(`lib/` 경로, eaten store 구현)는 실제 코드와 다르다 |
| `docs/brand-assets.md` | 로고·파비콘 파일과 교체 방법 |

### 4.2 라우트

화면 코드는 와이어프레임 명세의 번호다.

| URL | 화면 | 라우트 파일 | 화면 컴포넌트 |
|---|---|---|---|
| `/` | 서비스 메인 자리 | `app/page.tsx` | `routes.home`(`/seasonal`)으로 307 |
| `/seasonal` | 2a 이달 · 12개월 스크롤 | `seasonal/(this-month)/page.tsx` | `this-month/this-month-view` |
| `/seasonal/months` | 2b 열두 달 카드 목록 | `seasonal/(this-month)/months/page.tsx` | `month-timeline/months-index` |
| `/seasonal/months/[month]` | 2b 그 달 상세 (1~12) | `seasonal/(this-month)/months/(detail)/[month]/page.tsx` | `month-timeline/month-view`, 레이아웃에 `month-timeline` |
| `/seasonal/seasons` | 3a 계절 히어로 | `seasonal/(season)/seasons/page.tsx` | `seasons/seasons-hero` |
| `/seasonal/seasons/[season]` | 3a 계절 상세 (spring·summer·autumn·winter) | `seasonal/(season)/seasons/[season]/page.tsx` | `seasons/season-detail` |
| `/seasonal/festivals` | (페이지 없음) | `proxy.ts` | 다가오는 명절로 리다이렉트 |
| `/seasonal/festivals/[festival]` | 1g 명절 | `seasonal/(season)/festivals/[festival]/page.tsx` | `festivals/festival-view`, 레이아웃에 `festival-chips` |
| `/seasonal/my-table` | 1h 나의 식탁 | `seasonal/my-table/page.tsx` | `my-table/my-table-view` |
| `/seasonal/foods/[food]` | 1i 품종 상세 (전체 페이지) | `seasonal/foods/[food]/page.tsx` | `food-detail/food-detail` |
| (제철 화면 안에서 이동) | 1i 품종 상세 (하단 시트) | `seasonal/@sheet/(.)foods/[food]/page.tsx` | `components/food-sheet` + `food-detail` |
| `/api/og` | 공유 미리보기 이미지 1200×630 | `app/api/og/route.tsx` | 쿼리 `title`, `subtitle`, `badge`, `season` |
| `/examples/*` | 디자인 후보 비교 페이지 | `app/examples/<name>/page.tsx` | 아래 표 |

표의 화면 컴포넌트 경로는 `apps/web/features/seasonal/` 기준이다. 모든 경로는 `apps/web/shared/routes.ts`의 `routes`로 만든다. 2a의 특정 달은 해시 `routes.seasonal.rootAt(month)`(`/seasonal#month-N`)로 연다.

라우팅 장치:

- **`app/seasonal/layout.tsx`**: `TodayProvider`(서울 오늘 Promise)와 `SeasonalShell`(헤더, 하단 Floating Nav, 검색, 공유, ⚙ 설정)을 깐다. `sheet` 슬롯을 받는다.
- **라우트 그룹** `(this-month)`과 `(season)`: URL을 바꾸지 않고 2차 탭 바(`ThisMonthTabs`, `SeasonTabs`)를 나눠 쓴다. `(detail)` 그룹은 2b 타임라인을 그 달 상세에만 붙인다. 타임라인과 명절 칩은 레이아웃에 두어 달·명절을 바꿔도 가로 스크롤 위치가 남는다.
- **`@sheet` 병렬 슬롯**: `(.)foods/[food]`가 품종 상세를 가로채 시트로 띄운다. `default.tsx`, `page.tsx`, `[...catchAll]`은 null을 그려 다른 곳으로 이동하면 시트가 닫힌다. 새 제철 라우트를 더해도 `@sheet`는 고칠 것이 없다.
- **정적 생성**: 동적 라우트는 모두 `generateStaticParams`로 전부 만든다(12달, 4계절, 명절, 품종). Cache Components에서는 `dynamicParams`를 못 쓰므로 목록 밖 값은 `notFound()`로 막고, `params`는 `<Suspense>` 안에서 읽는다.
- **메타데이터**: 페이지는 `shared/meta.ts`의 `createMetadata()`를 돌려준다. canonical, OpenGraph, Twitter 카드, `/api/og` 이미지가 함께 붙는다. 공개 주소는 `siteUrl()`이 `NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → localhost 순서로 정한다.

디자인 비교 페이지(`/examples/*`). 스펙의 결정 기록이 이 페이지를 근거로 인용한다.

| 페이지 | 비교한 것 |
|---|---|
| `bottom-sheet` | `BottomSheet`·`openBottomSheet` 사용 예 |
| `option-wheel` | 2a 데스크톱 달 이동 휠 `reel` vs `arc` (reel 선택) |
| `season-backgrounds` | 3a 계절 카드 배경 (sunwash 선택) |
| `calendar-styles` | 2a 달력 모양 후보 |
| `header-styles` | 2a 맨 위 헤더·2차 탭 구분 후보 |
| `festival-buttons` | 1i "관련 명절" 링크 버튼 모양 |
| `season-tags` | 1i 제목 옆 계절 태그 |
| `seasonal-parts` | 제철 공통 부품 모음 |

### 4.3 features/seasonal

화면 하나에 폴더 하나다. 여러 화면이 함께 쓰는 부품은 `components/`, zustand store는 `stores/`.

| 폴더 | 화면 | 주요 파일 |
|---|---|---|
| `this-month/` | 2a | `this-month-view`, `desktop-month-panel`(option-wheel), `month-jump`, `month-scroll-spy`, `active-month`, `settings-panel`·`settings-fields`·`settings-scope`(⚙ 표시 설정), `calendar-style-picker` |
| `month-timeline/` | 2b | `month-timeline`, `month-view`, `months-index`, `food-grid`, `food-card`, `month-food-fold`, `eaten-summary`, `view-store`(열 수, 저장 안 함) |
| `seasons/` | 3a | `seasons-hero`, `season-card`, `season-detail`, `season-background`, `season-style`, `now-tag` |
| `festivals/` | 1g | `festival-view`, `festival-chips`, `festival-date` |
| `my-table/` | 1h | `my-table-view`, `food-row`, `typed-label` |
| `food-detail/` | 1i | `food-detail`, `eat-toggle`, `festival-link` |
| `search/` | 전역 검색 | `food-search`(헤더 버튼), `food-search-dialog`(cojeev command, 초성 검색) |
| `components/` | 공통 | `seasonal-shell`, `main-nav`, `nav-link`, `sub-tabs`, `food-image`(그림 없으면 이름 카드), `food-sheet`, `scatter-field`·`draggable-scatter`(흩어진 배치와 드래그), `month-calendar`, `season-tag`, `season-months-bar`, `eaten-badge`, `eaten-count`, `share-button`, `holiday-name`, `this-month-only`, `screen-stub` |
| `stores/` | 공통 | `settings-store`(⚙ 설정), `scatter-store`(옮긴 배치와 달력 자리) |

`components/seasonal-shell`은 헤더에 넣으려고 `search/`와 `this-month/settings-panel`을 import한다. 같은 feature 안이라 허용된다.

### 4.4 shared

| 파일 | 내용 |
|---|---|
| `routes.ts` | 앱의 모든 경로 |
| `providers.tsx` | `TooltipProvider`, `OverlayProvider`(overlay-kit). 마운트 뒤 먹음 기록을 불러온다 |
| `meta.ts` | `SITE_CONFIG`(사이트 이름 "제철달력"), `siteUrl()`, `createMetadata()`, `ogImagePath()` |
| `today.ts` | `getSeoulToday()`: `server-only`. `connection()` 뒤에 서울 오늘을 계산하고 React `cache`로 요청당 한 번 |
| `today-context.tsx` | `TodayProvider`, `useToday()`: 서버가 만든 Promise를 클라이언트가 `use()`로 읽는다. `<Suspense>` 안에서만 |
| `eaten-store.ts` | 먹음 기록: 연도 → 품종 id 목록. localStorage `seasonal:eaten` |
| `brand-logo.tsx` | 헤더 로고 |

## 5. 상태와 "오늘"

| 상태 | 위치 | 저장 | 비고 |
|---|---|---|---|
| 서울 오늘 | `shared/today.ts` → `TodayProvider` → `useToday()` | 없음 (요청마다 서버 계산) | 렌더 중 `new Date()`를 부르지 않는다 |
| 먹음 기록 | `shared/eaten-store.ts` | localStorage `seasonal:eaten` | 앱 전체가 쓴다 |
| ⚙ 표시 설정 (공휴일, 먹은 품종, 달력 모양) | `features/seasonal/stores/settings-store.ts` | localStorage `seasonal:settings` | |
| 흩어진 배치·달력 자리 | `features/seasonal/stores/scatter-store.ts` | localStorage `seasonal:scatter` | 키는 `(달, 화면 구간)` |
| 2b 열 수 | `features/seasonal/month-timeline/view-store.ts` | 없음 | 달을 바꿔도 유지 |

저장하는 store는 모두 zustand `persist` + `skipHydration: true`다. 서버 HTML과 첫 클라이언트 렌더는 기본값으로 같게 그리고, 마운트 뒤 `persist.rehydrate()`로 기기 값을 불러온다. 그래서 ✓와 개수는 하이드레이션 뒤에 나타난다.

정적 데이터(품종, 달, 계절, 명절, 공휴일)는 모듈 상수라 빌드 때 HTML에 들어간다. 요청 시점에 그리는 것은 "오늘"에 따라 달라지는 부분(2a 히어로, 1h)뿐이다.

## 6. packages/seasonal

제철달력의 도메인. React, Next.js, DOM을 모른다. MVP 이후 달력 인쇄 페이지(`.scratch/calendar-print/spec.md`)도 이 코드를 쓴다. 의존성: `date-fns`, `@date-fns/tz`, `@hyunbinseo/holidays-kr`, `es-hangul`.

| 모듈 | 내용 |
|---|---|
| `data/foods.ts` | `Food` 타입, `FOODS`(검증 품종 전체, 가나다순), `foodsInMonth`, `foodsInSeason`, `findFood`, `isDrawn`, `seasonHighlights` |
| `data/foods.generated.ts` | 생성 파일. 품종 행 (`id`, `name`, `aliases`, `category`, `months`) |
| `data/drawn-foods.generated.ts` | 생성 파일. 일러스트가 있는 품종 id |
| `data/food-bounds.generated.ts` | 생성 파일. 그림이 상자 안에서 아래로 어디까지 그려지는지 (이름표 위치) |
| `data/food-sizes.ts` | `FOOD_SCALE`: 작아 보이는 품종의 그림 배율. 손으로 조정 |
| `data/months.ts` | `MONTHS`, `isMonth`, `formatSeasonMonths` |
| `data/seasons.ts` | `SEASONS`, `SEASON_MONTHS`, `isSeason`, `seasonOfMonth` |
| `data/festivals.ts` | `FESTIVALS`(전통 음식 포함), 연도별 날짜, `upcomingFestival`, `festivalsInMonth`, `festivalsWithFood` |
| `data/copy.ts` | 화면 문구: 달별 문구, 계절 설명, 명절 배경, UI 문구, 먹음 라벨 |
| `calendar/today.ts` | `TIME_ZONE`(Asia/Seoul), `seoulNow`, `seoulToday`, `currentMonth` |
| `calendar/month-calendar.ts` | 달력 칸 계산, `CalendarDate` |
| `calendar/holidays.ts` | 그 달 공휴일 |
| `calendar/lunar.ts` | 음력 → 양력, 동지 |
| `calendar/date-utils.ts` | 요일 이름, 달의 날 수 |
| `layout/scatter.ts` | 흩어진 배치. 시드 난수(LCG)로 같은 입력이면 같은 결과, 0..1 정규화 좌표, 화면 구간(`SCATTER_FRAMES`)별 고정 비율 |
| `layout/merge-saved.ts` | 저장된 배치와 바뀐 품종 목록 병합 |
| `search/match-foods.ts` | 이름·별칭·초성 검색 |

테스트는 `*.test.ts`가 옆에 있다(vitest, 8개 파일). `packages/seasonal/README.md`도 참고한다.

## 7. packages/ui

| 경로 | 내용 |
|---|---|
| `src/styles/globals.css` | Oura 팔레트(`--color-canvas`, `--color-gold`, `--color-season-*` …), 서체 변수(`--font-heading`, `--font-number`). 색의 유일한 원천 |
| `src/styles/cojeev.css` | cojeev 스타일 import 목록과 cojeev 팔레트(`--v-*`)의 Oura 덮어쓰기 |
| `src/styles/cojeev/*.css` | cojeev 컴포넌트별 CSS (설치 시 생성) |
| `src/styles/cojeev-fonts.css`, `fonts/` | cojeev display 서체(Bricolage Grotesque, DM Sans)와 라이선스 |
| `src/components/` | cojeev·shadcn에서 받은 컴포넌트와 직접 만든 범용 컴포넌트 |
| `src/lib/cojeev/`, `src/lib/cojeev-motion/` | cojeev 컴포넌트가 쓰는 기하·모션 코드 (설치 시 생성) |
| `src/lib/geometry/relax-circles.ts` | 원 겹침 해소(밀어내기). 흩어진 배치 드래그가 쓴다 |
| `src/lib/utils.ts` | `cn()` |
| `scripts/fix-ui-css.mjs` | `pnpm ui:add` 뒤 cojeev.css import 목록을 고친다 |
| `scripts/cojeev-materialize-fonts.mjs` | cojeev 서체를 파일로 꺼내는 선택 도구 (기본은 스타일시트에 인라인) |

우리가 고친 컴포넌트(`pnpm ui:add`가 덮어쓰지 않는다): `bottom-sheet`(cojeev Drawer를 크림 하단 시트로), `option-wheel`(문구를 props로), `dialog`, `link-tabs`(크림 트레이 탭), `segmented`, `scroll-row`(가로 스크롤 줄과 넘기기 버튼), `text-reveal`.

컴포넌트의 바탕 프리미티브는 Radix(`@radix-ui/*`)다. `@base-ui/react`는 의존성에만 있고 `src`에서 import하지 않는다(2026-10-15). 애니메이션은 `motion`, 아이콘은 `lucide-react`.

## 8. 생성 파일과 파이프라인

```
prototypes/seasonal-food/docs/seasonal-lists/foods.json (tier: verified)
prototypes/seasonal-food/build/catalog.json (일러스트 id)
        │  pnpm --filter @workspace/seasonal build:foods  (packages/seasonal/scripts/build-foods.mjs)
        ▼
packages/seasonal/src/data/foods.generated.ts
        │
prototypes/seasonal-food/{foods,styles/watercolor,kit}
        │  pnpm foods:sync  (scripts/sync-food-images.mjs, 끝에 measure-food-bounds.mjs)
        ▼
apps/web/public/foods/<id>/color.svg, motion.svg
apps/web/public/foods/PROVENANCE.md         그림체 버전·sha·품종 목록
packages/seasonal/src/data/drawn-foods.generated.ts
packages/seasonal/src/data/food-bounds.generated.ts   (pnpm foods:bounds로 따로도)
```

- 출력은 모두 커밋한다. 원천이 `prototypes/`(Git 밖)에 있어 새 클론에서는 다시 만들 수 없기 때문이다.
- 일러스트가 없는 품종의 id는 `build-foods.mjs`의 `NEW_IDS`에서 정한다. 그림이 없으면 화면은 이름 카드를 보인다.
- 그림체는 `watercolor`, 변형은 `color`(모든 화면)와 `motion`(1i 큰 그림, SVG 안 CSS 키프레임), 바닥 그림자는 끈다.
- 새 일러스트는 프로젝트 스킬 `/seasonal-food-illustrator`로 그린다.
- 브랜드 파일(`apps/web/public/images/brand/`, `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`)은 `prototypes/branding/`에서 손으로 복사한다(`apps/web/docs/brand-assets.md`).

## 9. 명령어

루트에서 실행한다. Turborepo가 각 패키지의 같은 이름 스크립트를 돌린다.

| 명령 | 내용 |
|---|---|
| `pnpm dev` | `next dev` (apps/web) |
| `pnpm build` | `next build` |
| `pnpm typecheck` | 세 패키지 `tsc --noEmit` |
| `pnpm lint` | ESLint (2026-10-15 기준 0 오류, `packages/ui` 경고 4건) |
| `pnpm test` | vitest: `packages/seasonal`(36개), `packages/ui`(4개) |
| `pnpm format` | Prettier |
| `pnpm ui:add <name-or-url>` | cojeev·shadcn 컴포넌트를 `packages/ui`에 설치 |
| `pnpm foods:sync` / `pnpm foods:bounds` | 일러스트 동기화 / 그림 아래 끝 재측정 |
| `pnpm --filter @workspace/seasonal build:foods` | 품종 목록 생성 |
| `scripts/check-no-secrets.sh [--tree]` | `.env` 값이 커밋 대상에 들어갔는지 검사 (pre-commit) |

처음 클론하면 `git config core.hooksPath .githooks`를 한 번 실행한다.

## 10. grocery-price (가격 서비스 문서)

```
grocery-price/
├─ README.md                 진행 현황과 문서 지도
├─ GLOSSARY.md               용어집 (카테고리·품목·품종·규격, 제철, 먹음 기록 …). 저장소 전체가 따른다
├─ docs/
│  ├─ 00-overview/           product-concept.md, roadmap.md (P1~P11, 완료 기준)
│  ├─ 10-research/           api-spec.md (API 실측), public-data-survey, data-sourcing-legal, content-and-taxonomy, images
│  ├─ 20-domain/             domain-model.md
│  └─ adr/                   0001 공공데이터와 제보, 크롤링 안 함
└─ reference/public-data/
   ├─ kamis/, ekape/         원본 API 명세·코드표
   └─ samples/               실호출 응답 샘플, fetch-samples.sh, viewer/(api-explorer.html, build.py, smoke.sh)
```

## 11. 작업 관리 (.scratch)

| 폴더 | 내용 | 상태 |
|---|---|---|
| `seasonal-mvp/` | 제철달력 MVP 화면 13개 티켓 | 01~11 resolved, 12 ready-for-agent(데스크톱·태블릿), 13 needs-info(디자인 다듬기) |
| `calendar-print/` | 달력 PDF/PNG 다운로드 | MVP 이후, needs-triage |
| `p2-data-source-spec/` | 가격 서비스 P2 데이터 소스 명세 | 진행 중. 01 resolved, 나머지는 ready-for-agent·ready-for-human |
| `p3-variety-catalog/` | P3 품종 목록 | ready-for-human |
| `p4-canonical-model/` | P4 통합 데이터 모델 | ready-for-agent·ready-for-human |

형식은 `docs/agents/issue-tracker.md`, 라벨은 `docs/agents/triage-labels.md`를 따른다.

## 12. 문서 지도

| 알고 싶은 것 | 문서 |
|---|---|
| 에이전트 규칙 | `AGENTS.md` |
| 제철 화면 명세 | `prototypes/seasonal-food/wireframes/WIREFRAME-SPEC.md` (Git 밖) |
| 명세와 다르게 정한 것, MVP 결정 | `.scratch/seasonal-mvp/spec.md` |
| 색·서체 | `apps/web/DESIGN.md`, `packages/ui/src/styles/globals.css` |
| Next 16 렌더링·캐시 근거 | `apps/web/docs/nextjs-16-patterns.md` |
| 로고·파비콘 | `apps/web/docs/brand-assets.md` |
| 도메인 패키지 규칙 | `packages/seasonal/README.md` |
| 용어 | `grocery-price/GLOSSARY.md` |
| 가격 서비스 단계 | `grocery-price/docs/00-overview/roadmap.md` |
| 공공 API 호출 | `grocery-price/docs/10-research/api-spec.md` |
| 일러스트 출처 | `apps/web/public/foods/PROVENANCE.md` |
