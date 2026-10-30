# 프로젝트 구조

2026-10-15 기준 저장소 전체 지도. 에이전트가 지킬 규칙은 루트 `AGENTS.md`에 있고, 이 문서는 무엇이 어디에 왜 있는지를 기록한다. 폴더나 라우트, 패키지, 생성 파일이 바뀌면 이 문서도 고친다.

## 1. 한눈에

이 저장소에는 제품이 둘 있다.

| 제품 | 상태 | 위치 |
|---|---|---|
| **제철달력** (언제 뭐가 맛있을까): 열두 달·사계절·명절별 제철 품종, 먹음 기록 | MVP 화면 개발 중. `.scratch/seasonal-mvp/` 티켓 13개 가운데 11개 끝남 | `apps/web`의 `/seasonal`, `packages/seasonal` |
| **식자재 시세 판정 서비스** (가칭, "이 애호박 2,980원, 비싼 건가?") | 로드맵 ① 수집 기반 진행 중 (Supabase + GitHub Actions). 화면 코드는 ④에서 `apps/web`에 | `grocery-price/` 문서, `.scratch/ingest-foundation`, `.scratch/p2~p4-*`, `.scratch/search-first-view` |

두 제품은 같은 Next.js 앱(`apps/web`)에 들어간다. `/`는 가격 화면의 P1 시세 메인이고(2026-10-27), 제철달력은 `/seasonal` 아래에 있다. 헤더 · 하단 내비는 둘이 같이 쓴다(`shared/shell`).

전체 서비스의 브랜드 이름은 **장볼날**이다(2026-10-16 확정). ‘장볼’은 식료품을 고르는 장보기를, ‘날’은 제철·달력·계절·명절로 이어지는 시간을 뜻한다. `제철달력`은 제철 콘텐츠 이름으로 유지한다. 이름의 의미와 로고 서체 검토는 `apps/web/docs/brand-assets.md`에 기록한다.

pnpm(11) workspace와 Turborepo(2.11)로 묶은 모노레포다. Node 20.9 이상.

## 2. 최상위 디렉터리

```
grocery-fair-price/
├─ apps/web/                 Next.js 16.4 앱 (제철달력, 나중에 가격 비교)
├─ packages/
│  ├─ seasonal/              @workspace/seasonal: 제철 도메인 (순수 TS, React 없음)
│  ├─ price/                 @workspace/price: 가격 화면 도메인 (화면 모양, 판정, 검색, 문구. 순수 TS)
│  ├─ ui/                    @workspace/ui: Oura 토큰, cojeev UI, 범용 컴포넌트
│  ├─ price-db/              @workspace/price-db: 가격 DB 마이그레이션 검증 테스트, 샘플 테스트 데이터, 용량 실측, ERD 생성
│  ├─ price-ingest/          @workspace/price-ingest: 공공 API 3개의 호출 모듈, 응답 계약 테스트, 실측 기준 (8-2)
│  ├─ eslint-config/         @workspace/eslint-config: base, next-js, react-internal
│  └─ typescript-config/     @workspace/typescript-config: base, nextjs, react-library
├─ supabase/                 Supabase CLI 프로젝트: config.toml, migrations/(스키마 price의 DDL·DCL), seed.sql(로컬 기준 데이터)
├─ grocery-price/            가격 서비스 기획·도메인·API 조사·파이프라인 설계 문서 (코드 없음)
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
packages/price      가격 화면 도메인: 화면이 읽는 모양·판정·검색·문구 (React·Next·DOM 없음)
packages/ui         디자인 시스템: 토큰, cojeev, 범용 컴포넌트 (도메인 단어 없음)
```

위 레이어만 아래 레이어를 import한다. 2026-10-15에 확인한 결과 `shared → features`, `features → app`, `seasonal → react/next/ui`, `ui → seasonal` import는 하나도 없다.

import 경로:

- 패키지는 파일 경로로 가져온다: `@workspace/seasonal/data/foods`, `@workspace/ui/components/button`. `packages/seasonal`의 `exports`가 `"./*": "./src/*.ts"`라 배럴 파일이 없다.
- `apps/web` 안에서는 `@/features/...`, `@/shared/...`.
- `apps/web/next.config.ts`의 `transpilePackages`가 세 패키지(`ui`, `seasonal`, `price`)를 빌드 없이 소스로 읽는다.

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
| `docs/seo.md` | 검색 색인: 새 페이지 연결 체크리스트, 환경 변수, 운영 전환 절차 |
| `vitest.config.ts` | `shared/` 순수 함수 테스트. tsconfig paths를 따르고 JSX만 여기서 변환한다 |

### 4.2 라우트

화면 코드는 와이어프레임 명세의 번호다.

| URL | 화면 | 라우트 파일 | 화면 컴포넌트 |
|---|---|---|---|
| `/` | P1 시세 메인 | `(price)/page.tsx` | `features/price/home/home-view` |
| `/search?q=` | P2 품종 검색 (noindex) | `(price)/search/page.tsx` | `features/price/search/search-view` |
| `/basket` | P4 담은 품종 (noindex) | `(price)/basket/page.tsx` | `features/price/basket/basket-view` |
| `/prices/[variety]` | P3 품종 상세 (가격 품종 slug) | `(price)/prices/[variety]/page.tsx` | `features/price/variety-detail/detail-view`. 품종 목록은 `getPriceSource()`에서 읽어 `generateStaticParams` · sitemap에 쓴다 |
| `/seasonal` | 2a 이달 · 12개월 스크롤 | `seasonal/(this-month)/page.tsx` | `this-month/this-month-view` |
| `/seasonal/months` | 2b 열두 달 카드 목록 | `seasonal/(this-month)/months/page.tsx` | `month-timeline/months-index` |
| `/seasonal/months/[month]` | 2b 그 달 상세 (1~12) | `seasonal/(this-month)/months/(detail)/[month]/page.tsx` | `month-timeline/month-view`, 레이아웃에 `month-timeline` |
| `/seasonal/seasons` | 3a 계절 히어로 | `seasonal/(season)/seasons/page.tsx` | `seasons/seasons-hero` |
| `/seasonal/seasons/[season]` | 3a 계절 상세 (spring·summer·autumn·winter) | `seasonal/(season)/seasons/[season]/page.tsx` | `seasons/season-detail` |
| `/seasonal/festivals` | (페이지 없음) | `proxy.ts` | 다가오는 명절로 리다이렉트 |
| `/seasonal/festivals/[festival]` | 1g 명절 | `seasonal/(season)/festivals/[festival]/page.tsx` | `festivals/festival-view`, 레이아웃에 `festival-chips` |
| `/seasonal/my-table` | 1h 나의 식탁 | `seasonal/my-table/page.tsx` | `my-table/my-table-view` |
| `/seasonal/foods/[food]` | 1i 품종 상세 (전체 페이지) | `seasonal/foods/[food]/page.tsx` | `food-detail/food-detail` |
| `/seasonal/downloads` | 달력·포스터 PDF 내려받기 | `seasonal/downloads/page.tsx` | `downloads/downloads-view`. `public/downloads/manifest.json`을 빌드 때 읽는다 |
| `/seasonal/downloads/[edition]` | 에디션 상세(직접 열면 페이지, 목록에서 누르면 하단 시트 `@sheet/(.)downloads/[edition]`) | `seasonal/downloads/[edition]/page.tsx` | `downloads/edition-detail`, 매니페스트는 `shared/downloads-manifest` |
| `/admin`, `/admin/edit?id=`, `/admin/wireframes` | 인쇄물 어드민 (개발 서버 전용, 운영 404). `wireframes`는 인쇄물 구조 안 모음 | `app/admin/` | `features/admin-print/` |
| `/print?spec=&paper=&page=` | 인쇄 전용 페이지 (개발 서버 전용, 운영 404) | `app/print/page.tsx` | `features/print/print-document` |
| (제철 화면 안에서 이동) | 1i 품종 상세 (하단 시트) | `seasonal/@sheet/(.)foods/[food]/page.tsx` | `components/detail-sheet` + `food-detail` |
| `/api/og` | 공유 미리보기 이미지 1200×630 | `app/api/og/route.tsx` | 쿼리 `title`, `subtitle`, `badge`, `season` |
| `/privacy` | 개인정보 처리방침 (가격 셸) | `(price)/privacy/page.tsx` | `features/legal/privacy/` (본문 `privacy-content.ts`) |
| `/sitemap.xml`, `/robots.txt` | 검색 색인 | `app/sitemap.ts`, `app/robots.ts` | `shared/seo/pages.ts` 레지스트리, 색인 스위치 |

표의 화면 컴포넌트 경로는 가격 화면(P1~P4)은 `apps/web/`, 제철 화면은 `apps/web/features/seasonal/` 기준이다. 가격 화면 명세는 `.scratch/price-screens/spec.md`. 모든 경로는 `apps/web/shared/routes.ts`의 `routes`로 만든다. 2a의 특정 달은 해시 `routes.seasonal.rootAt(month)`(`/seasonal#month-N`)로 연다.

라우팅 장치:

- **`app/(price)/layout.tsx`**: 가격 화면(`/`, `/search`, `/prices/*`, `/basket`)의 셸(`features/price/components/price-shell`: 공통 셸 + 가격 메뉴 + 기기 저장 store 불러오기). 데이터는 `features/price/data/price-source.ts`의 `getPriceSource()`로만 읽는다.
- **`app/seasonal/layout.tsx`**: `TodayProvider`(서울 오늘 Promise)와 `SeasonalShell`(헤더, 하단 Floating Nav, 검색, ⚙ 설정. 공유 버튼은 헤더가 아니라 월별·계절·명절·품종 상세의 제목 줄과, 이달(모바일)의 월 레일 아래에 있다)을 깐다. `sheet` 슬롯을 받는다.
- **라우트 그룹** `(this-month)`과 `(season)`: URL을 바꾸지 않고 2차 탭 바(`ThisMonthTabs`, `SeasonTabs`)를 나눠 쓴다. `(detail)` 그룹은 2b 타임라인을 그 달 상세에만 붙인다. 타임라인과 명절 칩은 레이아웃에 두어 달·명절을 바꿔도 가로 스크롤 위치가 남는다.
- **`@sheet` 병렬 슬롯**: `(.)foods/[food]`가 품종 상세를 가로채 시트로 띄운다. `default.tsx`, `page.tsx`, `[...catchAll]`은 null을 그려 다른 곳으로 이동하면 시트가 닫힌다. 새 제철 라우트를 더해도 `@sheet`는 고칠 것이 없다.
- **정적 생성**: 동적 라우트는 모두 `generateStaticParams`로 전부 만든다(12달, 4계절, 명절, 품종). Cache Components에서는 `dynamicParams`를 못 쓰므로 목록 밖 값은 `notFound()`로 막고, `params`는 `<Suspense>` 안에서 읽는다.
- **메타데이터**: 페이지는 `shared/meta.ts`의 `createMetadata()`를 돌려준다. canonical, OpenGraph, Twitter 카드, `/api/og` 이미지가 함께 붙는다. 공개 주소는 `siteUrl()`이 `NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → localhost 순서로 정한다.
- **검색 색인**: 모든 페이지를 `shared/seo/pages.ts`에 색인·noindex·리디렉션 가운데 하나로 등록한다. 빠뜨리면 가드 테스트가 실패한다. `SITE_INDEXABLE=true`가 아니면 robots가 전체를 막고 모든 페이지가 noindex다. 자세히는 `apps/web/docs/seo.md`.

디자인 비교 페이지(`/examples/*`)는 2026-10-16에 지웠다. 스펙의 결정 기록이 아래 페이지를 근거로 인용하므로, 다시 보려면 `git show 22520eb:apps/web/app/examples/<페이지>/page.tsx`로 꺼낸다.

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
| `components/` | 공통 | `seasonal-shell`(공통 셸에 제철 메뉴 · 검색 · ⚙를 넣는다), `sub-tabs`, `food-image`(그림 없으면 이름 카드), `detail-sheet`(품종 · 에디션 상세 시트), `scatter-field`·`draggable-scatter`(흩어진 배치와 드래그), `month-calendar`, `season-tag`, `season-months-bar`, `eaten-badge`, `eaten-count`, `share-button`, `holiday-name`, `this-month-only`, `screen-stub` |
| `downloads/` | PDF 내려받기(.scratch/calendar-download) | `downloads-view`(목록: 종류별 가로 줄 `EditionShelf`), `edition-detail`(상세: 시트 · 페이지 공용), `edition-thumbnail`, `edition-download-link`(A4 내려받기 주소) |
| `stores/` | 공통 | `settings-store`(⚙ 설정, 내려받기 용지), `scatter-store`(옮긴 배치와 달력 자리) |

`components/seasonal-shell`은 공통 셸(`shared/shell`)의 헤더에 넣으려고 `search/`와 `this-month/settings-panel`을 import한다. 같은 feature 안이라 허용된다.

인쇄물(`.scratch/calendar-print/spec.md`)은 feature 둘로 나뉜다.

| 폴더 | 내용 |
|---|---|
| `features/print/` | `/print` 화면. `print-document`(종류 → 컴포넌트 표), 종류별 `monthly`·`year-sheet`·`season-poster`·`month-poster`, `parts/`(시트, 인쇄 달력, 품종 그림 판), `print.css`(A4·A3 `@page`. 용지 단위 `--u`는 `Sheet`가 `PAPERS` 배율로 넣는다) |
| `features/admin-print/` | 어드민. 아래 표 |

`features/admin-print/`는 한 파일이 한 가지 일만 하도록 나눈다. 아래 칸은 위 칸만 import한다(`server/`는 화면 쪽에서 `actions`·`queries`만 부른다).

| 위치 | 하는 일 |
|---|---|
| `types.ts`, `constants.ts` | 화면 사이에 오가는 타입(`ActionResult`, `EditionSummary`, …)과 상수(종류 설명·모양 `KIND_LOOKS`, 상태 이름, 미리보기 폭). 도메인 타입·상수(`Edition`, `EDITION_LIMITS`, `PRINT_KIND_LABELS`)는 `@workspace/seasonal/print` |
| `lib/` | 순수 함수와 vitest: `flow`(편집 상태 `editionDraft`, 저장 → PDF 단계, 단계 문구), `downloads`(PDF 주소·쪽 이름), `summary`(목록 요약·다음 id), `preview`(미리보기 크기), `spec-path`(옵션 경로 읽고 쓰기), `format`(서울 시각), `wireframe-shapes`(와이어프레임 도형: 용지 mm 좌표의 그림 박스·달력 칸·글 막대·막대표·원형 판), `wireframe-catalog`(종류별 구조 안 목록. 근거는 `.scratch/calendar-print/research/market.md`) |
| `hooks/` | `use-copy`(클립보드와 "복사했어요"), `use-element-width` |
| `server/` | `import "server-only"`. `guard`(개발 서버에서만), `files`(에디션 JSON·생성 기록·매니페스트 읽고 쓰기), `generate`(이 컴퓨터의 Chrome으로 PDF 저장, 쪽 크기·수 검사), `queries`(라우트가 읽는 값), `actions`(Server Action, `ActionResult`를 돌려준다) |
| `components/` | 목록과 편집기가 함께 쓰는 조각: `kind-mark`, `status`, `edition-id`, `delete-edition-button` |
| `wireframes/` | `wireframe`(안 하나를 SVG로. 옵션 고르기의 미리보기로 쓸 수 있다), `wireframe-gallery`(`/admin/wireframes`) |
| `board/` | `/admin` 목록. 서버 컴포넌트(`admin-board`, `edition-board`, `kind-group`, `edition-row`) |
| `new-edition/` | 새 에디션 3단계 폼(`new-edition-form`, `kind-picker`, `form-step`) |
| `editor/` | `/admin/edit`. `use-edition-editor`(편집본·저장·생성을 들고 있고, 판단은 `lib/flow`의 `editionDraft`)와 화면 조각(`editor-header`, `edition-steps`, `generated-files`, `options-panel`·`option-field`·`option-fields`(종류별 옵션 표. 구성 선택지와 구성별로 숨기는 옵션 · 품종 수 상한은 `print/layouts.ts`에서 읽는다. `option-fields.test`가 표의 값이 사양 스키마와 맞는지 본다), `listing-panel`, `preview-panel`·`print-preview`) |

에디션 원본은 `apps/web/print-editions/<id>.json`, 생성 기록은 `<id>.build.json`, 결과 PDF와 매니페스트는 `apps/web/public/downloads/`에 있다. 에디션 JSON·생성 기록·매니페스트는 커밋하고, PDF는 용량이 커서 `.gitignore`로 뺀다. PDF를 둘 곳을 정하기 전까지는 에디션을 공개하지 않는다(매니페스트가 비어 있어야 운영 링크가 깨지지 않는다).

### 4.3-1 features/price

가격 화면(시세 · 판정). 명세 `.scratch/price-screens/spec.md`, 도메인은 `@workspace/price`.

| 폴더 | 내용 |
|---|---|
| `data/` | 데이터 경계(명세 `.scratch/price-db-read/spec.md`). `price-source.ts`(`PriceSource`, `getPriceSource()`, `server-only`)만 화면이 부른다. 운영 DB `price.current_judgment`를 읽는다: `db.ts`(postgres 클라이언트 하나, `web_reader`, `WEB_DATABASE_URL`, `prepare: false`), `queries/`(메서드마다 SQL 하나와 행 타입), `db-source.ts`(캐시 정책: 목록 `hours` · 검색 `days` · 상세는 React `cache()`만, `@workspace/price/schema`로 zod 검사), `featured.ts`(자주 사는 품종 상수). `data-boundary.test.ts`가 `data/` 밖의 `db` · `db-source` · `queries/` import를 막는다 |
| `home/` | P1 시세 메인 |
| `search/` | P2 품종 검색. 검색어는 `history.replaceState`로 `?q=`에 맞춘다 |
| `basket/` | P4 담은 품종: 판정별 개수, 바뀐 판정 알림, 판정별 묶음, × 빼기, 편집(모두 빼기), 빈 목록. 기기 값을 불러온 뒤에 그린다 |
| `variety-detail/` | P3 품종 상세: `detail-header`(뒤로 · 담기, 최근 본 품종에 넣기. 모바일에서 제목 줄이 헤더 밑으로 사라지면 `DetailHeaderBar`가 로고 자리를 "‹ 품종 · 담기"로 바꾼다), `verdict-card`(판정 전 · 오래됨 · 표본 적음), `range-bar`, `places-section`(장소 비교, 판정 색 없음), `why-section`(`trend-chart` SVG + `dots-compare`), `my-price`(내가 본 가격, 저장 안 함) |
| `components/` | 품종 행(`variety-row`: 네 열 subgrid, 가격 두 줄, 설명 한 줄), 판정 칩 · 점(`verdict-chip`, 색은 `verdict-tone`), `add-button`, `basket-toast`(담기 토스트 "배추를 담았어요 · 목록 보기", 화면 키보드 위로), `basket-badge`(내비 담은 개수), `search-entry`, `recent-varieties`, `price-shell` |
| `stores/` | `basket-store`(`price:basket`, 담을 때 판정 · 조사일), `recent-store`(`price:recent`) |

### 4.4 shared

| 파일 | 내용 |
|---|---|
| `routes.ts` | 앱의 모든 경로 |
| `print-screen.ts` | `/print` 화면의 용지 둘레 여백(`PRINT_SCREEN_GUTTER`). `print.css`(CSS 변수 `--print-gutter`)와 어드민 미리보기 크기 계산이 함께 쓴다 |
| `providers.tsx` | `TooltipProvider`, `OverlayProvider`(overlay-kit). 마운트 뒤 기기 저장 store를 모두 불러온다(`rehydrateDeviceStores`) |
| `device-store.ts` | `deviceStore(키, 기본값, { version, migrate })`: 기기(localStorage) 저장 store를 만든다. 불러오기 전에 쓴 값은 불러온 값 위에 얹는다. 노드(서버 · 테스트)에서는 메모리 저장소 |
| `meta.ts` | `SITE_CONFIG`(사이트 이름 "장볼날"), `siteUrl()`, `absoluteUrl()`, `createMetadata()`, `ogImagePath()` |
| `seo/` | 검색 색인: `pages.ts`(색인 레지스트리. 품종 상세처럼 목록을 데이터 입구에서 읽는 라우트는 `DATA_SEO_PAGES`에 두고 `app/sitemap.ts`가 펼친다)와 가드 테스트, `indexing.ts`(색인 스위치·소유 확인), `json-ld.tsx`(구조화 데이터), `titles.ts`(검색용 제목·설명), `route-pattern.ts` |
| `today.ts` | `getSeoulToday()`: `server-only`. `connection()` 뒤에 서울 오늘을 계산하고 React `cache`로 요청당 한 번 |
| `today-context.tsx` | `TodayProvider`, `useToday()`: 서버가 만든 Promise를 클라이언트가 `use()`로 읽는다. `<Suspense>` 안에서만 |
| `eaten-store.ts` | 먹음 기록: 연도 → 품종 id 목록. localStorage `seasonal:eaten`. `toggleEaten`, `useEatenIds`, `useIsEaten` |
| `shell/` | 가격과 제철이 같이 쓰는 셸: `site-shell`(헤더 + 본문 + 하단 내비), `site-nav`(`SiteHeader`, `FloatingNav`. 내비 칸 72px. 화면별 모바일 헤더 타입은 `HeaderBar`가 헤더의 바 자리에 포털로 그린다), `menus`(영역별 메뉴 설정: 가격 = 시세 · 제철달력 · 담은 품종, 제철 = 시세 · 제철달력 · 계절 · 나의 식탁), `nav-link`(활성 판정). 메뉴 배지(담은 개수)는 영역 레이아웃이 `badges`로 넣는다 |
| `analytics/` | GA4(절차: `apps/web/docs/analytics.md`): `events.ts`(이벤트 카탈로그. 이벤트를 더하고 지우는 곳은 여기 하나, `REGISTERED_PARAMS`는 GA에 등록한 매개변수)와 규칙 테스트, `config.ts`(`GA_MEASUREMENT_ID` · `GA_DEBUG`를 읽는 곳), `analytics-tag.tsx`(루트 layout이 그린다), `track.ts`(`track(이름, 매개변수)`, 화면은 이것만 부른다), `tracked-link.tsx`(서버 컴포넌트 링크에 이벤트) |
| `downloads-manifest.ts` | 게시된 인쇄물 매니페스트(`DOWNLOADS`, `findEdition`, `findWithdrawn`). 내려받기 화면과 sitemap이 같이 읽는다 |
| `brand-logo.tsx` | 고운돋움 Regular를 패스로 만든 장볼날 가로 로고. 모바일에서 접힌 헤더는 심볼만 보여준다 |

## 5. 상태와 "오늘"

| 상태 | 위치 | 저장 | 비고 |
|---|---|---|---|
| 서울 오늘 | `shared/today.ts` → `TodayProvider` → `useToday()` | 없음 (요청마다 서버 계산) | 렌더 중 `new Date()`를 부르지 않는다 |
| 먹음 기록 | `shared/eaten-store.ts` | localStorage `seasonal:eaten` | 앱 전체가 쓴다 |
| 담은 품종 · 최근 본 품종 | `features/price/stores/` | localStorage `price:basket` · `price:recent` | |
| ⚙ 표시 설정 (공휴일, 먹은 품종, 달력 모양) | `features/seasonal/stores/settings-store.ts` | localStorage `seasonal:settings` | |
| 흩어진 배치·달력 자리 | `features/seasonal/stores/scatter-store.ts` | localStorage `seasonal:scatter` | 키는 `(달, 화면 구간)` |
| 2b 열 수 | `features/seasonal/month-timeline/view-store.ts` | 없음 | 달을 바꿔도 유지 |

저장하는 store는 모두 `shared/device-store.ts`의 `deviceStore`로 만든다(안은 zustand `persist` + `skipHydration`). 서버 HTML과 첫 클라이언트 렌더는 기본값으로 같게 그리고, `Providers`가 마운트 뒤 한 번에 기기 값을 불러온다. 그래서 ✓와 개수는 하이드레이션 뒤에 나타난다. 자식 effect가 `Providers`보다 먼저 돌아 불러오기 전에 쓰는 일(최근 본 품종 넣기)이 있어, 그런 쓰기는 불러온 값 위에 얹는다. store 모듈은 store를 내보내지 않고 훅과 함수만 내보낸다.

정적 데이터(품종, 달, 계절, 명절, 공휴일)는 모듈 상수라 빌드 때 HTML에 들어간다. 요청 시점에 그리는 것은 "오늘"에 따라 달라지는 부분(2a 히어로, 1h)뿐이다.

## 6. packages/seasonal

제철달력의 도메인. React, Next.js, DOM을 모른다. 인쇄 페이지(`.scratch/calendar-print/spec.md`)도 이 코드를 쓴다. 의존성: `date-fns`, `@date-fns/tz`, `@hyunbinseo/holidays-kr`, `es-hangul`, `zod`(인쇄 사양 파서).

| 모듈 | 내용 |
|---|---|
| `data/foods.ts` | `Food` 타입, `FOODS`(검증 품종 전체, 가나다순), `foodsInMonth`, `foodsInSeason`, `findFood`, `isDrawn`, `seasonsOf`, 대표 품종 `monthHighlights`·`seasonHighlights`(인쇄물용 고르기는 `print/foods.ts`) |
| `data/foods.generated.ts` | 생성 파일. 품종 행 (`id`, `name`, `aliases`, `category`, `months`) |
| `data/drawn-foods.generated.ts` | 생성 파일. 일러스트가 있는 품종 id |
| `data/food-bounds.generated.ts` | 생성 파일. 그림이 상자 안에서 아래로 어디까지 그려지는지 (이름표 위치) |
| `data/food-sizes.ts` | `FOOD_SCALE`: 작아 보이는 품종의 그림 배율. 손으로 조정 |
| `data/months.ts` | `MONTHS`, `isMonth`, `formatSeasonMonths`, `orderSeasonMonths` |
| `data/seasons.ts` | `SEASONS`, `SEASON_MONTHS`, `isSeason`, `seasonOfMonth` |
| `data/festivals.ts` | `FESTIVALS`(전통 음식 포함), `festivalOf`(slug로 찾기), 연도별 날짜, `upcomingFestival`, `festivalsInMonth`, `festivalsWithFood` |
| `data/copy.ts` | 화면 문구: 달별 문구, 계절 설명, 명절 배경, UI 문구, 먹음 라벨 |
| `calendar/today.ts` | `TIME_ZONE`(Asia/Seoul), `seoulNow`, `seoulToday`, `currentMonth` |
| `calendar/month-calendar.ts` | 달력 칸 계산(일·월요일 시작), `CalendarDate` |
| `calendar/variants.ts` | 달력 모양 4가지(`CALENDAR_VARIANTS`)와 이름. 화면 ⚙와 인쇄물이 같이 쓴다 |
| `calendar/holidays.ts` | 그 달 공휴일 |
| `calendar/lunar.ts` | 음력 → 양력, 동지 |
| `calendar/date-utils.ts` | 요일 이름, 달의 날 수 |
| `layout/scatter.ts` | 흩어진 배치. 시드 난수(LCG)로 같은 입력이면 같은 결과, 0..1 정규화 좌표, 화면 구간(`SCATTER_FRAMES`)별 고정 비율 |
| `layout/arrangement.ts` | 시드 뒤의 판 위 자리: 저장된 배치 병합(`restingSpots`), 끄는 동안(`moveSpot`)·놓은 뒤(`settleSpots`) 겹침 풀기, 판 위 달력 가두기. 시드와 같은 그림+이름표 겹침 규칙 |
| `search/match-foods.ts` | 이름·별칭·초성 검색 |
| `print/layouts.ts` | 인쇄물 구성(layout) 정의 한 곳: 종류별 구성 값(`LAYOUTS`)과 값마다 이름 · 와이어프레임 안 코드 · 세로 전용 · 품종 판 크기 상한 · 읽지 않는 옵션(`LAYOUT_DEFS`), `layoutReads`, `foodsPerCell`. 스키마 · 어드민 편집 폼 · 품종 고르기가 여기서 읽는다. 새 구성은 이 파일과 종류별 화면에 더한다 |
| `print/spec.ts` | 인쇄 사양 `PrintSpec`(종류별 유니언, zod 파서), `PAPERS`, `sheetSize`(방향 반영 용지 mm), `pageCount`(결과 PDF 쪽 수, 사양·용지마다 파일 하나), 종류별 기본값, URL 인코딩, 해시 |
| `print/edition.ts` | 에디션, 다운로드 경로, 매니페스트 |
| `print/foods.ts` | 인쇄물 칸(달·계절)에 넣을 품종 고르기 |

테스트는 `*.test.ts`가 옆에 있다(vitest, 8개 파일). `packages/seasonal/README.md`도 참고한다.

## 6-1. packages/price

가격 화면(시세 · 판정)의 도메인. `packages/seasonal`과 같은 모양이다(순수 TypeScript, `exports: "./*": "./src/*.ts"`). 의존성: `es-hangul`. 화면 명세는 `.scratch/price-screens/spec.md`.

| 모듈 | 내용 |
|---|---|
| `types.ts` | 화면이 읽는 모양: `VarietySummary`(목록 행, 뷰 `current_judgment` 열), `VarietyDetail`(상세, `judgment_snapshot.payload`), `Verdict`, `VerdictBand`, `PlaceQuote`, `TrendPoint`, `SearchIndex` |
| `verdict.ts` | `verdictOf(price, usual, band)`: 평소가 대비 반올림 % 와 싸요 · 보통 · 비싸요. 평소가가 없으면 판정 전. "내가 본 가격"도 이 함수. `verdictOfPct(pct, band)`: 이미 낸 %를 구간에 견줌(판정 배치가 판정 차이로 부름) |
| `search.ts` | `searchVarieties`: 별칭 → 품목("어떤 호박인가요?") → 카테고리 → 이름 · 초성 · 품목 · 별칭 일부 → 한 글자 오타. `matchRange`(이름 강조) |
| `list.ts` | 목록 순수 함수: 최근 조사일, id 순서로 고르기 |
| `trend.ts` | 추이 기간 자르기(`trendWindow`), 급등 · 급락 점(`spikesOf`) |
| `basket.ts` | 담은 품종 묶음 · 개수 · 판정이 바뀐 품종(`basketView`) |
| `places.ts` | 장소를 업태별 · 싼 순으로(`placesByType`), 전국 같은 값(`sameEverywhere`) |
| `format.ts` | 원 표시, 날짜 문자열("YYYY-MM-DD") 계산, "2주 전" |
| `copy.ts` | 화면 문구, 판정 칩 · 차이 문구, 받침에 맞는 조사(`withJosa`) |

테스트는 `*.test.ts`가 옆에 있다(vitest).

## 7. packages/ui

| 경로 | 내용 |
|---|---|
| `src/styles/globals.css` | Oura 팔레트(`--color-canvas`, `--color-gold`, `--color-season-*` …), 서체 변수(`--font-heading`, `--font-number`). 색의 유일한 원천 |
| `src/styles/cojeev.css` | cojeev 스타일 import 목록과 cojeev 팔레트(`--v-*`)의 Oura 덮어쓰기 |
| `src/styles/cojeev/*.css` | cojeev 컴포넌트별 CSS (설치 시 생성) |
| `src/styles/cojeev-fonts.css`, `fonts/` | cojeev display 서체(Bricolage Grotesque, DM Sans)와 라이선스 |
| `src/components/` | cojeev·shadcn에서 받은 컴포넌트와 직접 만든 범용 컴포넌트 |
| `src/lib/cojeev/`, `src/lib/cojeev-motion/` | cojeev 컴포넌트가 쓰는 기하·모션 코드 (설치 시 생성) |
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
- 브랜드 파일(`apps/web/public/images/brand/`, `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`)은 `prototypes/branding/`에서 손으로 복사한다(`apps/web/docs/brand-assets.md`). `logo-lockup.svg`·`logo-lockup-ivory.svg`는 고운돋움 Regular의 글자 윤곽을 포함한 가로 로고이며, `GowunDodum-OFL.txt`는 서체 라이선스다.

## 8-1. 가격 DB (supabase/, packages/price-db)

| 경로 | 내용 |
|---|---|
| `supabase/config.toml` | 로컬 Supabase 설정. 포트는 5532x대(API 55321, DB 55322), `raw` 버킷(비공개) |
| `supabase/migrations/` | `price_foundation`(확장·스키마·롤), `price_tables`(표 40개·뷰), `price_grants_rls`(GRANT·RLS 정책), `price_calc_param_retention`(계산 상수 초기값, 보존 정리 함수), `price_comments`(모든 표·열·함수의 DB 주석: 뜻, 단위·형식, null의 뜻, 원천 필드명). 표 정의의 기준이다 (pipeline.md 3장은 설계 이유) |
| `supabase/seed.sql` | `supabase db reset` 때만 들어가는 로컬 기준 데이터: 지역(전국·시도), 샘플 품종 임시 목록, 환산 규칙, 운영에 없는 판매처(운영 판매처는 마이그레이션 `20261029000100`). 끝에서 기본 규격 검사를 돌린다 |
| `packages/price-db/src/` | 로컬 접속(`db.ts`), 샘플 응답 파서(`samples.ts`), 샘플용 관측값 적재·백필(`observation-load.ts`, 병합은 `@workspace/price-ingest/load/observation`을 쓴다), 간이 집계(`aggregate.ts`), 샘플 테스트 데이터(`load-samples.ts`) |
| `packages/price-db/test/*.db.test.ts` | 권한·RLS·제약·적재 시나리오·DB 주석 빠짐·ERD 최신 여부. 로컬 DB가 떠 있어야 해서 루트 `pnpm test`에는 들어가지 않는다 |
| `packages/price-db/scripts/` | `load-samples.ts`, `measure-size.ts`(행당 크기 실측), `build-erd.ts`(`grocery-price/docs/30-data/schema-map.html`의 ERD 생성) |

마이그레이션은 운영 DB에 로컬에서 `pnpm exec supabase db push`로 적용한다 (`SUPABASE_DB_PASSWORD`, `ingest-foundation/01`). 시드는 운영 DB에 들어가지 않는다.

## 8-2. 공공 API 수집 모듈 (packages/price-ingest)

| 경로 | 내용 |
|---|---|
| `packages/price-ingest/src/sources/` | 출처별 요청 주소, 응답 판정(성공 코드·게이트웨이 오류·HTTP 상태), 계약 스키마(strict). `kamis.ts`(perDay/price, 성공 `"0"`), `ekape.ts`(consumerPriceDaily, 성공 `00`, http 주소), `chamgagyeok.ts`(ProductPriceInfoService 4기능, 가격 조회만 `serviceKey`, 나머지 `ServiceKey`) |
| `packages/price-ingest/src/contract/` | 응답 형태 기술(`shape.ts`: 경로별 타입), 기준과 실측 비교(`compare.ts`: 실패와 경고), 실측 항목 16개와 기준 파일 경로(`probes.ts`) |
| `packages/price-ingest/src/` 공통 | `errors.ts`(오류 종류, 메시지에 키·주소 없음), `secrets.ts`(비밀값과 인코딩 변형을 지우는 지우개, `describeError`, Actions `::add-mask::` 줄), `http.ts`(fetch 래퍼, 호출 기록 `CallRecord`: 인증키를 뺀 파라미터·HTTP 상태·resultCode·행 수), `response.ts`(XML·JSON 읽기, 판정), `validate.ts`(검사 결과를 필드 경로로 풀어 쓰기) |
| `packages/price-ingest/src/adapt/` | 어댑터: 응답 행 → 관측값 초안 (원천 키·장소 키. DB 번호는 적재가 만든다). `kamis.ts`·`ekape.ts`(평년 행은 `reference`)·`chamga.ts`, 행 단위 거부(`*RowRejection`, `batch.ts`의 `adaptRows`), 단위 환산(`units.ts`), 매핑 함수와 미매핑 리포트(`mapping.ts`), 초안 스키마와 `ADAPTER_VERSION`(`draft.ts`) |
| `packages/price-ingest/src/load/` | 원본 보관과 대조: 원본 파일 형식(`raw-file.ts`: 헤더 + 행, 행만의 내용 해시, 객체 키와 `raw/…` storage_path), Storage(`storage.ts`, 비밀 키), 실행·원본 기록(`ledger.ts`), 최근 7일 대조(`reconcile.ts`, `window.ts`), 접속(`db.ts`, `ingest_writer`). 적재: 원본 파일 하나를 한 트랜잭션으로(`load-file.ts`, 헤더 `job`이 `backfill`인 KAMIS 원본은 90일 밖의 날을 관측값에 넣지 않고 임시 표에서 바로 시세 요약으로 낸다), `pending_load` 모두(`load-pending.ts`), 원천 키·관측 위치·시장(`masters.ts`), 참가격 점포·상품 마스터와 상품 연결(`chamga.ts`), 임시 표 COPY(`copy.ts`)와 바뀐 행만 고쳐 쓰는 병합(`observation.ts`), 품종·기준 단위 가격 붙이기와 다시 매핑(`variety.ts`, 적재가 파일마다 카탈로그 매핑도 부른다), 일자 요약 다시 계산(`daily-quote.ts`, 수집 실행이 적재 뒤에 부른다. 백필 임시 표의 요약 `aggregateStagedQuotes`도 같은 표본·집계), KAMIS 시장 유형·코드표(`kamis-market.ts`, `kamis-market-codes.ts`). `price-db`도 이 병합을 쓴다 (`exports` `./*`) |
| `packages/price-ingest/test/` | 오프라인 테스트 (`pnpm test`에 들어간다. 키·네트워크 없음): 요청 주소, 가짜 응답으로 본 클라이언트 동작·호출 기록·페이지, 샘플 계약, 필드 이름 변경 감지, 어댑터와 3-12 케이스, 원본 형식. `test/fixtures/`는 임시 매핑 |
| `packages/price-ingest/test/db/` | 로컬 DB·Storage 통합 테스트 (`pnpm --filter @workspace/price-ingest test:db`, `pnpm db:start` 필요): 대조, 적재(정정·거부·평년 행, 참가격 마스터·상품 연결·행사, 같은 출처 동시 적재의 lock, DB 없이 올린 원본의 대조 → 적재). KAMIS 백필(90일 밖은 정기 경로와 같은 요약, 예산·DB 크기에서 멈춤, 이어 받기, 백필 lock). 접속 도우미는 `local.ts`, KAMIS 원본 파일 도우미는 `files.ts`. 루트 `pnpm test`에는 들어가지 않는다 |
| `packages/price-ingest/test/live/` | 실측 테스트 (`pnpm --filter @workspace/price-ingest test:live`). 루트 `.env`의 `DATA_GO_KR_SERVICE_KEY`로 16회 호출한다. 명시적으로 켤 때만 돈다. 수집 시각 앞뒤로 돌리지 않는다 |
| `packages/price-ingest/baseline/contract-baseline.json` | 실측으로 만든 기준: 필드 타입, 코드 목록, 건수. 값(가격)은 없다. 의도한 응답 변경일 때만 `pnpm --filter @workspace/price-ingest contract:baseline`으로 다시 만든다 |
| `packages/price-ingest/scripts/capture-baseline.ts` | 기준 파일 생성. 계약과 다른 응답은 저장하지 않는다 |
| `packages/price-ingest/src/ingest/`, `src/cli.ts` | 수집 실행: 호출 예산·재시도·멈춤 판정(`calls.ts`), 출처별 호출 계획과 원본 파일 묶기(`collect.ts`, KAMIS 품목 140개 `kamis-items.ts`), 참가격 조사일 감지·완료 규칙(`chamga-schedule.ts`, 상태는 `load/survey-day.ts`), 실행 한 번(`run.ts`: 실행 기록 → 호출 → 업로드(바로 전 파일과 같으면 중복 기록) → 대조 → 적재 → 마감, 종료 코드 `EXIT`), 명령 진입점(`cli.ts`) |
| `packages/price-ingest/src/backfill/` | KAMIS 소매·축평원 3년 백필 (ingest-foundation/04): 묶음 목록(`plan.ts`, KAMIS는 품목 × 해로 카탈로그에서 KAMIS가 대표인 품목만, 축평원은 축종 × 달, 둘 다 최근부터), 실행 한 번(`run.ts`: 묶음마다 호출 → 원본 업로드 → 백필 원본 적재 → 90일 안 재계산 → `backfill_task`, 예산·DB 400MB에서 멈춤, 출처마다 세션 lock으로 한 번에 하나), 명령 진입점(`cli.ts`) |
| `packages/price-ingest/scripts/probe-runner.ts` | 공공 API 3개·Supabase DB·Storage에 한 번씩 붙어 성공과 걸린 시간만 찍는다 (러너 접속 실측) |
| `packages/price-ingest/src/alert/` | 수집 알림과 heartbeat (ingest-schedule/13·14): 알릴지 정하기(`decide.ts`: 키 오류·원본 저장 실패·예상 못한 실패는 즉시, 일부 실패·DB 접속 실패·시간 초과는 2회 연속), 이슈 묶기(`issues.ts`: 라벨 `ingest-alert`·`source:`·`cause:`로 열린 이슈에 댓글, 성공하면 그 출처의 알림을 닫음, 본문에 키·주소 없음, `gh` CLI), 수집 워크플로의 알림 잡 진입점(`cli.ts`), 주 1회 점검(`heartbeat.ts`: 꺼진 수집 워크플로 다시 켜기, 출처별 멈춤, Supabase Storage·DB 접속) |
| `packages/price-ingest/src/usual/` | 평소가 (judgment.md): 수준 × 계절비율 순수 함수(`season.ts`: 계절비율, 수준, 평소가, 판정 전 이유, 판정 구간, 카테고리 공통 구간), 여러 규격 한 번에(`compute.ts`), 명령(`cli.ts`: `daily_quote` national → `usual_price`·`season_index`, 숫자는 `calc_param usual.*`에서 읽음). 백테스트는 `scripts/season-backtest.ts`, 숫자 정하기(표본 밖, 창·수준·구간을 바꿔 가며)는 `scripts/judgment-sweep.ts` |
| `packages/price-ingest/src/judgment/` | 판정 배치 (pipeline.md 4-1 · 4-3): 판정 한 행 순수 함수(`build.ts`: 시세 · 평소가 행 · 시장 표본 · 판매가 → `VarietyDetail` payload와 목록 열), 명령(`cli.ts`: 활성 품종의 대표 규격마다 `judgment_snapshot`을 새 묶음에 쓰고 검사를 넘으면 `judgment_current`를 바꿈, 묶음은 최근 7개) |
| `packages/price-ingest/src/catalog/` | 품종 카탈로그 (ingest-foundation/08): 분류 표와 매핑의 원본 데이터(`varieties.ts`, 사람이 읽는 표는 `grocery-price/docs/30-data/variety-list.md`이고 `test/catalog.test.ts`가 둘과 실측 코드표가 맞는지 본다), 원천 키 → 품종·규격·대표 여부(`match.ts`), DB 적용(`apply.ts`), 명령 진입점(`cli.ts`) |

수집 CLI와 GitHub Actions 워크플로는 `ingest-foundation/03`에서 이 패키지에 더한다.

## 9. 명령어

루트에서 실행한다. Turborepo가 각 패키지의 같은 이름 스크립트를 돌린다.

| 명령 | 내용 |
|---|---|
| `pnpm dev` | `next dev` (apps/web) |
| `pnpm build` | `next build` |
| `pnpm typecheck` | 패키지마다 `tsc --noEmit` |
| `pnpm lint` | ESLint (2026-10-15 기준 0 오류, `packages/ui` 경고 4건) |
| `pnpm test` | vitest: `packages/seasonal`, `packages/price`, `packages/ui`, `packages/price-ingest`(오프라인), `apps/web`(SEO 가드 포함) |
| `pnpm format` | Prettier |
| `pnpm ui:add <name-or-url>` | cojeev·shadcn 컴포넌트를 `packages/ui`에 설치 |
| `pnpm foods:sync` / `pnpm foods:bounds` | 일러스트 동기화 / 그림 아래 끝 재측정 |
| `pnpm --filter @workspace/seasonal build:foods` | 품종 목록 생성 |
| `pnpm db:start` / `pnpm db:stop` | 로컬 Supabase (Docker). 쓰지 않는 서비스는 끄고 띄운다. DB 어드민은 Studio http://127.0.0.1:55323 (Table Editor에서 schema `price`) |
| `pnpm db:reset` | 로컬 DB를 지우고 마이그레이션·시드를 다시 적용 |
| `pnpm db:test` | DB 테스트 (`db reset` → 샘플 적재 → 권한·RLS·적재 검사). `pnpm db:start` 뒤에 |
| `pnpm db:erd` | `schema-map.html`의 ERD를 로컬 DB에서 다시 만든다 |
| `pnpm --filter @workspace/price-db load:samples` / `measure` | 샘플 테스트 데이터 넣기 / 행당 크기 실측 |
| `pnpm --filter @workspace/price-ingest ingest --source kamis\|ekape [--date YYYY-MM-DD]` / `--source chamga [--survey-day YYYY-MM-DD ...]` (조사일 없으면 자동 모드) | 수집 한 번. 환경변수 4개(`DATA_GO_KR_SERVICE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `INGEST_DATABASE_URL`)를 넘긴다. `.env`를 스스로 읽지 않으므로 운영에 넣을지 로컬에 넣을지 직접 정한다. 종료 코드 0 성공, 1 부분, 2 키 오류, 3 DB 실패, 4 업로드 실패, 9 예상 밖 |
| `pnpm --filter @workspace/price-ingest catalog --classes\|--mappings [--dry-run]` | 품종 카탈로그를 DB에 넣는다. `--classes`는 분류 표(소유자 접속 `OWNER_DATABASE_URL`, 로컬에서만), `--mappings`는 pending 매핑을 카탈로그대로 잇고 이미 쌓인 관측값을 다시 매핑한다(`INGEST_DATABASE_URL`). 분류 표가 먼저다. `.env`를 읽지 않는다 |
| `pnpm --filter @workspace/price-ingest backfill [--source kamis\|ekape] [--years 3] [--item 코드 ...] [--budget 6000]` | 백필. 환경변수는 수집과 같은 4개. KAMIS(기본)는 정기 수집이 끝난 뒤 사람이 부르고, 축평원은 `ingest-ekape.yml`이 정기 수집 뒤에 매일 부른다. `--item`은 KAMIS 품목 코드 또는 축평원 축종 코드. 예산(KAMIS 기본 6,000·최대 9,000, 축평원 900·950)을 다 쓰면 멈추고 다음 실행이 `backfill_task`에서 이어 받는다 |
| `pnpm --filter @workspace/price-ingest purge [--dry-run]` | 주 1회 보존 정리 (`INGEST_DATABASE_URL`): KAMIS 관측값 90일, 참가격 6 조사일. 그날 요약이 없으면 지우지 않는다. 시세 요약은 182일이 지나면 시장 유형 범위를 지우고 national만 남긴다. KAMIS 워크플로 월요일 실행이 부른다 |
| `pnpm --filter @workspace/price-ingest summary [--from-raw \| --check] [--day YYYY-MM-DD ...] [--dry-run]` | 참가격 상품 요약 (`INGEST_DATABASE_URL`, 원본을 읽으면 `SUPABASE_URL`·`SUPABASE_SECRET_KEY`). 기본은 관측값에서 다시 계산(날을 안 주면 요약 없는 조사일), `--from-raw`는 관측값을 지운 조사일을 Storage 원본에서, `--check`는 두 길의 결과가 같은지 보고 되돌린다. 정기 수집은 적재 뒤에 스스로 계산한다 |
| `pnpm --filter @workspace/price-ingest alert --source <출처> --workflow <파일> [--exit-code N]` | 수집 워크플로의 `alert` 잡이 부른다 (`GH_TOKEN`·`GH_REPO`, 비밀값 없음). 실패면 알림 이슈를 열거나 댓글, 성공이면 그 출처의 알림 이슈를 닫는다 |
| `pnpm --filter @workspace/price-ingest heartbeat` | `.github/workflows/heartbeat.yml`(수 11:00 KST)이 부른다: 꺼진 수집 워크플로를 켜고, 멈춘 출처·Supabase 일시정지를 알린다 |
| `pnpm --filter @workspace/price-ingest usual [--to YYYY-MM-DD] [--days N] [--dry-run]` | 평소가와 계절비율 (`INGEST_DATABASE_URL`). 기본은 시세가 있는 마지막 날까지 7일. KAMIS 워크플로가 수집 뒤에 부른다. 6개월을 처음 채울 때 `--days 182` |
| `pnpm --filter @workspace/price-ingest judgment [--trigger 이름] [--dry-run]` | 판정 묶음을 만들고 포인터를 바꾼다 (`INGEST_DATABASE_URL`). 행이 없거나 지금 묶음보다 20% 넘게 줄면 `failed`로 두고 종료 코드 1. 세 수집 워크플로가 부른다 |
| `pnpm --filter @workspace/price-ingest probe:runner` | 접속 실측 (루트 `.env`를 읽는다. API 3회) |
| `scripts/check-no-secrets.sh [--tree]` | `.env` 값이 커밋 대상에 들어갔는지 검사 (pre-commit) |

처음 클론하면 `git config core.hooksPath .githooks`를 한 번 실행한다.

## 10. grocery-price (가격 서비스 문서)

```
grocery-price/
├─ README.md                 진행 현황과 문서 지도
├─ GLOSSARY.md               용어집 (카테고리·품목·품종·규격, 제철, 먹음 기록 …). 저장소 전체가 따른다
├─ docs/
│  ├─ 00-overview/           product-concept.md, roadmap.md (4단계: 수집 기반·판정 설계·화면 설계·구현)
│  ├─ 10-research/           api-spec.md (API 실측), gov-price-sites (정부 가격 화면 대조), public-data-survey, data-sourcing-legal, content-and-taxonomy, images, supabase-skills
│  ├─ 20-domain/             domain-model.md
│  ├─ 30-data/               pipeline.md (저장 구조, 테이블, 수집 일정, 장애 처리), judgment.md (평소가·판정 계산), variety-list.md (품종 목록), schema-map.html (데이터 지도, ERD는 pnpm db:erd가 생성)
│  └─ adr/                   0001 공공데이터와 제보, 크롤링 안 함 · 0002 Supabase + GitHub Actions
└─ reference/public-data/
   ├─ kamis/, ekape/         원본 API 명세·코드표
   └─ samples/               실호출 응답 샘플, fetch-samples.sh, viewer/(api-explorer.html, build.py, smoke.sh)
```

## 11. 작업 관리 (.scratch)

| 폴더 | 내용 | 상태 |
|---|---|---|
| `seasonal-mvp/` | 제철달력 MVP 화면 13개 티켓 | 01~11 resolved, 12 ready-for-agent(데스크톱·태블릿), 13 needs-info(디자인 다듬기) |
| `calendar-print/` | 달력 PDF 어드민(에디션 생성·공개)과 다운로드 | 1차 구현됨(인쇄물 4종, 어드민, 내려받기). 배치 끌어 옮기기·명절·음력 옵션은 남음 |
| `seo/` | 검색 색인(SEO) 기반: 레지스트리·sitemap·robots·JSON-LD·색인 스위치 | 01~07 resolved, 08 needs-triage(품종 본문 보강) |
| `ingest-foundation/` | 가격 서비스 ① 수집 기반: Supabase 설정, 스키마, 수집 패키지·Actions, 백필, 장애 처리, 웹앱 읽기 | 01 ready-for-human(Supabase 계정), 02 resolved (스키마·마이그레이션·RLS, 로컬 검증), 03~05 ready-for-agent, 06 resolved (서버 전용 읽기) |
| `p2-data-source-spec/` | 가격 서비스 ① 요청·응답 분석 (이전 번호 P2) | 진행 중. 01 resolved, 05 wontfix, 08~10 후순위 |
| `p3-variety-catalog/` | ② 품종 목록, 점포 데이터가 없는 품종의 대응 (이전 번호 P3) | ready-for-human |
| `p4-canonical-model/` | ① 통합 스키마·어댑터 (이전 번호 P4) | 01·03 ready-for-agent, 02 resolved (ADR 0002) |
| `search-first-view/` | 검색 한 번에 보는 가격: 정부 화면 벤치마킹, 검색 결과 결정 | 01~03 resolved, 04·05·07 ready-for-agent, 06 ready-for-human |

형식은 `docs/agents/issue-tracker.md`, 라벨은 `docs/agents/triage-labels.md`를 따른다.

## 12. 문서 지도

| 알고 싶은 것 | 문서 |
|---|---|
| 에이전트 규칙 | `AGENTS.md` |
| 제철 화면 명세 | `prototypes/seasonal-food/wireframes/WIREFRAME-SPEC.md` (Git 밖) |
| 명세와 다르게 정한 것, MVP 결정 | `.scratch/seasonal-mvp/spec.md` |
| SEO 결정(색인 정책, 구조화 데이터, 제목 패턴) | `.scratch/seo/spec.md` |
| 색·서체 | `apps/web/DESIGN.md`, `packages/ui/src/styles/globals.css` |
| Next 16 렌더링·캐시 근거 | `apps/web/docs/nextjs-16-patterns.md` |
| 로고·파비콘 | `apps/web/docs/brand-assets.md` |
| 새 페이지의 검색 색인 연결 | `apps/web/docs/seo.md` |
| 분석 이벤트 더하기 · 지우기, GA 설정, 개인정보 처리방침 | `apps/web/docs/analytics.md` |
| 도메인 패키지 규칙 | `packages/seasonal/README.md` |
| 용어 | `grocery-price/GLOSSARY.md` |
| 가격 서비스 단계 | `grocery-price/docs/00-overview/roadmap.md` |
| 가격 수집 설계 | `grocery-price/docs/30-data/pipeline.md`, ADR 0002 |
| 가격 DB 표 정의 | `supabase/migrations/` |
| 공공 API 호출 | `grocery-price/docs/10-research/api-spec.md` |
| 일러스트 출처 | `apps/web/public/foods/PROVENANCE.md` |
