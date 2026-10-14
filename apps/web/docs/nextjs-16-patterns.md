# Next.js 16 개발 패턴 (16.4 기준)

설치본(Next.js 16.4.0, React 19.3.0, Turbopack)에 함께 들어 있는 문서 `node_modules/next/dist/docs/`(이하 `docs/`)와 nextjs.org, react.dev, vercel 공식 skills 페이지를 2026-10-14에 읽고 정리했다. 경로는 `apps/web` 기준이다. 문서에서 직접 확인하지 못한 내용은 **미확인** 또는 **추론**으로 표시했다.

---

## 1. 결론

- **기본은 Server Component다.** 정적 데이터(월별 품종, 계절, 명절, 공휴일)는 서버에서 읽어 HTML로 내보낸다. `'use client'`는 상호작용이 있는 말단 컴포넌트(월 레일, 캐러셀, 설정 시트, 먹음 토글, 검색)에만 붙인다. (`docs/01-app/01-getting-started/05-server-and-client-components.md` "Reducing JS bundle size")
- **`cacheComponents: true`와 `partialPrefetching: true`를 지금 켠다.** 새 앱의 `create-next-app` 기본값이고, 다음 메이저 버전부터는 항상 켜진다. 초기 단계라 옮길 코드도 거의 없다. 켜면 "오늘" 같은 시간 의존 코드를 빌드가 강제로 드러내 준다. (`docs/01-app/01-getting-started/08-caching.md` "Enabling Cache Components") → 3절
- **"오늘"(Asia/Seoul)은 프리렌더 결과에 굳히지 않는다.** 요청 시점에 `connection()`과 `<Suspense>`로 서버에서 한 번 계산해 ISO 문자열을 props나 Promise로 넘긴다. 클라이언트는 그 값을 그대로 쓰고 `new Date()`를 다시 부르지 않는다. 그러면 하이드레이션 불일치가 생기지 않는다. → 5.2
- **라우트는 `generateStaticParams`로 정적 경로를 모두 만든다.** `/months/[m]`, `/seasons/[season]`, `/festivals/[slug]`, `/foods/[slug]`를 만든다(실제 경로는 `/seasonal/...` 아래, `apps/web/lib/routes.ts` 참고). **`dynamicParams`는 Cache Components와 함께 쓸 수 없어 빌드 에러가 난다.** 목록 밖 값은 페이지에서 `notFound()`로 막고, `params`는 `<Suspense>` 안에서 읽는다. 필터·검색·보기 전환은 클라이언트 상태로 둔다. `searchParams`는 요청 시점 API라 정적 셸 밖으로 밀려난다. → 5.1
- **"먹었어요"(`eaten`)는 `useSyncExternalStore` 하나로 묶는다.** localStorage를 외부 저장소로 보고 `getServerSnapshot`은 빈 집합을 반환한다. Provider는 루트 레이아웃의 `{children}`만 감싸게 둔다. → 5.3
- **흩어진 이미지 배치(`scat`)는 순수 함수로 서버에서 계산한다.** `Math.random()` 대신 명세의 LCG를 쓴다. 클라이언트 JS가 필요 없고, 불일치도 생길 수 없다. → 6절
- **페이지 전환은 React `<ViewTransition>`과 `<Link transitionTypes>`로 한다.** 설정 없이 동작한다. motion은 페이지 안의 미세 동작(+1 팝, 시트)에만 쓴다. (`docs/01-app/02-guides/view-transitions.md`)
- **프레임워크 지식은 번들 문서에서 얻는다.** 지금 설치할 스킬은 `next-dev-loop` 하나로 충분하다. → 7절

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

| 항목 | 꺼짐(현재) | 켜짐 |
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
- `cacheTag` / `updateTag` / `revalidateTag`는 요청 시 무효화에 쓴다. 이 앱은 데이터를 배포로 바꾸므로 당분간 쓸 일이 없다.
- `connection()`은 "여기서부터 요청 시점"을 표시한다. `<Suspense>` 안에서 쓴다. (`03-api-reference/04-functions/connection.md`)
- `export const instant = false`는 검증을 잠시 끄는 탈출구다. (`03-api-reference/03-file-conventions/02-route-segment-config/instant.md`)
- 오류 메시지에는 `[stream]`, `[cache]`, `[block]` 수정안이 붙어 나온다. `next build --debug-prerender`를 쓰면 소스맵이 붙은 스택을 볼 수 있다. (`02-guides/ai-agents.md` "Built-in guidance for errors")

### 이 앱은 켜야 하나 → **켠다** (단, 조건 확인 후)

```ts
// next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  cacheComponents: true,
  partialPrefetching: true, // 명시하지 않으면 경고가 뜬다
}
```

이유는 다음과 같다.
1. 데이터가 거의 정적이라 거의 모든 라우트가 별다른 작업 없이 정적 셸이 된다. 모듈 import와 순수 계산은 자동으로 프리렌더된다. (`08-caching.md` "Predictable values")
2. 시간 의존 코드가 이 앱에서 가장 위험하다. 꺼진 상태에서는 `new Date()`가 빌드 날짜로 **조용히** 굳는다. 켜면 빌드가 실패해 문제를 알려 준다.
3. `<Activity>` 덕분에 탭을 오갈 때 2a 스크롤 위치, 3a 캐러셀 위치, 1h 검색어가 그대로 남는다. 와이어프레임의 "탭 간 상태 유지"와 맞는다.
4. 다음 메이저부터 항상 켜진다. 나중에 옮기는 것보다 처음부터 켜는 편이 싸다.

켠 뒤 확인할 점은 다음과 같다.
- **Activity 부작용.** 숨겨진 라우트에서 설정 시트나 토스트가 열린 채 남을 수 있다. `useLayoutEffect` cleanup에서 닫는다. (`preserving-ui-state.md` "Expandable UI", "Dialog and initialization logic") 숨겨진 페이지의 DOM이 남아 있어서 `document.querySelector('[data-m]')` 같은 전역 셀렉터가 숨은 페이지의 요소를 집을 수 있다. 셀렉터는 ref 기준으로 쓴다. (같은 문서 "Testing", "Global styles")
- **overlay-kit이 모듈 최상단에서 `Math.random()`을 부른다**(설치본 `overlay-kit/dist/index.js`에서 확인). 모듈 스코프 호출이 sync IO 검증에 걸리는지는 **미확인**이다. 켠 직후 `next build`로 확인한다.

---

## 4. 서버/클라이언트 경계 설계

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

이 앱에 맞춘 구성은 다음과 같다.

```
app/layout.tsx (Server)
└─ <ThemeProvider>            // next-themes, 이미 있음
   └─ <EatenProvider>         // 'use client', useSyncExternalStore
      └─ <OverlayProvider>    // overlay-kit, 'use client' 이미 포함
         └─ {children}        // 페이지는 Server Component
```

- `lib/data/*.ts`(월별 품종, 계절, 명절)는 맨 위에 `import 'server-only'`를 둔다. 클라이언트에는 필요한 조각만 props로 내려보낸다. 1h 검색처럼 클라이언트에 전체 목록이 필요하면 서버에서 `{ name, months }[]`로 줄여서 넘긴다.
- cojeev UI(`components/ui/*`)는 이미 `'use client'`가 붙어 있다(button, spinner, presence 확인). 그래서 Server Component에서 바로 렌더할 수 있다. 다만 motion이 클라이언트 번들에 들어간다. 정적인 장식에는 쓰지 않는다.

---

## 5. 이 앱에 대한 적용

### 5.1 라우트와 화면별 경계

| 화면 | 라우트 제안 | Server | Client | 데이터 |
|---|---|---|---|---|
| 2a 이달 · 12개월 | `/` | 12개 월 섹션(숫자, 문구, 흩어진 이미지, 미니 달력 칸) | 월 레일/좌측 내비(스크롤 점프, IntersectionObserver), 스티키 인디케이터, ⚙ 설정, ✓ 배지, "오늘" 동그라미 | 품종 모듈, 2026 공휴일 |
| 2b 월별 | `/months/[m]` (1~12, `generateStaticParams`, 범위 밖은 `notFound()`). `/months`는 오늘 달로 보낸다(5.2) | 계절 띠, 카드 그리드 마크업, 명절 줄 | 타임라인 칩 가로 스크롤 위치, 2·4·6열 보기 전환, 먹었어요 토글(+1 팝) | 같음 |
| 3a 계절 | `/seasons`(4장 히어로), `/seasons/[season]`(spring·summer·autumn·winter) | 카드 내용, 월별 묶음 | 모바일 scroll-snap 캐러셀 점, 데스크톱 hover 확장(CSS로 가능), "지금 계절에서 시작" | 계절 모듈 |
| 1g 명절 | `/festivals/[slug]`(기본 추석: `/festivals` → `chuseok`) | 전통음식·제철 카드 | 칩 가로 스크롤(선택은 `<Link>`) | 명절 모듈(2026 날짜) |
| 1h 나의 식탁 | `/table` | 정적 목록 데이터 전달 | 검색(es-hangul 초성), 월/계절 필터, 체크, 진행률, 토스트 | 전체 품종을 줄인 배열 |
| 음식 상세 1i | `/foods/[slug]` (`generateStaticParams`로 전체 품종) | 12칸 막대, 같은 달 품종, 명절 링크 | 먹었어요 CTA | 품종 모듈 |
| 설정 시트 | 라우트 없음(overlay-kit) | – | 전부 | localStorage 설정 |

- 2b 칩, 3a 계절 상세, 1g 명절을 **경로 param**으로 두는 이유는 다음과 같다. `params`는 `generateStaticParams`로 빌드 시 확정되므로 정적 셸에 실제 내용이 들어간다. 공유와 뒤로 가기도 자연스럽다(명세 8절 3번에 대한 답). 반면 `searchParams`는 요청 시점 API라 `<Suspense>` 뒤로 밀린다. (`08-caching.md` "Working with runtime APIs")
- 16부터 `params`와 `searchParams`는 **반드시 `await`** 해야 한다. 타입은 `PageProps<'/months/[m]'>`를 쓴다(`next typegen` 또는 dev/build 때 생성). (`02-guides/upgrading/version-16.md` "Async Request APIs")
- 1h 필터처럼 URL에 남기고 싶지만 서버 렌더는 필요 없는 상태는 `window.history.replaceState`로 처리한다(shallow routing). (`single-page-applications.md` "Shallow routing on the client")
- 데이터 파일은 모듈 상수로 두면 끝이다. 공휴일은 `@hyunbinseo/holidays-kr`의 **`/all` 진입점에서 `y2026`을 동기 import**하는 방법이 가장 단순하다(설치본 `dist/all.d.ts`에서 확인). 기본 진입점의 `getHolidayPreset('2026')`는 내부가 `import()`인 Promise다. Server Component에서 `await`해도 module import 성격이라 프리렌더된다고 **추론**한다(`08-caching.md` "Predictable values"의 `await import()` 예). 어느 쪽이든 서버에서만 import하고, 달력에 필요한 `{ 'YYYY-MM-DD': string[] }`만 내려보낸다.

```tsx
// app/seasonal/(this-month)/months/[month]/page.tsx (실제 코드)
export function generateStaticParams() {
  return MONTHS.map((month) => ({ month: String(month) }))
}
// params는 URL 데이터다. <Suspense> 밖에서 await하면 instant navigation 검사가 경고한다
// (node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md).
export default function Page(props: PageProps<'/seasonal/months/[month]'>) {
  return (
    <Suspense fallback={<MonthSkeleton />}>
      <Month params={props.params} />
    </Suspense>
  )
}
async function Month({ params }: { params: PageProps<'/seasonal/months/[month]'>['params'] }) {
  const { month } = await params
  if (!MONTHS.some((m) => String(m) === month)) notFound()
  return <MonthView month={Number(month)} />
}
```

### 5.2 "오늘"(Asia/Seoul) 처리

"오늘"이 정하는 값은 2a 히어로의 `tm`, 처음 스크롤 위치, 달력의 오늘 동그라미, 2b의 "오늘" 칩, 3a의 "지금 계절" 시작 카드, 1h의 오늘 달 막대다.

| 방법 | 장점 | 단점 | 판단 |
|---|---|---|---|
| A. 요청 시 서버에서 계산: `<Suspense>` 안에서 `await connection()` → `new TZDate(Date.now(), 'Asia/Seoul')` | 서버와 클라이언트가 같은 값을 쓴다(prop으로 전달). 하이드레이션 불일치 없음. 기기 시간대와 무관하게 KST로 고정 | 그 구멍만 요청마다 서버를 탄다. fallback이 먼저 보인다 | **기본 선택** |
| B. 클라이언트에서 계산: `use(browser())` + `<Suspense>` 또는 `useEffect` | 서버 비용 없음 | fallback이나 깜빡임이 생긴다. 셸에는 "오늘"이 없다 | 정적 export가 필요해지면 고려 |
| C. `'use cache'` + `cacheLife('hours')`로 날짜 계산 | 셸에 포함된다 | 자정 전후로 최대 revalidate 시간만큼 틀린다 | 쓰지 않는다 |
| D. 프리렌더에서 그냥 `new Date()` | – | Cache Components에서는 빌드 오류. 꺼져 있으면 **빌드 날짜로 굳는다** | 금지 |

근거: `08-caching.md` "Random values and timestamps", `connection.md`, `02-guides/preventing-flash-before-hydration.md` "Dates and formatting"(서버와 클라이언트의 locale/TZ 차이로 하이드레이션 오류가 나는 예).

권장 구조는 루트에서 오늘 Promise를 한 번 만들고 Context로 나눠 주는 것이다. (`single-page-applications.md` "Using React's `use` within a Context Provider")

```tsx
// lib/today.ts (server-only)
import 'server-only'
import { connection } from 'next/server'
import { TZDate } from '@date-fns/tz'
export async function getTodayKST() {
  await connection()                                   // 이 지점부터 요청 시점
  const d = new TZDate(Date.now(), 'Asia/Seoul')
  return { iso: d.toISOString().slice(0, 10), month: d.getMonth() + 1 } // 직렬화 가능한 값만
}
```
```tsx
// 2a page (Server): 12개월 섹션은 정적 셸, 오늘 의존 부분만 Suspense
<TodayProvider today={getTodayKST()}>   {/* await하지 않고 Promise를 넘긴다 */}
  <Suspense fallback={<HeroSkeleton />}><Hero /></Suspense>
  <MonthSections />                      {/* 정적 */}
</TodayProvider>
```
`Hero`, 레일, 달력의 오늘 표시는 Client Component에서 `use(todayPromise)`로 읽는다. 각자 `<Suspense>` 안에 있어야 한다. 클라이언트에서 날짜를 다시 계산하지 않는다. 자정을 넘겨 탭을 열어 둔 경우는 무시해도 된다고 본다.

> 로컬 개발에서는 서버와 브라우저의 TZ가 같아 불일치를 놓치기 쉽다. 문서는 `TZ=UTC LANG=ja_JP.UTF-8 next dev`처럼 일부러 다르게 띄워 보라고 권한다. (`preventing-flash-before-hydration.md` "Good to know")

### 5.3 "먹었어요"(`eaten`) 상태 — localStorage

```tsx
'use client'
// components/eaten-provider.tsx
const KEY = 'eaten:2026'
const EMPTY: readonly string[] = []
let cache: readonly string[] | null = null
function read() { cache ??= JSON.parse(localStorage.getItem(KEY) ?? '[]'); return cache! }
function subscribe(cb: () => void) {
  const on = (e: StorageEvent) => { if (e.key === KEY) { cache = null; cb() } }
  window.addEventListener('storage', on)          // 다른 탭 동기화
  return () => window.removeEventListener('storage', on)
}
export function useEaten() {
  return useSyncExternalStore(subscribe, read, () => EMPTY)  // 서버와 하이드레이션은 빈 목록
}
```
- `getServerSnapshot`은 서버와 하이드레이션에서 **같은 값**을 반환해야 한다. 빈 목록으로 두면 하이드레이션 직후 실제 값으로 다시 렌더된다. 오류는 없고 ✓가 한 박자 늦게 나타난다. (https://react.dev/reference/react/useSyncExternalStore "Adding support for server rendering")
- `getSnapshot`은 같은 참조를 반환해야 무한 렌더가 나지 않는다. 그래서 위처럼 캐시해 둔다(같은 react.dev 문서 caveat).
- 진행률 숫자(`{cnt}/{total}`)처럼 0에서 실제 값으로 튀는 게 눈에 띄는 곳은 둘 중 하나로 처리한다. (a) `use(browser('eaten은 기기 저장'))` + `<Suspense>`로 브라우저 전용 처리(`single-page-applications.md`), (b) 인라인 스크립트로 첫 페인트 전에 DOM을 고치고 `suppressHydrationWarning`을 붙인다(`preventing-flash-before-hydration.md` "Syncing with React state").
- `Set`은 상태 안에서만 쓰고, 저장과 스냅샷은 배열로 한다.
- 나중에 계정 동기화를 붙이면 Server Function(`'use server'`)으로 옮긴다. 그때 `cookies()`를 쓰는 부분은 `<Suspense>` 안에 둔다. (`02-guides/server-actions.md`, `08-caching.md`)

### 5.4 ViewTransition

- 설정 없이 쓸 수 있다. `import { ViewTransition } from 'react'`. 라우트 이동은 Transition이므로 자동으로 발동한다. 그냥 `setState`로는 발동하지 않는다(`startTransition`, `<Suspense>`, `useDeferredValue`만 발동한다). (`02-guides/view-transitions.md`, https://react.dev/reference/react/ViewTransition)

| 곳 | 패턴 |
|---|---|
| 하단 탭 이동(이달 ↔ 계절 ↔ 나의 식탁) | 크로스페이드(기본값) |
| 2b 월 칩, 1g 명절 칩(같은 라우트 안에서 param만 바뀜) | `<ViewTransition key={m} name="month-content" share="auto" enter="auto" default="none">` 크로스페이드 |
| 3a 카드 → 계절 상세, 품종 이미지 → 1i | 같은 `name`을 공유하는 morph. 이름은 앱 전체에서 고유해야 한다(예: `food-${slug}`) |
| 이전/다음 계절, 이전/다음 달 | `<Link transitionTypes={['nav-forward']}>` / `['nav-back']`로 방향 있는 슬라이드 |

- 주의할 점: `<ViewTransition>`은 DOM 노드보다 **앞**에 있어야 한다. 브라우저 뒤로 가기(popstate)는 애니메이션하지 않는다. reduced motion은 CSS로 직접 처리해야 한다. 클릭이 씹히지 않게 `::view-transition { pointer-events: none }`을 둔다. (react.dev ViewTransition caveats, `view-transitions.md` "Keeping the page interactive", "Respecting reduced motion")
- 2a 월 점프는 명세대로 **즉시 이동 + 도착 섹션 `fadeIn`** 이다. ViewTransition 대상이 아니다. 16부터 Next가 `scroll-behavior`를 덮어쓰지 않으므로 전역에 `smooth`를 두지 않는다(2b 칩 영역에만 둔다). (`version-16.md` "Scroll Behavior Override")

### 5.5 motion, cojeev 때문에 생기는 클라이언트 경계

- motion 컴포넌트(`motion/react`), cojeev UI, overlay-kit, es-hangul 검색 입력은 모두 Client Component 안에서만 쓴다. 정적 카드 전체를 `motion.div`로 감싸면 그리드 전체가 클라이언트로 넘어간다. **애니메이션되는 말단만** 클라이언트로 만들고 카드 본문은 `children`으로 넘긴다.
- `pop`, `tick`, `fadeIn`, `rise` 키프레임(명세 2.7)은 CSS로 충분하다. motion은 시트 드래그와 레이아웃 애니메이션처럼 CSS로 어려운 곳에만 쓴다(번들 절약, 7절 bundle optimizer로 확인).
- 달력 PDF/PNG 생성(설정 시트)은 무겁고 누를 때만 필요하다. `next/dynamic` 또는 이벤트 핸들러 안에서 `import()`로 늦게 불러온다. (`02-guides/lazy-loading.md`)

---

## 6. 흔한 함정

| 함정 | 증상 | 해결 | 근거 |
|---|---|---|---|
| 렌더 중 `new Date()`, `toLocaleDateString()` | 하이드레이션 오류. Cache Components에서는 빌드 오류 | 5.2의 A안. 날짜 문자열은 서버에서 KST 기준으로 만들어 prop으로 넘긴다 | `preventing-flash-before-hydration.md`, `08-caching.md` |
| 흩어진 배치에 `Math.random()` | 새로고침마다 배치가 바뀌고 하이드레이션이 불일치 | 명세의 LCG(`seed=(m*7919+N*104729+W)%233280`)를 순수 함수로 서버에서 계산. 폭 W가 반응형(339/736)이면 기준 폭으로 계산해 %좌표로 바꾸거나, 두 배치를 모두 렌더하고 CSS 미디어쿼리로 고른다 | `08-caching.md` "Random values" |
| 렌더 중 localStorage 접근 | 서버에서 `ReferenceError`, 하이드레이션 불일치 | `useSyncExternalStore`, `use(browser())`, 인라인 스크립트 중 하나(5.3) | `single-page-applications.md` |
| `params`, `searchParams` 동기 접근 | 16에서 제거됨(타입·런타임 오류) | `await props.params`, `PageProps<'…'>` | `version-16.md` |
| `useSearchParams()`를 Suspense 없이 사용 | Cache Components에서 blocking 오류 | `<Suspense>`로 감싸거나 path param으로 바꾼다 | `migrating-to-cache-components.md` |
| 빈 `generateStaticParams` | Cache Components에서 빌드 오류 | 최소 1개를 반환한다 | `generate-static-params.md` |
| 레이아웃 최상단에서 `await params` | 그 아래 전체가 셸에서 빠진다 | Promise를 아래로 넘겨 `<Suspense>` 안에서 `await` | `08-caching.md` "Maximizing the static shell" |
| `'use client'`를 상위(페이지·레이아웃)에 붙임 | 정적 데이터와 모듈 전체가 번들에 들어간다 | 말단으로 내린다. 데이터 모듈에 `server-only` | `05-server-and-client-components.md` |
| 서버 데이터를 통째로 prop으로 | 직렬화 비용이 커지고 노출된다 | 필요한 필드만 추린다 | `server-and-client-boundary.md` Good to know |
| Activity로 숨겨진 페이지의 열린 시트·토스트 | 돌아오면 열린 채로 남아 있다 | `useLayoutEffect` cleanup에서 닫는다 | `preserving-ui-state.md` |
| ViewTransition `name` 중복 | "two `<ViewTransition name=…>`" 오류 | 슬러그를 포함한 고유 이름 | react.dev ViewTransition |
| 전역 `scroll-behavior: smooth` | 16부터 Next가 덮어쓰지 않아서 라우트 이동 때도 부드럽게 스크롤된다 | 필요한 곳에만 두거나 `<html data-scroll-behavior="smooth">` | `version-16.md` |
| `next/dynamic`의 `ssr:false`를 Server Component에서 사용 | 동작하지 않는다 | Client Component 안에서 호출한다 | `lazy-loading.md` "Skipping SSR" |
| 현재 `app/layout.tsx`의 `lang="en"` | 한국어 앱인데 lang이 틀리다(접근성, 폰트) | `lang="ko"`. `suppressHydrationWarning`은 next-themes 때문에 유지 | (코드 확인) |

---

## 7. 에이전트 스킬과 도구

번들 문서는 "프레임워크 지식은 번들 문서에서, 스킬은 여러 단계짜리 *워크플로*에 쓴다"고 정리한다. Vercel 평가에서 AGENTS.md와 번들 문서 방식은 통과율 100%, 스킬 기반은 최대 79%였다. (`02-guides/ai-agents.md` "Version-matched documentation", "Skills for multi-step workflows", https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals, https://nextjs.org/evals)

이미 갖춰진 것:
- `AGENTS.md`(루트와 `apps/web`)에 `next dev`가 관리하는 `nextjs-agent-rules` 블록이 있다. 번들 문서를 먼저 읽으라는 내용이다. 지우면 다시 생기므로 커밋해 두면 된다.
- 루트 `.mcp.json`에 `next-devtools-mcp`가 있다. dev 서버의 `/_next/mcp`(`get_errors`, `get_routes`, `get_compilation_issues`, `compile_route` 등)에 연결한다. (`02-guides/mcp.md`)

| 스킬 | 설치 | 하는 일 | 이 앱 |
|---|---|---|---|
| `next-dev-loop` | `npx skills add vercel/next.js --skill next-dev-loop` | 편집할 때마다 `/_next/mcp`와 `agent-browser`(React DevTools 포함)로 런타임을 검증한다. 요구 사항: Next 16.3+ Turbopack, `agent-browser` 0.31.1+ (`npm i -g agent-browser@latest`) | **지금 설치 권장** |
| `next-bundle-optimizer` | `npx skills add vercel/next.js --skill next-bundle-optimizer` | Turbopack 번들 분석으로 큰 클라이언트 번들 원인을 찾는다(감사만 하거나 수정까지) | 화면이 몇 개 생긴 뒤 motion·cojeev 비용 점검용 |
| `next-cache-components-adoption` | `npx skills add vercel/next.js --skill next-cache-components-adoption` | 플래그를 켜고 실패하는 라우트를 기능 단위로 고친다 | 지금은 처음부터 켜므로 불필요 |
| `next-cache-components-optimizer` | `npx skills add vercel/next.js --skill next-cache-components-optimizer` | `instant()` 테스트를 쓰고 정적 셸을 넓힌다 | 나중에. 2a 셸 최적화 때 |
| `next-partial-prefetching-adoption` | `npx skills add vercel/next.js --skill next-partial-prefetching-adoption` | 기존 `prefetch={true}` 링크를 Partial Prefetching으로 옮긴다 | 불필요(처음부터 켬) |
| `next-partial-prefetching-optimizer` | `npx skills add vercel/next.js --skill next-partial-prefetching-optimizer` | 특정 이동에서 미리 준비할 UI를 계약으로 정해 테스트한다 | 나중에. 필요할 때 |
| `vercel-react-view-transitions` | `npx skills add vercel-labs/agent-skills --skill vercel-react-view-transitions` | 5.4의 패턴, CSS 레시피, 문제 해결 | ViewTransition 작업을 시작할 때 |
| `vercel-react-best-practices` | `npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices` | React·Next 성능 규칙 70개(워터폴, 번들, 리렌더, 하이드레이션) | 선택. 리뷰용 |

출처: `02-guides/ai-agents.md`, https://github.com/vercel/next.js/tree/canary/skills (스킬 6개), https://raw.githubusercontent.com/vercel/next.js/canary/skills/next-dev-loop/SKILL.md, https://skills.sh/vercel-labs/agent-skills, `02-guides/view-transitions.md` "Add view transitions with an agent". 이 문서는 아무것도 설치하지 않았다.

---

## 8. 출처

번들 문서(`apps/web/node_modules/next/dist/docs/`, Next.js 16.4.0):
- `01-app/01-getting-started/05-server-and-client-components.md`, `08-caching.md`
- `01-app/02-guides/server-and-client-boundary.md`, `rendering-philosophy.md`, `caching-without-cache-components.md`, `migrating-to-cache-components.md`, `streaming.md`, `preventing-flash-before-hydration.md`, `single-page-applications.md`, `lazy-loading.md`, `preserving-ui-state.md`, `view-transitions.md`, `building.md`, `ai-agents.md`, `mcp.md`, `upgrading/version-16.md`
- `01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`, `01-directives/use-cache.md`, `04-functions/cacheLife.md`, `connection.md`, `generate-static-params.md`, `03-file-conventions/02-route-segment-config/instant.md`, `02-components/link.md`(`transitionTypes`)
- `01-app/04-glossary.md`

설치 패키지에서 직접 확인한 것:
- `next/dist/server/app-render/sync-io-messages.js`: Client Component 안의 불안정 값 오류 문구
- `react-dom@19.3.0`의 `browser` export
- `@hyunbinseo/holidays-kr@5.2027.2`의 `dist/index.d.ts`(Promise API), `dist/all.d.ts`(동기 `y2026`)
- `overlay-kit/dist/index.js`: `"use client"`, 모듈 스코프 `Math.random()`

웹:
- https://react.dev/reference/react/ViewTransition
- https://react.dev/reference/react/useSyncExternalStore
- https://react.dev/reference/rsc/use-server#serializable-parameters-and-return-values (직렬화 가능 타입. 이번에 따로 열어 보지는 않았다. **미확인**)
- https://react.dev/reference/react/Activity (Next 문서에서 참조. 직접 읽지 않았다)
- https://github.com/vercel/next.js/tree/canary/skills, https://raw.githubusercontent.com/vercel/next.js/canary/skills/next-dev-loop/SKILL.md
- https://skills.sh/vercel-labs/agent-skills, https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices
- https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals, https://nextjs.org/evals (ai-agents.md에서 인용. 직접 열어 보지는 않았다)

화면 명세: `prototypes/seasonal-food/wireframes/WIREFRAME-SPEC.md` 0–4, 6절.
