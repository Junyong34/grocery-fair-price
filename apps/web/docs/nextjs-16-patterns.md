# Next.js 16 개발 패턴 (16.4 기준)

이 앱이 렌더링 · 캐시를 왜 이렇게 하는지의 근거다. 설치본에 들어 있는 문서 `apps/web/node_modules/next/dist/docs/`(이하 `docs/`)와 react.dev를 2026-10-14에 읽고 정리했고, 2026-10-31에 실제 코드에 맞춰 줄였다(화면을 만들기 전의 라우트 안 · 예시 코드 · 스킬 목록은 지움, git 기록에 있다). 규칙 자체(라우트, 레이어, 기기 저장 상태, Provider)는 루트 `AGENTS.md`가 원본이다. 문서에서 직접 확인하지 못한 내용은 **미확인** 또는 **추론**으로 표시했다.

## 1. 이 앱이 정한 것

- **기본은 Server Component.** `'use client'`는 상호작용이 있는 말단에만 붙이고, 정적 내용은 `children`으로 넘긴다.
- **`cacheComponents: true`, `partialPrefetching: true`** (`apps/web/next.config.ts`). 시간 의존 코드를 빌드가 드러내 주고, `<Activity>`로 탭을 오갈 때 상태가 남는다. → 3절
- **"오늘"(Asia/Seoul)은 요청 때 서버에서 한 번 계산한다** (`shared/today.ts`). → 5.2
- **라우트 param은 `generateStaticParams`(최소 1개)로 만들고 `<Suspense>` 안에서 읽는다.** `dynamicParams`는 Cache Components와 함께 쓰면 빌드 오류다.
- **흩어진 이미지 배치는 시드 고정 순수 함수**(`packages/seasonal/src/layout/scatter.ts`의 LCG)라 서버와 클라이언트가 같은 결과를 낸다. `Math.random()`을 쓰지 않는다.
- **기기 저장 상태는 `deviceStore`** (`shared/device-store.ts`). 서버 HTML과 첫 렌더는 기본값을 쓰고, 마운트 뒤 `Providers`가 한 번 불러온다.
- **가격 화면 캐시**: 목록 `cacheLife("hours")`, 검색 재료 `hours`(안의 별칭 · 카테고리만 `days`), 상세는 캐시 없이 React `cache()`로 요청 안에서만 한 번 (`features/price/data/db-source.ts`, 근거 `.scratch/price-db-read/spec.md` 2장). → 3절 "중첩 캐시"

---

## 2. 렌더링 모델 정리

흔히 "SSR/CSR"이라고 부르지만 App Router의 축은 두 개다. **(a) 컴포넌트 코드가 어디서 실행되는가**(Server Component / Client Component)와 **(b) HTML을 언제 만드는가**(빌드 시 프리렌더 / 요청 시 / 스트리밍)이다. Client Component도 서버에서 HTML로 렌더된 뒤 브라우저에서 하이드레이션된다. "Server-rendered"는 HTML을 만든 방식을, "Server Component"는 코드가 브라우저로 가는지 여부를 가리킨다. (`docs/01-app/02-guides/server-and-client-boundary.md` "Rendering environments")

| 흔한 용어 | App Router 16의 대응 | 근거 |
|---|---|---|
| SSG | 프리렌더(Prerendering), Static Shell | `docs/01-app/04-glossary.md` "Prerendering", "Static Shell" |
| SSR | 동적 렌더링(Request-time APIs 사용 시) | 같은 문서 "Dynamic rendering" |
| ISR | `use cache` + `cacheLife` / `revalidateTag` | `docs/01-app/01-getting-started/08-caching.md` |
| CSR | Client Component(그래도 HTML은 먼저 렌더된다). 완전 브라우저 전용은 `next/dynamic` `ssr:false` 또는 `use(browser())` | `docs/01-app/02-guides/single-page-applications.md` "Rendering components only in the browser" |
| PPR | Cache Components를 켜면 기본 동작이 된다 | `docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md` |

| 패턴 | 언제 | 어떻게(API) | 주의 |
|---|---|---|---|
| Server Component | 데이터 읽기, 정적 마크업, 무거운 계산 | 기본값. `async` 컴포넌트에서 바로 `await` | 이벤트 핸들러와 `useState`를 쓸 수 없다. props로 함수를 넘길 수 없다(Server Function만 예외) |
| Client Component | 상태, 이펙트, 이벤트, 브라우저 API | 진입 파일 맨 위에 `'use client'` | 그 파일이 import하는 모든 모듈이 클라이언트 번들에 들어간다 |
| 정적 프리렌더 | 요청과 무관한 UI | 모듈 import, 순수 계산, `use cache` | Cache Components에서 `new Date()`, `Math.random()`을 렌더 중에 부르면 빌드 오류가 난다 |
| 요청 시 렌더 | 요청마다 달라지는 값 | `cookies()`, `headers()`, `searchParams`, `await connection()` | `<Suspense>`로 감싸야 셸이 유지된다. 감싸지 않으면 blocking-route 경고가 뜬다 |
| 스트리밍 | 느리거나 요청 시점에만 정해지는 부분 | `<Suspense fallback>`, `loading.js` | fallback은 정적 셸에 포함된다 (`docs/01-app/02-guides/streaming.md`) |
| 서버 → 클라이언트 스트리밍 | 클라이언트가 서버 데이터를 기다려야 할 때 | 서버에서 Promise를 만들어 prop으로 넘기고 클라이언트에서 `use(promise)` | `server-and-client-boundary.md` "How data enters the tree" |
| 브라우저 전용 | localStorage를 첫 렌더에 꼭 써야 할 때 | `use(browser('이유'))` + `<Suspense>` (React 19.3 `react-dom`) | fallback이 HTML이 되므로 크롤러에는 fallback만 보인다 (`single-page-applications.md`) |


---

## 3. Cache Components

### 무엇이 바뀌나

| 항목 | 꺼짐 | 켜짐 (이 앱) |
|---|---|---|
| 기본 성격 | 라우트 단위로 정적/동적이 갈린다. `dynamic`, `revalidate`, `fetchCache` segment config 사용 | **데이터 접근은 기본적으로 동적**이다. 캐시할 곳을 `'use cache'`로 직접 고른다 (`cacheComponents.md`) |
| 정적/동적 경계 | 라우트 단위 | 컴포넌트 단위(PPR). 정적 셸 + `<Suspense>` 구멍 (`02-guides/rendering-philosophy.md`) |
| `new Date()` / `Math.random()` | 빌드 시 값이 조용히 굳는다 | 프리렌더 중 호출하면 **빌드 오류**가 난다. `instant = false`로도 해제되지 않는다 (`02-guides/migrating-to-cache-components.md` "Fix synchronous IO") |
| Client Component 안의 같은 호출 | 위와 같다 | "unstable value … in a Client Component" 오류가 난다. 해결: `<Suspense>`로 감싸거나 `useEffect`/이벤트로 옮긴다 (설치본 `next/dist/server/app-render/sync-io-messages.js`) |
| 라우트 이동 | 이전 페이지를 unmount한다 | React `<Activity>`로 숨겨 **상태와 DOM을 보존**한다(최근 3개 라우트) (`02-guides/preserving-ui-state.md`) |
| `generateStaticParams` | 빈 배열이면 동적 렌더 | **최소 1개를 반환해야 한다.** 빈 배열이면 빌드 오류 (`03-api-reference/04-functions/generate-static-params.md` "With Cache Components") |
| segment config | `dynamic`, `revalidate`, `fetchCache` 사용 | 위 세 가지를 내보내면 오류가 난다. 대신 `instant`, `ensureStatic`을 쓴다 (`migrating-to-cache-components.md`) |
| 런타임 | Edge 가능 | Node.js 런타임만 지원한다 (`cacheComponents.md`) |

핵심 API는 다음과 같다(모두 번들 문서에서 이름을 확인했다).

- `'use cache'`는 함수, 컴포넌트, 파일 단위로 붙인다. 인자와 클로저 값이 캐시 키가 된다. 항상 `cacheLife`와 함께 쓰라고 권장한다. (`03-api-reference/01-directives/use-cache.md`, `08-caching.md`)
- `cacheLife('hours' | 'days' | 'max' | …)`는 프리셋을 쓴다. `stale`가 30초 미만이거나 `expire`가 5분 미만이면 프리렌더에서 빠져 "dynamic hole"이 된다. (`03-api-reference/04-functions/cacheLife.md` "Prerendering behavior")
- `cacheTag` / `updateTag` / `revalidateTag`는 요청 시 무효화에 쓴다. 제철 데이터는 배포로 바뀌어 쓸 일이 없고, 가격 화면의 배치 후 갱신 신호는 아직 열려 있다 (`.scratch/price-db-read`).
- `connection()`은 "여기서부터 요청 시점"을 표시한다. `<Suspense>` 안에서 쓴다. (`03-api-reference/04-functions/connection.md`)
- `export const instant = false`는 검증을 잠시 끄는 탈출구다. (`03-api-reference/03-file-conventions/02-route-segment-config/instant.md`)
- 오류 메시지에는 `[stream]`, `[cache]`, `[block]` 수정안이 붙어 나온다. `next build --debug-prerender`를 쓰면 소스맵이 붙은 스택을 볼 수 있다. (`02-guides/ai-agents.md` "Built-in guidance for errors")

### 중첩 캐시

`'use cache'` 함수가 다른 `'use cache'` 함수를 부르면 **바깥의 `cacheLife`가 이긴다.** 그래서 `searchIndex`는 바깥을 목록과 같은 `hours`로 두고, 드물게 바뀌는 별칭 · 카테고리 읽기만 안쪽 `days`로 뺐다. 바깥을 `days`로 두면 품종 목록이 며칠씩 묵는다 (2026-10-30, `db-source.ts` 주석).

### 켠 뒤 확인할 점

- **Activity 부작용.** 숨겨진 라우트에서 시트나 토스트가 열린 채 남을 수 있다. `useLayoutEffect` cleanup에서 닫는다. 숨은 페이지의 DOM이 남아 있어 `document.querySelector` 같은 전역 셀렉터가 숨은 페이지의 요소를 집을 수 있으니 ref 기준으로 쓴다. (`02-guides/preserving-ui-state.md`)

---

## 4. 서버/클라이언트 경계

| 규칙 | 내용 | 근거 |
|---|---|---|
| `'use client'`는 말단에 | 진입 파일에만 붙인다. 그 파일이 import하는 모듈은 모두 클라이언트 그래프에 들어간다 | `server-and-client-boundary.md` "Crossing the boundary" |
| 데이터는 props로 | 직렬화할 수 있어야 한다. 함수 prop은 오류가 난다(`'use server'` Server Function만 참조로 넘어간다). 넘긴 값은 그대로 브라우저로 간다 | 같은 문서. `05-server-and-client-components.md` "Passing data" |
| `Set`, `Map`, `Date` | React 직렬화가 지원한다(react.dev "serializable parameters" 목록). 이 앱에서는 **ISO 문자열과 배열**로 넘기는 편이 단순하다 | https://react.dev/reference/rsc/use-server#serializable-parameters-and-return-values |
| 서버 자식 끼워 넣기 | Client Component에 `children`이나 다른 ReactNode prop으로 Server Component의 *출력*을 넘긴다 | `server-and-client-boundary.md` (Modal/Cart 예) |
| compound 컴포넌트 | `Menu.Item` 같은 정적 프로퍼티는 경계를 넘으면 `undefined`가 된다. named export로 바꾼다 | 같은 문서 "Compound components across the boundary" |
| 서드파티 | `'use client'`가 없는 라이브러리는 얇은 래퍼 파일에 지시어를 붙인다 | `05-server-and-client-components.md` "Third-party components" |
| Provider 위치 | Client Component로 만들고 `{children}`만 감싼다. 트리에서 가능한 한 깊이 둔다 | 같은 문서 "Context providers" |
| `server-only` / `client-only` | 잘못된 환경에서 import하면 빌드 오류가 난다. Next.js가 내부에서 처리하므로 설치는 선택이다 | 같은 문서 "Preventing environment poisoning" |

실제 Provider 구성은 `shared/providers.tsx`(`TooltipProvider` → `OverlayProvider`, 마운트 뒤 기기 저장 상태 불러오기)이고, "오늘"은 `app/seasonal/layout.tsx`의 `TodayProvider`가 나눠 준다.

---

## 5. 이 앱에 대한 적용

### 5.2 "오늘"(Asia/Seoul) 처리

"오늘"이 정하는 값은 2a 히어로의 `tm`, 처음 스크롤 위치, 달력의 오늘 동그라미, 2b의 "오늘" 칩, 3a의 "지금 계절" 시작 카드, 1h의 오늘 달 막대다.

| 방법 | 장점 | 단점 | 판단 |
|---|---|---|---|
| A. 요청 시 서버에서 계산: `<Suspense>` 안에서 `await connection()` → 서울 기준 날짜 | 서버와 클라이언트가 같은 값을 쓴다(prop으로 전달). 하이드레이션 불일치 없음. 기기 시간대와 무관하게 KST로 고정 | 그 구멍만 요청마다 서버를 탄다. fallback이 먼저 보인다 | **기본 선택** |
| B. 클라이언트에서 계산: `use(browser())` + `<Suspense>` 또는 `useEffect` | 서버 비용 없음 | fallback이나 깜빡임이 생긴다. 셸에는 "오늘"이 없다 | 정적 export가 필요해지면 고려 |
| C. `'use cache'` + `cacheLife('hours')`로 날짜 계산 | 셸에 포함된다 | 자정 전후로 최대 revalidate 시간만큼 틀린다 | 쓰지 않는다 |
| D. 프리렌더에서 그냥 `new Date()` | – | Cache Components에서는 빌드 오류. 꺼져 있으면 **빌드 날짜로 굳는다** | 금지 |

근거: `08-caching.md` "Random values and timestamps", `connection.md`, `02-guides/preventing-flash-before-hydration.md` "Dates and formatting"(서버와 클라이언트의 locale/TZ 차이로 하이드레이션 오류가 나는 예).

구조는 레이아웃에서 오늘 Promise를 한 번 만들어(await하지 않고) Context로 나눠 주는 것이다. (`single-page-applications.md` "Using React's `use` within a Context Provider")

실제 코드: `shared/today.ts`의 `getSeoulToday()`(`connection()` 뒤 `seoulToday()`, React `cache()`로 한 요청에 한 번) → `app/seasonal/layout.tsx`의 `TodayProvider`(`shared/today-context.tsx`) → 클라이언트는 `<Suspense>` 안에서 `useToday()`(`use(promise)`)로 읽는다. 클라이언트에서 날짜를 다시 계산하지 않는다. 자정을 넘겨 탭을 열어 둔 경우는 무시한다.

> 로컬 개발에서는 서버와 브라우저의 TZ가 같아 불일치를 놓치기 쉽다. 문서는 `TZ=UTC LANG=ja_JP.UTF-8 next dev`처럼 일부러 다르게 띄워 보라고 권한다. (`preventing-flash-before-hydration.md` "Good to know")

### 5.4 ViewTransition

- 설정 없이 쓸 수 있다. `import { ViewTransition } from 'react'`. 라우트 이동은 Transition이므로 자동으로 발동한다. 그냥 `setState`로는 발동하지 않는다(`startTransition`, `<Suspense>`, `useDeferredValue`만 발동한다). (`02-guides/view-transitions.md`, https://react.dev/reference/react/ViewTransition)

이 앱은 명세에 있는 세 곳에만 쓴다(AGENTS.md "Motion", CSS는 `app/globals.css`): 2b 달 바꾸기(`month-timeline/month-view.tsx`), 3a 카드 → 계절 상세의 제목 morph(`seasons/season-card.tsx`, 이름은 `season-title-${season}`처럼 앱 전체에서 고유), 계절 상세의 이전/다음 방향 슬라이드(`seasons/season-detail.tsx`, `season-next` · `season-prev`).

- 주의할 점: `<ViewTransition>`은 DOM 노드보다 **앞**에 있어야 한다. 브라우저 뒤로 가기(popstate)는 애니메이션하지 않는다. reduced motion은 CSS로 직접 처리해야 한다. 클릭이 씹히지 않게 `::view-transition { pointer-events: none }`을 둔다. (react.dev ViewTransition caveats, `view-transitions.md` "Keeping the page interactive", "Respecting reduced motion")
- 2a 월 점프는 명세대로 **즉시 이동 + 도착 섹션 `fadeIn`** 이다. ViewTransition 대상이 아니다. 16부터 Next가 `scroll-behavior`를 덮어쓰지 않으므로 전역에 `smooth`를 두지 않는다(2b 칩 영역에만 둔다). (`version-16.md` "Scroll Behavior Override")

### 5.5 motion, cojeev 때문에 생기는 클라이언트 경계

- motion 컴포넌트(`motion/react`), cojeev UI, overlay-kit, es-hangul 검색 입력은 모두 Client Component 안에서만 쓴다. 정적 카드 전체를 `motion.div`로 감싸면 그리드 전체가 클라이언트로 넘어간다. **애니메이션되는 말단만** 클라이언트로 만들고 카드 본문은 `children`으로 넘긴다.
- `pop`, `tick`, `fadeIn`, `rise` 키프레임(명세 2.7)은 CSS로 충분하다. motion은 시트 드래그와 레이아웃 애니메이션처럼 CSS로 어려운 곳에만 쓴다.
- 무겁고 누를 때만 필요한 것은 `next/dynamic` 또는 이벤트 핸들러 안의 `import()`로 늦게 불러온다. (`02-guides/lazy-loading.md`)

---

## 6. 흔한 함정

| 함정 | 증상 | 해결 | 근거 |
|---|---|---|---|
| 렌더 중 `new Date()`, `toLocaleDateString()` | 하이드레이션 오류. Cache Components에서는 빌드 오류 | 5.2. 날짜는 서버에서 서울 기준으로 만들어 넘긴다 | `preventing-flash-before-hydration.md`, `08-caching.md` |
| 렌더 중 `Math.random()` | 새로고침마다 바뀌고 하이드레이션 불일치 | 시드 고정 함수 (`layout/scatter.ts`) | `08-caching.md` "Random values" |
| 렌더 중 localStorage 접근 | 서버에서 `ReferenceError`, 하이드레이션 불일치 | `deviceStore`의 훅으로만 읽는다 | `single-page-applications.md` |
| `params`, `searchParams` 동기 접근 | 16에서 제거됨 | `await props.params`, `PageProps<'…'>` | `version-16.md` |
| `useSearchParams()`를 Suspense 없이 사용 | Cache Components에서 blocking 오류 | `<Suspense>`로 감싸거나 path param으로 | `migrating-to-cache-components.md` |
| 빈 `generateStaticParams` | 빌드 오류 | 최소 1개 | `generate-static-params.md` |
| 레이아웃 최상단에서 `await params` | 그 아래 전체가 셸에서 빠진다 | Promise를 아래로 넘겨 `<Suspense>` 안에서 `await` | `08-caching.md` "Maximizing the static shell" |
| `'use client'`를 페이지 · 레이아웃에 붙임 | 정적 데이터와 모듈 전체가 번들에 들어간다 | 말단으로 내린다 | `05-server-and-client-components.md` |
| 서버 데이터를 통째로 prop으로 | 직렬화 비용이 커지고 노출된다 | 필요한 필드만 추린다 | `server-and-client-boundary.md` |
| 중첩 `'use cache'`의 안쪽 `cacheLife`를 믿음 | 바깥 수명으로 묵는다 | 3절 "중첩 캐시" | `use-cache.md` |
| ViewTransition `name` 중복 | "two `<ViewTransition name=…>`" 오류 | 슬러그를 포함한 고유 이름 | react.dev ViewTransition |
| 전역 `scroll-behavior: smooth` | 라우트 이동 때도 부드럽게 스크롤된다 | 필요한 곳에만 | `version-16.md` |
| `next/dynamic`의 `ssr:false`를 Server Component에서 | 동작하지 않는다 | Client Component 안에서 | `lazy-loading.md` |

---

## 7. 출처

번들 문서(`apps/web/node_modules/next/dist/docs/`, Next.js 16.4.0):
- `01-app/01-getting-started/05-server-and-client-components.md`, `08-caching.md`
- `01-app/02-guides/server-and-client-boundary.md`, `rendering-philosophy.md`, `caching-without-cache-components.md`, `migrating-to-cache-components.md`, `streaming.md`, `preventing-flash-before-hydration.md`, `single-page-applications.md`, `lazy-loading.md`, `preserving-ui-state.md`, `view-transitions.md`, `building.md`, `ai-agents.md`, `upgrading/version-16.md`
- `01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`, `01-directives/use-cache.md`, `04-functions/cacheLife.md`, `connection.md`, `generate-static-params.md`, `03-file-conventions/02-route-segment-config/instant.md`, `02-components/link.md`(`transitionTypes`)
- `01-app/04-glossary.md`

설치 패키지에서 직접 확인한 것:
- `next/dist/server/app-render/sync-io-messages.js`: Client Component 안의 불안정 값 오류 문구
- `react-dom@19.3.0`의 `browser` export
- `overlay-kit/dist/index.js`: `"use client"`, 모듈 스코프 `Math.random()`

웹:
- https://react.dev/reference/react/ViewTransition
- https://react.dev/reference/rsc/use-server#serializable-parameters-and-return-values (직렬화 가능 타입. 이번에 따로 열어 보지는 않았다. **미확인**)
- https://react.dev/reference/react/Activity (Next 문서에서 참조. 직접 읽지 않았다)
