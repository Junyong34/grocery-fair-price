# 03. 경로 · proxy · SEO · 탭

Status: ready-for-agent
Type: task (AFK)
Blocked by: 01

## 할 일

- [ ] `shared/routes.ts`: `seasonal.sashimi`, `seasonal.sashimiMonth(month)`.
- [ ] `proxy.ts`: `pathname`으로 명절과 회를 나누고, `/seasonal/sashimi`를 서울 기준 이번 달로 보낸다. `matcher`에 더한다.
- [ ] `app/seasonal/(season)/sashimi/[month]/page.tsx`: `generateStaticParams` 1~12, `notFound()`, `createMetadata`. 화면은 04의 feature 컴포넌트(이 이슈에서는 빈 자리).
- [ ] `shared/seo/pages.ts`에 등록(`[month]` indexed, 접두 경로 redirect).
- [ ] `sub-tabs.tsx` `TABS`에 "제철 회"(명절 앞). `shared/shell/menus.ts` 제철달력 `also`에 접두 경로.
- [ ] `docs/project-structure.md`에 경로와 feature 폴더를 적는다.

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과
- `/seasonal/sashimi`가 이번 달로 이동한다.
