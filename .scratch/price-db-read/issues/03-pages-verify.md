# 03. 페이지 정리와 화면 확인

Status: ready-for-agent
Type: task (AFK)
Blocked by: 02

## 목적

Cache Components 규칙 아래에서 DB를 읽는 가격 페이지가 빌드되고, 375 · 1280 폭에서 실데이터로 그려지는지 확인한다 (spec 2장).

## 할 일

- [ ] `app/(price)/prices/[variety]/page.tsx`: `generateStaticParams`가 `featuredIds()`만 돌려준다. 주석을 "나머지 품종은 요청 때 그린다"로 고친다
- [ ] `generateMetadata`가 캐시 없는 `getVariety`를 읽어도 빌드 오류가 없는지 확인한다. 오류가 나면 `migrating-to-cache-components.md` "generateMetadata and generateViewport"의 방법을 따른다
- [ ] `app/error.tsx`가 가격 화면의 DB 오류를 받는지 확인한다(커밋 안 된 파일이면 내용을 보고 같이 커밋할지 운영자에게 묻는다)
- [ ] `pnpm --filter web build`(로컬 `.env`)가 통과한다
- [ ] `next-dev-loop`로 `/`, `/search?q=배추`, `/prices/<판정 있는 품종>`, `/prices/<판정 전 품종>`, `/prices/없는-id`(404), `/basket`을 375 · 1280에서 본다. 콘솔 오류 · hydration 경고 없음

## 완료 기준

- 위 확인과 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과.
- 사람 작업으로 남김: Vercel Production · Preview 환경변수에 `WEB_DATABASE_URL`.
