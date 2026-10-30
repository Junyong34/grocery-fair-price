# 03. 페이지 정리와 화면 확인

Status: resolved
Type: task (AFK)
Blocked by: 02

## 목적

Cache Components 규칙 아래에서 DB를 읽는 가격 페이지가 빌드되고, 375 · 1280 폭에서 실데이터로 그려지는지 확인한다 (spec 2장).

## 할 일

- [x] `app/(price)/prices/[variety]/page.tsx`: `generateStaticParams`가 `featuredIds()`만 돌려준다. 주석을 "나머지 품종은 요청 때 그린다"로 고친다
- [x] `generateMetadata`가 캐시 없는 `getVariety`를 읽어도 빌드 오류가 없는지 확인한다. 오류가 나면 `migrating-to-cache-components.md` "generateMetadata and generateViewport"의 방법을 따른다
- [x] `app/error.tsx`가 가격 화면의 DB 오류를 받는지 확인한다(커밋 안 된 파일이면 내용을 보고 같이 커밋할지 운영자에게 묻는다)
- [x] `pnpm --filter web build`(로컬 `.env`)가 통과한다
- [x] `next-dev-loop`로 `/`, `/search?q=배추`, `/prices/<판정 있는 품종>`, `/prices/<판정 전 품종>`, `/prices/없는-id`(404), `/basket`을 375 · 1280에서 본다. 콘솔 오류 · hydration 경고 없음

## 완료 기준

- 위 확인과 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과.
- 사람 작업으로 남김: Vercel Production · Preview 환경변수에 `WEB_DATABASE_URL`.

## Answer

2026-10-30 완료.

- `prices/[variety]/page.tsx`: `generateStaticParams`가 `featuredIds()`만 돌려준다. 빌드가 6개(egg · onion · apple …)만 미리 그리고 나머지는 요청 때 그린다.
- `generateMetadata`는 캐시 없는 `getVariety`를 그대로 읽는다. 본문이 `<Suspense>` 안에서 `params`를 읽어 페이지가 원래 동적이라 빌드 오류가 없었다(문서의 `use cache` · 동적 표시 방법은 필요 없음).
- 중첩 캐시: Next 문서(`cacheLife.md` "Nested caching behavior")대로 바깥에 `cacheLife`가 있으면 안쪽 수명과 상관없이 바깥 수명을 쓴다. `searchIndex`가 days였으면 안의 목록(hours)이 며칠씩 묵었다. `searchIndex`를 hours로 바꾸고 별칭 · 카테고리 읽기만 `searchExtras()`(`"use cache"` + days)로 뺐다. 빌드 표에서 `/search`가 1h · 1d. spec 2장 표도 고쳤다.
- `app/error.tsx`(다른 세션이 만든 미커밋 파일): 루트 `app/` 바로 아래라 `(price)` 화면에서 던진 DB 오류를 받는다(Next 16.4의 `retry` prop). 이 티켓 커밋에는 넣지 않았다. 커밋 여부는 운영자 판단.
- `pnpm --filter web build`(로컬 .env) 통과, 경고 없음.
- next-dev-loop(dev 서버 3000, agent-browser): `/`, `/search?q=배추`, `/prices/apple`(싸요 −23%, 29곳), `/prices/egg`(판정 전, 1곳), `/prices/nope-xyz`, `/basket`을 375 · 1280에서 열었다. 12번 모두 콘솔 오류 · 경고 · 페이지 오류 없음, 가로 넘침 없음(scrollWidth = 폭), `/_next/mcp` `get_errors` 비어 있음, 컴파일 문제 없음. 검색은 배추 · 양배추 · 알배기배추 · 얼갈이배추를 판정과 함께 보여 준다.
- `/prices/없는-id`는 "페이지를 찾을 수 없어요" 화면과 `noindex`가 나오지만 HTTP 상태는 200이다. `notFound()`가 셸을 보낸 뒤 `<Suspense>` 안에서 불려서다(Next의 스트리밍 동작, 제철 품종 상세와 같다). 검색 엔진에는 noindex로 막힌다.
- 루트 `pnpm typecheck` · `pnpm lint`(0 errors) · `pnpm test` 통과.

사람 작업으로 남음: Vercel Production · Preview 환경변수에 `WEB_DATABASE_URL`.
