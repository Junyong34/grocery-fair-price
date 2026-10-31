# 라우트별 렌더링 흐름

`apps/web`(Next.js 16.4.3, `cacheComponents: true`, `partialPrefetching: true`)에서 요청 하나가 브라우저에 화면을 다 그리기까지 무엇이 언제 일어나는지 라우트별로 정리한다. 대상은 `/`(P1 시세 메인), `/prices/[variety]`(P3 품종 상세), `/seasonal`(2a 이달), `/seasonal/foods/[food]`(1i 품종 상세, `@sheet` 가로채기 포함)다. 왜 이렇게 설계했는지는 [../nextjs-16-patterns.md](../nextjs-16-patterns.md)에 있다. 이 문서는 설명을 되풀이하지 않고, 실제 호출 경로와 빌드 · 응답에서 잰 근거만 적는다.

네 라우트의 모양은 서로 다르다. `/`은 통째로 정적(○)이고 한 시간마다 다시 만든다. 나머지 셋은 부분 프리렌더(◐)다. 정적 셸을 먼저 보내고 `<Suspense>` 구멍만 요청 때 채운다. 구멍을 만드는 원인은 두 가지뿐이다. 서울 기준 "오늘"(`getSeoulToday()` 안의 `connection()`)과, 캐시하지 않는 품종 상세 DB 조회(`getVariety`)다.

| 파일 | 라우트 |
|---|---|
| [01-price-home.md](01-price-home.md) | `/` |
| [02-price-variety.md](02-price-variety.md) | `/prices/[variety]` |
| [03-seasonal-this-month.md](03-seasonal-this-month.md) | `/seasonal` |
| [04-seasonal-food.md](04-seasonal-food.md) | `/seasonal/foods/[food]`와 `@sheet/(.)foods/[food]` |

## 핵심 개념

- **정적 셸, ○ · ◐**: `pnpm build`의 라우트 표 기호다. ○(Static)는 HTML 전체를 프리렌더한 것이고, ◐(Partial Prerender)는 정적 HTML 셸을 프리렌더하고 나머지를 요청 때 스트리밍한다는 뜻이다. 셸에는 `<Suspense>`의 fallback이 들어간다.
- **postponed · resume**: ◐ 라우트의 `.next/server/app/<경로>.meta`에는 `"postponed"` 상태가 저장된다. 요청이 오면 서버는 저장된 셸을 그대로 먼저 보낸다(응답 헤더 `x-nextjs-postponed: 1`). 그다음 미뤄 둔 부분만 다시 렌더(resume)해 이어 보낸다. 이런 응답은 `cache-control: private, no-store`다.
- **구멍 B:n과 채움 S:n**: 셸 HTML에서 Suspense 경계는 `<!--$?--><template id="B:n">` 뒤에 fallback이 오는 모양이다. 나중에 오는 청크는 `<div hidden id="S:n">…</div>`와 교체 스크립트(`$RC`/`$RB`)를 실어 B:n 자리를 채운다. 이 문서에서 "구멍 수"는 B:n의 개수다.
- **`'use cache'` + `cacheLife`**: 가격 목록만 쓴다(`features/price/data/db-source.ts`). 프리셋 값은 설치본 `cacheLife.md` 표에 있다. `hours`는 stale 5분 · revalidate 1시간 · expire 1일, `days`는 stale 5분 · revalidate 1일 · expire 1주다. 둘 다 프리렌더에 들어간다. stale이 30초 미만이거나 expire가 5분 미만이어야 구멍이 된다. 중첩되면 바깥 `cacheLife`가 이긴다.
- **`getSeoulToday()` / `TodayProvider`**: `shared/today.ts:15`는 React `cache()`로 감싼 `await connection()` → `seoulToday()`다. `connection()` 때문에 부른 자리가 요청 시점이 되어 구멍이 생긴다. 가격 상세는 이 함수를 바로 await한다. 제철 영역은 `app/seasonal/layout.tsx:8`이 await하지 않은 Promise를 `TodayProvider`에 넘기고, 클라이언트 말단이 `<Suspense>` 안에서 `useToday()`(`use(promise)`)로 읽는다.
- **`deviceStore` 복원**: 서버 HTML과 첫 클라이언트 렌더는 기본값으로 그린다. 하이드레이션 뒤 `shared/providers.tsx:14`의 `useEffect`가 `rehydrateDeviceStores()`를 불러 localStorage 값을 얹는다. 담은 품종 배지, 최근 본 품종, 먹음 기록, 흩은 그림 위치가 하이드레이션 직후 한 번 바뀌는 이유가 이것이다.
- **Activity**: Cache Components를 켜면 떠난 라우트를 unmount하지 않고 React `<Activity>`로 숨긴다(최근 3개). DOM이 `display:none`으로 남는다.

## 네 라우트 요약

| 라우트 | 빌드 기호 | 셸에 든 것 | 스트리밍되는 것 | 데이터 조회 | 오늘 사용 |
|---|---|---|---|---|---|
| `/` | ○, revalidate 1h · expire 1d | 문서 전체(목록 · 가격 · 판정 알약까지) | 없음 | `listVarieties` (`'use cache'`, `hours`) | 안 씀 |
| `/prices/[variety]` | ◐, 대표 품종 6개 + 일반 fallback 셸 | 헤더 · 하단 내비 · `min-h-svh` fallback | `<title>` 등 메타데이터, 품종 상세 본문 전체 + BreadcrumbList | `getVariety` (캐시 없음, `cache()`만) | `getSeoulToday()`를 직접 await(조사일 경과) |
| `/seasonal` | ◐ | `<title>` · 헤더 · 이달/월별 탭 · 검색 · 하단 내비 · fallback | 2a 본문 전체(약 918KB HTML) | 없음 | 히어로 달 · 달력 오늘 표시(`getSeoulToday()`) |
| `/seasonal/foods/[food]` | ◐, 207개 | `<title>`과 품종 상세 본문 전체(빌드 때 채움) | 먹음 기록 줄 하나 | 없음 | `useToday()`로 올해(먹음 기록) |

## 근거를 모은 방법 (2026-10-31, Next 16.4.3)

다시 확인하려면 아래 순서로 한다.

1. `apps/web`에서 `pnpm build`를 돌리고 라우트 표의 기호(○/◐)와 revalidate/expire 열을 본다. 빌드는 원격 DB를 읽는다(아래 주의할 점).
2. 프리렌더 결과물 `apps/web/.next/server/app/`에서 `index.html`, `prices/egg.html`, `prices/[variety].html`, `seasonal.html`, `seasonal/foods/eggplant.html`과 각 `.meta`를 연다. 볼 것은 HTML 크기, `<template id="B:`의 개수, `<div hidden id="S:`가 이미 들어 있는지, `<title>`이 있는지, `.meta`에 `"postponed"`가 있는지다.
3. `next start -p 3123`을 띄운다. 그리고 `fetch()` 응답 본문을 청크마다 읽어, 요청 시작부터의 시각 · 길이 · 그 청크에 든 `B:`/`S:` id를 찍는 node 스크립트로 각 경로를 요청한다. 응답 헤더 `x-nextjs-cache`, `x-nextjs-postponed`, `cache-control`도 함께 기록한다.
4. 브라우저(내장 브라우저, `next start` 대상)로 `/seasonal`에서 품종을 눌러 시트를 열고, `history.back()`, 직접 로드를 해 본다. 네트워크(`?_rsc=` 요청)와 DOM(`role=dialog`)을 확인한다.

시간은 로컬 머신과 원격 DB 기준이고 한 번씩만 쟀다. 절대값보다 순서를 보면 된다.

## 어디에 있나

| 무엇 | 위치(`apps/web` 기준) |
|---|---|
| 프록시(리다이렉트 한 곳) | `proxy.ts` (matcher `/seasonal/festivals`만) |
| 루트 레이아웃 · Provider | `app/layout.tsx`, `shared/providers.tsx` |
| 공통 셸(헤더 · main · 하단 내비) | `shared/shell/site-shell.tsx`, `shared/shell/site-nav.tsx` |
| 가격 영역 | `app/(price)/`, `features/price/` |
| 가격 데이터 입구 | `features/price/data/price-source.ts` → `db-source.ts` → `queries/*.ts`, 접속 `db.ts` |
| 제철 영역 | `app/seasonal/`, `features/seasonal/` |
| 오늘 | `shared/today.ts`, `shared/today-context.tsx` |
| 기기 저장 상태 | `shared/device-store.ts`, `shared/eaten-store.ts` |
| 메타데이터 | `shared/meta.ts` (`createMetadata`), `shared/seo/titles.ts`, `shared/seo/json-ld.tsx` |
| 404 | `app/not-found.tsx`(가격 셸), `app/seasonal/not-found.tsx`(제철 셸) |

## 라우트를 가로지르는 주의할 점

- **없는 id가 404가 아니라 200이다.** `/prices/no-such-x`와 `/seasonal/foods/no-such-x`는 HTTP 200으로 응답한다. 셸을 이미 보낸 뒤에 `<Suspense>` 안에서 `notFound()`가 불리기 때문이다. 대신 `<meta name="robots" content="noindex">`와 payload의 `NEXT_HTTP_ERROR_FALLBACK;404`가 붙는다. 검색엔진은 noindex로 거르지만, 상태 코드로 404를 판단하는 도구는 놓친다.
- **스트리밍한 내용은 다음 애니메이션 프레임에 들어간다.** React 19.3은 Suspense 경계 교체를 rAF에 모아 처리한다(`window.$RB`). 화면에 그리지 않는 탭(숨은 브라우저 창, 일부 헤드리스)에서는 `<div hidden id="S:0">`이 DOM에 남은 채 내용이 안 보인다. 자동 검증에서 "본문이 없다"고 나오면 먼저 한 프레임(스크린샷이나 `requestAnimationFrame`)을 돌려 본다.
- **닫은 시트의 DOM이 남는다.** 시트를 연 뒤 뒤로 가면 시트는 안 보이지만, `role=dialog`(`data-state="open"`)는 `display:none`인 조상 아래에 그대로 있다. Activity가 떠난 트리를 숨겨 두기 때문이다. `document.querySelector('[role=dialog]')` 같은 전역 셀렉터는 이 요소를 집는다(`nextjs-16-patterns.md` 3절).
- **`/seasonal` 응답은 약 1.2MB HTML이다.** 12개월 본문을 모두 요청 때 그린다. 흩은 그림 배치(`scatterLayout`, Lloyd 10회)도 요청마다 서버에서 다시 계산한다. 배치는 오늘과 무관한데도 오늘 구멍 안에 있어서 셸로 빠지지 않는다.
- **`getVariety`는 캐시하지 않는다.** `/prices/<id>` 요청마다 DB를 한 번 읽는다(같은 요청 안의 `generateMetadata`와 본문은 React `cache()`로 한 번이다).
- **`cacheTag`가 없다.** 수집 배치가 새 판정을 넣어도 `/`(와 `listVarieties`를 쓰는 화면)는 revalidate 1시간이 지나야 바뀐다. 1시간이 지난 뒤 첫 요청은 옛 판을 받고, 그 요청이 다시 만들기를 일으킨다(`s-maxage=3600, stale-while-revalidate=82800`). 품종 상세는 캐시가 없어 바로 바뀐다.
- **빌드가 원격 DB를 읽는다.** `/`, `/search`, `/basket`, `sitemap`의 `listVarieties`가 빌드 중에 실행된다. `WEB_DATABASE_URL`이 없거나 DB가 멈춰 있으면 빌드가 실패한다. 대표 품종 6개의 프리렌더 중에 `getVariety`까지 불리는지는 **미확인**이다(셸에 그 결과가 남지 않는다).
- **빌드 때 굳는 값.** 프리렌더 셸에 든 절대 URL은 빌드 때의 `siteUrl()`로 정해진다. `/seasonal/foods/eggplant` 셸의 JSON-LD는 `http://localhost:3000`이었다. 요청 때 그리는 `/prices/egg` JSON-LD는 `localhost:3123`이었다. 배포 빌드에 사이트 주소 환경변수가 맞게 들어가야 한다.
