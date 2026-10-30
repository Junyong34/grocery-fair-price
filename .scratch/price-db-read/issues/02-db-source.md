# 02. DB 읽기 구현과 하드코딩 데이터 제거

Status: resolved
Type: task (AFK)
Blocked by: 01

## 목적

`getPriceSource()`가 하드코딩 데이터 대신 운영 DB의 `price.current_judgment`를 돌려주게 한다. 화면 코드는 고치지 않는다 (spec 2 · 3 · 4장).

## 할 일

- [x] `apps/web/package.json`에 `postgres`(다른 패키지와 같은 버전 3.4.9)
- [x] `features/price/data/db.ts`: `import "server-only"`, `WEB_DATABASE_URL`로 클라이언트 하나. `prepare: false`, 연결 수는 작게. 개발 중 HMR로 연결이 쌓이지 않게 `globalThis`에 하나만 둔다. 변수가 없으면 첫 쿼리에서 키 이름을 담은 오류를 던진다(값은 출력하지 않는다)
- [x] `features/price/data/queries/`: `list-varieties.ts`, `get-variety.ts`, `search-index.ts`. SQL 하나와 행 타입 (spec 4장)
- [x] `features/price/data/db-source.ts`: `PriceSource` 구현
  - `listVarieties`: `"use cache"` + `cacheLife("hours")`, 행마다 `varietySummarySchema`로 파싱하고 어긋난 행은 빼며 품종 id를 `console.error`
  - `searchIndex`: `"use cache"` + `cacheLife("days")`. 품종 부분은 목록에서 뽑는다
  - `getVariety`: 캐시 없음, React `cache()`로 감싼다. 어긋나면 던진다
  - `featuredIds`: `data/featured.ts` 상수
- [x] `getPriceSource()`가 `dbSource`를 돌려준다. 파일 맨 위 주석을 지금 구조로 고친다
- [x] `fixture-source.ts`, `fixtures/`(테스트 포함)를 지운다
- [x] `data-boundary.test.ts`: fixture 검사를 "`data/` 밖에서는 `db`, `db-source`, `queries/`를 import하지 않는다"로 바꾼다
- [x] `AGENTS.md`의 "Routes" 문단과 `docs/project-structure.md`의 `data/` 행에서 fixture 언급을 지금 파일로 고친다

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint`(0 errors) · `pnpm test` 통과.
- 로컬 `pnpm dev`에서 `/`가 운영 판정 목록을 그린다(화면 확인은 03).

## Answer

2026-10-30 완료. `getPriceSource()`가 `dbSource`를 돌려준다.

- `features/price/data/db.ts`: `db()`가 처음 불릴 때 클라이언트를 만들어 `globalThis.priceWebSql`에 둔다(`prepare: false`, `max: 3`). `WEB_DATABASE_URL`이 없거나 형식이 잘못되면 키 이름만 담은 오류를 던진다(주소는 담지 않는다, price-ingest `load/db.ts`와 같은 이유).
- `queries/`: `list-varieties.ts`(무거운 키 7개를 뺀 jsonb, `category.sort` → 카테고리 이름 → 품종 이름 순), `get-variety.ts`(`payload ->> 'id'`), `search-index.ts`(별칭과 카테고리를 SQL 하나로, 별칭은 `varietyId`(slug) 또는 `item`(이름) 모양으로 만든다).
- `db-source.ts`: 목록 `"use cache"` + `cacheLife("hours")`, 어긋난 행은 빼고 `console.error`에 품종 id. 검색 `cacheLife("days")`, 품종은 목록에서 뽑고 `searchIndexSchema`로 파싱. 상세는 React `cache()`만, 어긋나면 던진다. `featuredIds`는 `featured.ts`.
- `fixture-source.ts` · `fixtures/` 삭제. `data-boundary.test.ts`는 `data/` 밖의 `…/data/(db|db-source|queries)` import를 막는다.

확인: 루트 typecheck · lint(0 errors) · test 통과. 로컬 dev에서 `/`가 운영 판정을 그린다(자주 사는 품종: 계란 판정 전 · 사과 싸요 −23% 등, 카테고리에 DB에만 있는 "건어물·양념"), `/search` · `/basket` · `/prices/mung-bean` 200, `/prices/nope-xyz`는 not-found 화면, 브라우저 콘솔 오류 없음. 375 · 1280 확인과 빌드는 03.

메모: 운영 DB의 `price.alias`는 지금 0행이라 검색 별칭(대패 → 삼겹살 등)이 없다. 하드코딩 데이터에 있던 별칭 7개는 운영자가 DB에 넣어야 다시 생긴다.
