# 2a 이달 정적화 — `/seasonal`을 이번 달 버전으로 미리 그려 두기

2026-11-05 운영 속도 측정에서 시작했다. 2a(`/seasonal`)가 요청마다 12개월 전체를 서버에서 새로 그려 본문이 늦게 온다. 화면과 UX는 바꾸지 않고, 본문을 빌드 때 그려 두는 구조로 바꾼다. 용어는 `grocery-price/GLOSSARY.md`를 따른다.

## 0. 먼저 읽을 것

- "오늘" 처리 원칙과 방법 A~D: `apps/web/docs/nextjs-16-patterns.md` 5.2
- 2a 명세: `.scratch/seasonal-mvp/spec.md`, `prototypes/seasonal-food/wireframes/WIREFRAME-SPEC.md`(2a)
- 같은 패턴의 화면: 2b `app/seasonal/(this-month)/months/(detail)/[month]/page.tsx`(params로 정적, 오늘은 `MonthDaysCardToday` 구멍), 명절·제철 회 `proxy.ts`
- Next 16.4 문서(설치본 `apps/web/node_modules/next/dist/docs/`): `01-app/01-getting-started/08-caching.md` "Random values and timestamps", `03-api-reference/03-file-conventions/proxy.md`, `03-api-reference/04-functions/generate-static-params.md` "With Cache Components", `02-guides/incremental-static-regeneration-cache-components.md`

## 1. 문제 (측정)

운영(jangbol.kr), 이 컴퓨터(한국)에서 프록시를 거치지 않고 6번씩 잰 중간값이다.

| 경로 | 셸 도착 | 본문 완료 | HTML(압축 전) |
|---|---|---|---|
| `/` (완전 정적) | 20ms | 24ms | |
| `/seasonal/months/3` (본문 정적, 오늘만 구멍) | 30ms | 690ms | |
| `/seasonal` (2a) | 29ms | **1,475ms** | **1.58MB** (RSC 606KB, `<img>` 782개) |

- 2a는 `app/seasonal/(this-month)/page.tsx`가 `<Suspense>` 안에서 `getSeoulToday()`를 기다린 뒤 `ThisMonthView` 전체를 그린다. 그래서 정적 셸에는 빈 fallback(`min-h-svh`)만 있고, **LCP인 히어로 제목까지 함께 늦게 온다.**
- 서버 함수 지역이 `iad1`(미국 동부)이던 영향도 크다. 이것은 `apps/web/vercel.json`의 `hnd1`(커밋 8431543)으로 따로 고친다. 지역을 옮겨도 "1.5MB를 요청마다 그려 보낸다"는 문제는 남으므로 이 spec이 필요하다.
- 회사망 프록시(Zscaler)는 HTML을 끝까지 받은 뒤 넘겨 스트리밍이 사라진다. 그 환경에서는 본문이 완료될 때까지 흰 화면이다.

## 2. 무엇이 "오늘"에 달려 있나

`features/seasonal/this-month/this-month-view.tsx` 기준이다.

| 값 | 쓰는 곳 | 바뀌는 단위 |
|---|---|---|
| `thisMonth` | 히어로 문구 "지금은 N월", 히어로 그림, "N가지 제철", 점프 버튼, 데스크톱 패널 선택, `YearEnd` | **달** |
| `year` | 그림 배치 seed(`ScatterField`), 공휴일(`holidaysInMonth`), 달력 줄 수, `MoreFoods`, `YearEnd` | **연** |
| `today`(일) | 달력의 오늘 동그라미(`SettingsCalendar` → `MonthCalendar`), `MonthDaysCard`의 오늘 강조 | **일** |

본문 대부분은 **(연, 월)** 하나로 정해진다. 일 단위는 오늘 표시 두 곳뿐이다.

## 3. 결정

### 3.1 구조: `proxy.ts` rewrite + (연, 월) 정적 페이지 (방법 A를 proxy 단계에서)

- 새 내부 경로 `/seasonal/at/[yearMonth]`(예: `2026-11`)가 2a 전체를 그린다. `generateStaticParams`로 미리 만든다.
- `proxy.ts`가 `/seasonal` 요청을 받으면 서울 기준 (연, 월)을 계산해 이 경로로 **rewrite**한다. redirect가 아니라서 주소창은 `/seasonal` 그대로다.
- 날짜 계산은 렌더 전에 proxy가 요청마다 하므로 정확하다. 매달 1일 0시(서울)에 바로 바뀐다. "렌더하기 전에 처리한다"는 현재 `proxy.ts`의 원칙(명절·제철 회)과 같다.

**버린 대안:**

| 대안 | 버린 이유 |
|---|---|
| C. `"use cache"` + `cacheLife`로 페이지 안에서 날짜 계산 | `nextjs-16-patterns.md` 5.2에서 이미 "쓰지 않는다"로 정했다. 달이 바뀔 때 최대 revalidate 시간만큼 지난달이 보이고, 만료 뒤 첫 방문자는 낡은 판을 받는다(stale-while-revalidate) |
| 12개 화면으로 쪼개기 + 전환 효과 | 1~12월을 한 화면에서 스크롤하는 2a 명세가 바뀐다. 이 문제의 해법이 아니다 |
| 브라우저에서 오늘 계산 | 렌더 중 `new Date()` 금지(AGENTS.md), 하이드레이션 불일치 위험 |

### 3.2 오늘 표시: 작은 동적 구멍 두 개

- 달력: `SettingsCalendar`가 `today` prop 대신 `useToday()`(`shared/today-context.tsx`)를 `<Suspense>` 안에서 읽는다. fallback은 **오늘 동그라미만 없는 같은 달력**이다. 크기가 같아 레이아웃이 밀리지 않는다(CLS 0).
- 일별 카드: 2b가 쓰는 `MonthDaysCardToday`를 그대로 쓴다. fallback은 오늘 강조가 없는 `MonthDaysCard`다.
- 결과: 셸에 2a 전체(히어로, 그림, 달력, 목록)가 들어가고, 구멍은 날짜 하나만 늦게 채운다. 2b와 같은 구조다.
- 다른 달(지난달·다음달) 칸의 오늘 표시는 원래 없으므로, 구멍은 이번 달 섹션에만 둬도 된다. 다만 12달 모두 같은 컴포넌트를 쓰면 코드가 단순하니, 그쪽이 나으면 그렇게 한다. 구현 때 셸 크기를 보고 정한다.

### 3.3 경로와 노출

- `routes.seasonal.at(year, month)`를 `shared/routes.ts`에 추가한다. 화면 코드는 이 경로로 링크하지 않는다. 링크는 계속 `routes.seasonal.root`다.
- `proxy.ts` `matcher`에 `"/seasonal"`를 더한다(정적 문자열, `routes.ts`와 맞춤). `pathname`이 `/seasonal`이면 rewrite, 나머지 둘은 지금처럼 redirect한다.
- 내부 경로에 직접 들어와도 보여 준다. 메타데이터는 `/seasonal`과 같게 하고 canonical을 `/seasonal`로, **noindex**로 둔다. `shared/seo/pages.ts`에 noindex로 등록한다(`pnpm test`가 요구). `/seasonal` 등록은 그대로 indexed다.
- 형식에 맞지 않는 `yearMonth`(`2026-13`, `abc`)는 `notFound()`.

### 3.4 미리 만들 (연, 월)

- `generateStaticParams`는 공휴일 데이터(`@hyunbinseo/holidays-kr`)가 있는 연도 범위의 12개월을 돌려준다. 빌드 시점 날짜로 범위를 정하지 않는다(빌드 중 `new Date()`는 피한다).
- 목록에 없는 (연, 월)은 첫 요청 때 그려진다. Cache Components에서 이 경우가 "그때 그려서 캐시하는지, 매번 동적인지"는 `incremental-static-regeneration-cache-components.md`로 확인하고 구현 때 실측한다(5장 확인 1).

## 4. 바뀌지 않는 것

- 2a 화면 구성, 순서, 스크롤, 레일·점프, 데스크톱 패널, ⚙ 설정, 먹음 기록, `#month-N` 앵커(`routes.seasonal.rootAt`).
- `app/seasonal/layout.tsx`의 `TodayProvider`(오늘 Promise를 Context로 나눠 주는 구조).
- 2b·3a·명절·제철 회·1i 시트.
- 새 analytics 이벤트는 없다. `page_view`의 `page_path`는 브라우저 주소(`/seasonal`)라서 그대로다. 구현 후 GA 디버그로 내부 경로가 찍히지 않는지 확인한다(5장 확인 4).

## 5. 구현 전 확인 (모르는 것)

| # | 확인할 것 | 왜 | 방법 |
|---|---|---|---|
| 1 | 목록 밖 (연, 월)의 런타임 동작 | 연도가 범위를 넘으면 2a가 다시 동적이 될 수 있다 | 문서 + 개발 서버에서 범위 밖 값 요청 |
| 2 | rewrite된 페이지에서 `@sheet/(.)foods/[food]` 가로채기 | 2a에서 품종을 누르면 시트가 떠야 한다. 가로채기는 현재 라우트 트리를 보고 판단한다 | `next dev` + 브라우저: 2a에서 품종 클릭 → 시트, 새로고침 → 전체 페이지 |
| 3 | 클라이언트 이동·prefetch(`partialPrefetching: true`)에서 rewrite가 적용되는지 | 하단 내비 "제철달력"·탭 "이달"로 갈 때 RSC 요청도 proxy를 탄다 | 다른 탭에서 "이달"로 이동, 네트워크 탭에서 RSC 응답이 이번 달인지 확인 |
| 4 | analytics `page_path` | 내부 경로가 GA에 찍히면 지표가 갈라진다 | `GA_DEBUG`로 확인 |
| 5 | proxy가 붙이는 시간 | 지금 `/seasonal/festivals` redirect가 운영에서 약 130ms(첫 요청 820ms)다. rewrite도 비슷한 비용이 든다 | `hnd1` 반영 후 재측정. 목표는 2a HTML 첫 바이트 200ms 이하 |
| 6 | 셸 크기 | 셸이 1.5MB로 커진다. 엣지에서 압축본(약 117KB)을 보내는 것은 빠르지만, 파싱 비용은 그대로다 | 375 모바일 성능 추적(LCP, TBT) |

확인 2, 3이 안 되면 구조를 다시 정한다. 대안은 `/seasonal/at/[yearMonth]`를 별도 라우트 대신 `(this-month)` 안의 `page.tsx`가 `params` 없이 `proxy`가 넣은 요청 헤더를 읽는 방식이지만, 그러면 다시 동적이 되므로 마지막 수단이다.

### 5.1 프로토타입 결과 (2026-11-05)

버릴 코드로 확인했다(되돌림). 만든 것:
- `app/seasonal/(this-month)/at/[yearMonth]/page.tsx`: `generateStaticParams` 2026-01~12, 오늘은 그 달 1일로 고정
- `proxy.ts`의 `/seasonal` → `/seasonal/at/<서울 연-월>` rewrite

`next dev`와 `next build && next start`에서 375 크기로 확인했다.

| # | 결과 | 근거 |
|---|---|---|
| 정적화 | **된다.** 2a 본문 전체가 프리렌더에 들어간다 | 같은 빌드 비교: 지금 `/seasonal`은 프리렌더 HTML 16K에 동적 구멍 1개(본문 전체), 히어로 없음. 프로토 `/seasonal/at/2026-11`은 969K에 구멍 0개, postponed 13B, "지금은 11월" 포함, `<img>` 782개 |
| 2 | **통과.** 품종 클릭 → 1i 시트가 2a 위에 뜬다. 주소는 `/seasonal/foods/napa-cabbage` | dev·prod 둘 다. 뒤로 가기 하면 화면에서 시트가 닫힌다. 다만 dialog 노드가 DOM에 남는데, 이것이 지금 코드에서도 같은지는 비교하지 않았다 |
| 3 | **통과.** 클라이언트 이동과 prefetch 응답 모두 rewrite된다 | RSC 응답 헤더 `x-nextjs-rewritten-path: /seasonal/at/2026-11`. `/seasonal/months`에 들어가면 `/seasonal?_rsc` prefetch(54KB)가 오고, "이달" 탭을 누르면 추가 요청 없이 바로 이동한다. 주소는 `/seasonal` |
| 1 | **문제 있음.** 목록 밖 (연, 월)은 요청 때 그리는데, 두 번째 요청이 **500**이었다 | 서버 로그: `Route "/seasonal/at/[yearMonth]": … usePathname() in a Client Component outside of <Suspense>`(`shared/shell/site-nav.tsx`, digest `CLIENT_HOOK_DYNAMIC`). 런타임 프리렌더(ISR)에서 공유 셸의 `usePathname()`이 막힌다. 첫 요청은 200(571ms), 세 번째는 200이었다 |
| 형식 오류 | `abc`는 200 + 본문 없는 not-found로 끝난다 | `notFound()`가 `<Suspense>` 안에서 불려 상태 코드가 이미 200으로 나간 뒤다. 2b 등 같은 패턴의 화면과 같다 |
| 4·5·6 | 확인하지 않았다 | 운영 배포가 필요하다 |

로컬 `next start`에서 `/seasonal/at/2026-11`을 압축 요청하면 완료까지 약 300ms였다(`/seasonal/months/3`은 20ms). 정적 파일을 매번 즉석에서 압축하는 Node 서버 비용으로 보이며, CDN에서는 다를 것이다. 운영 값은 미리보기 배포에서 잰다.

**정한 것:**
- 3.1 구조를 그대로 간다. 확인 2·3이 통과했다.
- 3.4를 바꾼다. 목록 밖 (연, 월)을 런타임에 그리게 두지 않는다. 방법은 둘이다. (a) `generateStaticParams`가 공휴일 데이터가 있는 해(현재 `@hyunbinseo/holidays-kr` 5.2027.x, 2027년까지)를 모두 덮고, proxy는 범위 밖이면 마지막 해로 고정한다. (b) `site-nav`의 `usePathname()`을 `<Suspense>`로 감싸 런타임 프리렌더가 되게 한다. (a)가 범위가 작다. (b)는 다른 동적 params 화면(`/prices/[variety]` 목록 밖 품종)에도 같은 위험이 있는지 따로 확인할 가치가 있다(범위 밖, 7장에 추가).
- 오늘 표시 구멍(3.2)을 넣으면 구멍이 생긴다. 운영의 2b(구멍 80개)처럼 그 구멍을 채우는 함수 호출이 요청마다 붙는다. 셸에 히어로와 본문이 다 있으므로 LCP에는 영향이 없다. 구멍은 **이번 달 섹션에만** 둬서 postponed 크기를 줄인다(3.2의 선택지를 이쪽으로 정한다).

## 6. 완료 기준

- 운영에서 `/seasonal` HTML의 첫 바이트가 200ms 이하다. 셸에 히어로 제목 "지금은 N월"과 12개월 본문이 들어 있다(본문 완료가 셸 도착과 거의 같다). 오늘 표시 구멍은 별도로 채워져도 된다.
- 달력의 오늘 동그라미, 일별 카드의 오늘 강조가 지금과 같게 보이고, 채워질 때 레이아웃이 밀리지 않는다.
- 매달 1일 0시(서울) 직후 요청부터 새 달이 히어로가 된다. 테스트: proxy의 (연, 월) 계산 순수 함수를 vitest로 확인한다(경계: 서울 기준 월말 23:59, 1일 0:00, UTC로는 전날).
- 5장 확인 2·3·4를 브라우저로 통과한다.
- `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과. 375·1280에서 console 오류와 hydration 경고가 없다(`next-dev-loop`).
- `nextjs-16-patterns.md` 5.2와 `docs/project-structure.md`(경로 표, `proxy.ts` 설명)를 고친다.

## 7. 범위 밖 (따로 다룬다)

- HTML 크기 자체 줄이기(`<img>` 782개, 링크 809개, RSC 606KB). 정적이 되면 문제가 줄지만 남는다. 예: 이번 달에서 먼 달은 그림을 줄이거나 화면에 들어올 때 그리기.
- `/prices/[variety]` 속도(`hnd1` 반영 후 재측정).
- 회사망 프록시 환경.
- 공유 셸 `shared/shell/site-nav.tsx`의 `usePathname()`이 `<Suspense>` 밖이라 런타임 프리렌더(목록 밖 params)에서 500이 날 수 있다(5.1). 다른 동적 params 화면에서도 재현되는지 확인한다.

## 8. 작업 순서 (이슈로 나눌 때)

1. proxy의 서울 (연, 월) 계산을 순수 함수로 빼고 테스트(`packages/seasonal/src/calendar/today.ts` 근처)
2. 오늘 표시를 `useToday()` 구멍으로 바꾸기(`SettingsCalendar`, `MonthDaysCardToday`). 지금 2a에서도 그대로 동작해야 한다
3. `/seasonal/at/[yearMonth]` 라우트 + `routes.seasonal.at` + SEO 등록(noindex, canonical)
4. `proxy.ts` rewrite + `matcher`
5. 5장 확인 → 운영 재측정 → 문서 갱신
