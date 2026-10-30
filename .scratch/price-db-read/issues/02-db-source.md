# 02. DB 읽기 구현과 하드코딩 데이터 제거

Status: ready-for-agent
Type: task (AFK)
Blocked by: 01

## 목적

`getPriceSource()`가 하드코딩 데이터 대신 운영 DB의 `price.current_judgment`를 돌려주게 한다. 화면 코드는 고치지 않는다 (spec 2 · 3 · 4장).

## 할 일

- [ ] `apps/web/package.json`에 `postgres`(다른 패키지와 같은 버전 3.4.9)
- [ ] `features/price/data/db.ts`: `import "server-only"`, `WEB_DATABASE_URL`로 클라이언트 하나. `prepare: false`, 연결 수는 작게. 개발 중 HMR로 연결이 쌓이지 않게 `globalThis`에 하나만 둔다. 변수가 없으면 첫 쿼리에서 키 이름을 담은 오류를 던진다(값은 출력하지 않는다)
- [ ] `features/price/data/queries/`: `list-varieties.ts`, `get-variety.ts`, `search-index.ts`. SQL 하나와 행 타입 (spec 4장)
- [ ] `features/price/data/db-source.ts`: `PriceSource` 구현
  - `listVarieties`: `"use cache"` + `cacheLife("hours")`, 행마다 `varietySummarySchema`로 파싱하고 어긋난 행은 빼며 품종 id를 `console.error`
  - `searchIndex`: `"use cache"` + `cacheLife("days")`. 품종 부분은 목록에서 뽑는다
  - `getVariety`: 캐시 없음, React `cache()`로 감싼다. 어긋나면 던진다
  - `featuredIds`: `data/featured.ts` 상수
- [ ] `getPriceSource()`가 `dbSource`를 돌려준다. 파일 맨 위 주석을 지금 구조로 고친다
- [ ] `fixture-source.ts`, `fixtures/`(테스트 포함)를 지운다
- [ ] `data-boundary.test.ts`: fixture 검사를 "`data/` 밖에서는 `db`, `db-source`, `queries/`를 import하지 않는다"로 바꾼다
- [ ] `AGENTS.md`의 "Routes" 문단과 `docs/project-structure.md`의 `data/` 행에서 fixture 언급을 지금 파일로 고친다

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint`(0 errors) · `pnpm test` 통과.
- 로컬 `pnpm dev`에서 `/`가 운영 판정 목록을 그린다(화면 확인은 03).
