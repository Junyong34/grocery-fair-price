# 번들 audit 보고서 (2026-11-05)

`next-bundle-optimizer` 스킬, **audit 모드**. 앱 소스·의존성·lockfile은 바꾸지 않았다.

## 범위와 증거

| 항목 | 값 |
|---|---|
| 범위 | `apps/web` 전체 35개 경로 |
| 스냅샷 | `audit-before-2026-11` (`.next/diagnostics/analyze/history/`) |
| 내보낸 파일 | `/tmp/analyze-before/<route>.jsonl.gz` 34개 (경로별 `--route` 내보내기) |
| 스키마 | 설치된 `next@16.4.3/analyze/graph-v1.schema.json` |
| 지표 | `[client-fs]` 출력의 `part.compressed_size` 합. JS는 `bootstrap` + `render_dependent` 그룹을 "초기", `async` 그룹을 "지연"으로 본다 |
| 분석 스크립트 | `/tmp/ba-scripts/{summ,top,chain,importers,cut,leak}.js` |

**모든 수치는 빌드 증거(attributed compressed bytes)다.** 실제 전송량, 요청 순서, 로딩 시간은 측정하지 않았다. `render_dependent`에는 첫 렌더 뒤에 쓰이는 출력도 섞일 수 있다(스키마 설명).

### 커버리지 공백

- **전체 앱 내보내기 실패.** `next analyze export`(경로 지정 없음)가 `/seasonal/[...catchAll]/analyze.data` ENOENT로 멈춘다. `routes.json`에는 이 경로가 있는데 데이터 파일이 없다. `@sheet/[...catchAll]`(null을 렌더하는 슬롯)로 보이며, Next 16.4.3 analyzer 쪽 문제로 추정한다. 그래서 나머지 34개 경로를 하나씩 내보냈고, 이 경로 하나는 분석에서 빠졌다.
- 커뮤니티 탐지(Louvain)와 그래프 min-cut 솔버는 돌리지 않았다. 아래 "방법" 참고.
- woff2 283개(약 6.1MB)는 `unicode-range` 서브셋이라 실제로는 쓰인 글자만 받는다. 빌드 증거만으로는 판단할 수 없어 후보에서 뺐다.

## 기준선: 경로별 초기 client JS (압축)

| 경로 | bootstrap | render_dependent | 비고 |
|---|---|---|---|
| 모든 경로 공통 바닥(`/privacy`, `/_not-found`) | 161.2K | 229.2K | 거의 정적인 페이지도 약 390K |
| `/seasonal` (2a 이달) | 161.2K | 308.2K | 지연 JS 105.8K 별도 |
| `/` (시세 메인) | 161.2K | 281.7K | |
| `/prices/[variety]` | 161.2K | 295.7K | |
| `/seasonal/(.)foods/[food]` | 161.2K | 291.4K | |
| `/admin/edit` (개발 전용) | 161.2K | 378.2K | |

CSS는 모든 경로가 약 103K다. 내역은 `app/globals.css` 58.5K, Gowun Batang `@font-face` 30.3K, Pretendard dynamic-subset 13.8K.

**결론:** 경로마다 다른 부분(약 50~80K)보다 **모든 경로가 함께 내는 바닥(공통 레이아웃·셸)**이 훨씬 크다. 후보 1, 2가 모두 그 바닥에 있다.

`/privacy` 바닥의 기여 순위(초기 JS):

```
218.0K  next (React·runtime 포함)
 51.7K  motion-dom      ┐ 후보 2
 19.8K  framer-motion   ┘
 33.2K  zod             ← 후보 1
 25.4K  packages/ui/src/lib (cojeev-motion 대부분)
 10.0K  packages/seasonal/src/data (foods.generated 등, 후보 1에 일부 포함)
  8.2K  tailwind-merge
```

## 후보

### 후보 1: `shared/routes.ts`가 인쇄 사양 모듈 전체를 모든 페이지에 싣는다 (권장 1순위)

- **사슬(동기):** `app/error.tsx`(client) → `apps/web/shared/routes.ts` → `packages/seasonal/src/print/spec.ts` → `zod` + `data/foods.ts` + `print/layouts.ts` + `print/month-label.ts` + `calendar/variants` …
- **원인:** `routes.print(spec, paper)`가 `encodeSpec` 하나를 쓰려고 `spec.ts`를 import한다. `encodeSpec`(spec.ts:272)은 `JSON.stringify` + base64url뿐이라 zod가 필요 없다. 그런데 `spec.ts`는 맨 위에서 `zod`와 품종 데이터를 import한다. `routes.ts`는 거의 모든 client 컴포넌트가 쓰므로 이 사슬이 모든 경로에 실린다.
- **호출처:** `routes.print`를 쓰는 곳은 `features/admin-print/server/generate.ts`(서버)와 `features/admin-print/editor/preview-panel.tsx`(어드민 client) 두 곳뿐이다. 둘 다 개발 전용 `/admin`이다.
- **도달성:** `/seasonal`, `/`, `/prices/[variety]`에서 `print/spec.ts`·`print/edition.ts`를 동기로 부르는 client importer는 `routes.ts → spec.ts` 하나뿐이다(`importers.js`). `edition.ts`도 zod를 import하지만 공개 경로에서는 client root에서 닿지 않는다.
- **edge 하나를 끊었을 때(`cut.js`, 다른 경로로 계속 닿는 모듈은 제외):**

  | 경로 | 사라지는 모듈 | 초기 JS 감소(압축) |
  |---|---|---|
  | `/privacy`, `/`, `/prices/[variety]` | 29개 | **42.8K** |
  | `/seasonal` | 25개 | **36.7K** |

  공개 경로 초기 JS의 약 10%다. 같은 shared chunk를 거의 모든 경로가 받으므로 효과가 앱 전체에 퍼진다.
- **제안 수정:**
  1. `routes.print`를 `routes.ts`에서 빼서 어드민 전용 모듈(예: `features/admin-print/print-url.ts`)로 옮긴다. 두 호출처만 import를 바꾸면 된다.
  2. 또는 `encodeSpec`·`decodeSpec`과 그 타입을 zod 없는 작은 파일(예: `print/spec-codec.ts`)로 분리하고 `routes.ts`는 그 파일만 import한다. `decodeSpec`은 `parsePrintSpec`(zod)을 쓰므로 `spec.ts`에 남긴다.

  1번이 더 단순하다. AGENTS.md의 "경로는 `routes`로 만든다" 규칙과 부딪히는지는 결정해야 한다. 규칙을 지키려면 2번을 고른다.
- **동작 영향:** 보이는 동작 변화는 없다. 확인할 것은 `/print?spec=…` 미리보기(어드민 편집기)와 "PDF 생성"이 만드는 URL이 같은지다. `encodeSpec` 테스트가 있으면 그대로 통과해야 한다.
- **방법:** 직접 importer 추론 + 도달 집합 차분(edge 제거 뒤 BFS). importer가 하나라 그래프 솔버 없이도 모든 동기 경로가 설명된다.

### 후보 2: cojeev `Button`이 motion(약 70K)을 모든 페이지에 끌어온다 (판단 필요, 2순위)

- **사슬(동기):** `shared/shell/install-prompt.tsx` → `packages/ui/src/components/button.tsx` → `presence.tsx`(`AnimatePresence`) / `spinner.tsx`(`motion/react`) / `lib/cojeev-motion/*`
- **motion을 import하는 프로젝트 파일:** `presence.tsx`, `spinner.tsx`, `cojeev-motion/choreography.ts`, `cojeev-motion/flow-motion.ts`. `/seasonal`에서는 `text-reveal.tsx`가 하나 더 있다.
- **Button → presence/spinner/cojeev-motion edge를 끊었을 때:**

  | 경로 | 초기 JS 감소(압축) |
  |---|---|
  | `/privacy` | 42.1K (모듈 140개) |
  | `/` | 41.0K (모듈 139개) |
  | `/seasonal` | **1.5K**. `text-reveal`이 motion을 따로 동기로 부르므로 거의 그대로 남는다 |

- **판단이 필요한 이유:**
  - `button.tsx`는 cojeev에서 받은 파일이다. 로딩 morph와 press 효과가 Button 디자인의 일부라서, 고치면 보이는 동작(로딩 표시 애니메이션)이 바뀔 수 있다.
  - `/seasonal`은 text-reveal도 손봐야 효과가 난다.
  - AGENTS.md는 drag·spring에 motion을 쓰라고 하므로 motion 자체를 없애는 것이 목표는 아니다. 첫 로드에서 미루는 것이 목표다.
- **가능한 방향(검증 전):**
  - (a) Button의 `loading` 표시(Spinner + MotionPresence)를 `loading`일 때만 lazy로 불러오기. 단, `useMorph`·`useFlowPress`가 motion 없이 동작하는지 먼저 확인해야 한다.
  - (b) `LazyMotion` + `m` + `domAnimation`으로 기능 묶음 줄이기.

  둘 다 fix 모드에서 before/after 스냅샷과 브라우저 확인이 필요하다.
- **공백:** `use-morph.ts`, `flow-press.ts`가 motion에 런타임으로 의존하는지는 소스를 끝까지 읽지 않았다. 잘라낸 edge의 실현 가능성은 아직 증명되지 않았다(그래프상 known subgraph 기준의 잠정 cut).

### 후보 3: 공통 CSS 103K (낮음, 증거 부족)

- `app/globals.css`가 `@workspace/ui/cojeev.css`의 49개 컴포넌트 CSS를 모두 import한다. 그중 앱이 import하지 않는 컴포넌트 CSS로 `progress`(7.7K 원본), `item`(7.2K), `article-headings`(2.4K), `separator`, `kbd`가 보인다(`components/<name>"` import 0건, grep 기준).
- 압축 기준 절감은 수 K 수준으로 추정한다. cojeev 파일 정책(`fix-ui-css.mjs`가 import를 자동으로 붙임)과 충돌하므로 우선순위가 낮다.
- Gowun Batang `@font-face` 30.3K는 next/font가 만드는 서브셋 선언이다. 제목 글꼴이라 줄일 수 있을지는 런타임 증거가 필요하다.

### 경로별 차이(참고)

바닥을 뺀 경로별 증가분은 50~80K이고 여러 곳에 고르게 퍼져 있다. 차이가 큰 것은 `packages/ui/src/components`, `features/*`, `@radix-ui/react-toast` 정도다. 한 덩어리로 미룰 만한 큰 기능은 보이지 않는다. 이미 지연된 것: `food-search-dialog`, `lucide-icon-data`(async 그룹).

## Client 의존성 검사 (server-only 유출)

검사 방법: 34개 경로의 `[client-fs]` 출력 멤버와 part를 아래 패턴으로 모두 훑었다. `postgres`, `@aws-sdk`·`@smithy`, `/server/`, `data/(db|queries|price-source|db-source)`, `queries/`, `server-only`, `*.server.*`, `node:`, `app/api`, `.env`, `actions?.ts`, `price-db`, `supabase`.

| 소스 + client importer | 내보낸 식별자 | 경로 | 압축 바이트 | 처리 + 근거 |
|---|---|---|---|---|
| `features/admin-print/server/actions.ts` (`"use server"`, 6개 export) ← `features/admin-print/*` 어드민 client | `…/server/data:531636`, `:590774`, `:92cc97`, `:78dd29` | `/admin` | 125~136B씩 | **suppressed.** Server Action 참조 stub이다. 별도 빌드(BUILD_ID `KisLr1saqb064SoHTG352`)의 client chunk에서 `createServerReference)("…")` 호출만 확인했고 구현 내용은 없다 |
| 같은 파일 | `…/server/data:889261`, `:ca2d9b` | `/admin/edit` | 135B, 130B | **suppressed.** 위와 같다. 6개 export = 6개 stub |
| `features/seasonal/downloads/edition-actions.tsx` (`"use client"`) | `[app-client]` 모듈 | `/seasonal/(.)downloads/[edition]`, `/seasonal/downloads/[edition]` | 1.1K | **suppressed.** 이름에 "actions"가 들어갈 뿐, 다운로드 버튼 UI인 client 컴포넌트다 |

- `postgres`, `@aws-sdk`, `features/price/data/*`(db·queries·price-source)는 **어떤 경로의 client 출력에도 없다.**
- 별도 빌드의 `.next/static/chunks/*.js` 71개를 `S3Client`, `PutObjectCommand`, `WEB_DATABASE_URL`, `R2_SECRET`, `postgres://`, `ingest_writer`, `process.env.R2`로 grep했고 0건이었다.
- 증거 공백:
  - `next analyze --output`은 chunk 파일을 쓰지 않는다. 그래서 내용 확인은 오늘 08:09에 만든 `next build` 출력으로 했다. 스냅샷과 같은 빌드가 아니라 action id 해시가 다르다.
  - `/seasonal/[...catchAll]`은 검사하지 못했다.

### Possible server-only leaks

**찾지 못했다.** 위 표의 3개 항목은 모두 suppressed다.

## 방법 기록

- 스킬은 넓은 audit에서 커뮤니티 탐지 → min-cut 패스를 요구하지만 **이번에는 생략했다.** 이유는 두 가지다.
  - 경로별 차이가 고르게 퍼져 있어(위 "경로별 차이") 미룰 만한 큰 기능 덩어리가 없다.
  - 큰 기여는 모두 공통 바닥의 두 사슬이고, 직접 importer 추론과 edge 제거 시뮬레이션으로 모든 동기 경로가 설명된다.

  그래프 라이브러리(Louvain·max-flow)도 설치하지 않았다. 더 작은 기능 단위 후보를 찾으려면 이 패스를 다시 돌려야 한다.
- 바이트는 경로마다 source path 단위로 한 번씩 셌다. 같은 source path의 여러 변형(`[app-client]`/`[app-ssr]`)은 client 출력의 part만 셌다.

## 적용 결과: 후보 1 (2026-11-05, 방식 2)

`encodeSpec`과 base64url 디코딩을 `packages/seasonal/src/print/spec-codec.ts`로 옮겼다. 이 파일은 최상위에서 아무것도 실행하지 않고, `PrintSpec`도 type으로만 가져온다.
- `spec.ts`는 `encodeSpec`을 다시 내보내고, `decodeSpec`은 `decodeSpecJson` + `parsePrintSpec`으로 바뀌었다. 기존 호출처는 그대로 쓴다.
- `shared/routes.ts`는 코덱만 값으로 import하고 spec의 타입은 `import type`으로 받는다.

after 스냅샷 `audit-after-routes-print`. 같은 범위, 같은 지표(초기 client JS, 압축)로 비교했다.

| 경로 | before → after | Δ | zod |
|---|---|---|---|
| `/privacy`, `/print` | 429.0K → 386.8K | −42.2K | 33.2K → 0 |
| `/` | 481.4K → 439.2K | −42.2K | 33.2K → 0 |
| `/seasonal` | 507.9K → 471.6K | −36.3K | 33.2K → 0 |
| `/prices/[variety]` | 495.4K → 453.2K | −42.2K | 33.2K → 0 |
| `/seasonal/(.)foods/[food]` | 491.1K → 448.9K | −42.2K | 33.2K → 0 |
| `/admin/edit` | 577.9K → 578.5K | +0.6K | 33.2K 유지 (편집기가 실제로 검증에 씀) |
| 34개 경로 합 | | −907.9K | |

예측치(42.8K / 36.7K)와 맞는다.

동작 확인:
- `spec-codec.test.ts`를 새로 썼고, 실패를 먼저 확인했다(red). 기존 `spec.test.ts`의 encode/decode 왕복 테스트도 그대로 통과한다.
- `pnpm typecheck` · `pnpm lint`(0 errors) · `pnpm test` 통과.
- 브라우저: `/admin/edit?id=monthly-1` 미리보기 iframe이 `routes.print`로 만든 `/print?spec=…`를 열고 `decodeSpec`으로 달력을 그린다. `/`와 `/seasonal`은 375·1280에서 console 오류가 없다.
- `price-layout` CSS preload 경고가 있지만 변경 전 코드(stash)에서도 똑같이 나와서 이번 변경과는 무관하다.

## 다음 단계 제안

1. 후보 1을 fix 모드로 적용한다. 효과가 크고 보이는 변화가 없으며 위험이 낮다. 방식(1번 또는 2번)을 정한 뒤 after 스냅샷 `audit-after-routes-print`로 같은 지표를 비교한다.
2. 후보 2는 `use-morph`·`flow-press`의 motion 의존을 먼저 읽고 방향 (a)/(b)를 정한다. 보이는 동작이 바뀌므로 적용 전에 확인을 받는다.
3. `/seasonal/[...catchAll]` 내보내기 실패를 Next.js 이슈로 올릴지 정한다.
