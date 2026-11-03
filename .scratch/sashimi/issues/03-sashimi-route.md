# 03. 경로 · proxy · SEO · 탭

Status: resolved
Type: task (AFK)
Blocked by: 01

## 할 일

- [x] `shared/routes.ts`: `seasonal.sashimi`, `seasonal.sashimiMonth(month)`.
- [x] `proxy.ts`: `pathname`으로 명절과 회를 나누고, `/seasonal/sashimi`를 서울 기준 이번 달로 보낸다. `matcher`에 더한다.
- [x] `app/seasonal/(season)/sashimi/[month]/page.tsx`: `generateStaticParams` 1~12, `notFound()`, `createMetadata`. 화면은 04의 feature 컴포넌트(이 이슈에서는 빈 자리).
- [x] `shared/seo/pages.ts`에 등록(`[month]` indexed, 접두 경로 redirect).
- [x] `sub-tabs.tsx` `TABS`에 "제철 회"(명절 앞). `shared/shell/menus.ts` 제철달력 `also`에 접두 경로.
- [x] `docs/project-structure.md`에 경로와 feature 폴더를 적는다.

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과
- `/seasonal/sashimi`가 이번 달로 이동한다.

## Answer

2026-11-03. `routes.seasonal.sashimi`·`sashimiMonth`, `proxy.ts`가 `pathname`으로 명절과 회를 나눈다(`matcher` 두 개). 페이지 `app/seasonal/(season)/sashimi/[month]/page.tsx`(정적 12개, 메타데이터 `sashimiSeo`, OG 이미지에 그 달 횟감 4개). `SEO_PAGES`에 `[month]` 12개를 더했다. 접두 경로는 페이지가 없어 명절처럼 등록하지 않는다(라우트 패턴이 아님). 탭 "제철 회"는 `SASHIMI_COPY.tab`을 읽는다. 하단 내비 제철달력 `also`에 접두 경로를 더했다. 화면은 제목만 있는 자리(`features/seasonal/sashimi/sashimi-view.tsx`)이고 04에서 채운다.

확인: 개발 서버에서 `/seasonal/sashimi` → 307 `/seasonal/sashimi/11`, `/seasonal/sashimi/11` 제목 "11월 제철 회 | 장볼날"·탭 "제철 회", `/seasonal/sashimi/13`은 `/seasonal/months/13`과 같은 not-found, `/seasonal/festivals` 리다이렉트 그대로.
