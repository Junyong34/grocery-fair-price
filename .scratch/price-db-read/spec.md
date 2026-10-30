# 가격 화면을 실제 DB로: 읽기 경로와 데이터 흐름 패턴

가격 화면(P1 메인 · P2 검색 · P3 품종 상세 · P4 담은 품종)은 지금 하드코딩 데이터(`fixture-source.ts`)를 그린다. 판정 배치(`ingest-foundation/11`)가 운영 DB에 판정 묶음을 채웠으므로(2026-10-30, 127행), 화면이 `price.current_judgment`를 읽게 바꾼다. 2026-10-30 운영자와 정리한 결정이다.

## 0. 먼저 읽을 것

- `AGENTS.md`의 "Web app UI", "Rendering and state"
- `.scratch/ingest-foundation/issues/06-web-read-path.md` (접속 방식 결정), `11-judgment-batch.md` (payload를 만드는 곳)
- `grocery-price/docs/adr/0004-judgment-payload-is-screen-shape.md`
- `grocery-price/docs/30-data/pipeline.md` 3-0 "접속", 4-1
- Next.js 16.4 문서: `apps/web/node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`, `02-guides/migrating-to-cache-components.md` ("generateMetadata and generateViewport"), `03-api-reference/04-functions/generate-static-params.md` ("With Cache Components")

## 1. 정한 것

| 무엇 | 결정 | 이유 |
|---|---|---|
| 접속 | 서버 컴포넌트에서만 `postgres.js`로 `web_reader` 롤에 직접 붙는다. Supavisor 트랜잭션 모드(6543), `prepare: false`. supabase-js, React Query, axios는 쓰지 않는다 | `price` 스키마는 Data API에 노출하지 않고, 웹앱에는 Supabase 키가 없다(06). 브라우저가 DB를 부를 일이 없다 |
| 판정 payload 모양 | 화면 타입 `VarietyDetail` 그대로 (ADR 0004) | 변환 층이 없다. 값이 이상하면 배치 하나만 본다 |
| 읽을 때 검사 | zod 스키마로 파싱. 스키마는 `packages/price`에 하나 | 웹 배포와 배치 실행 사이에 DB에 옛 모양이 남을 수 있다. TS 타입은 이것을 못 잡는다 |
| 하드코딩 데이터 | 지운다 (`fixture-source.ts`, `fixtures/`) | 로컬에서도 원격 DB의 실제 판정으로 본다 |
| 로컬 DB | 원격 DB (`.env`의 `WEB_DATABASE_URL`) | 판정은 배치가 원격에만 채운다. 로컬 Supabase는 `pnpm db:test`에만 쓴다 |
| DB 실패 | 던진다 → `app/error.tsx`. 없는 품종은 `notFound()` | 빈 목록은 "시세 없음"과 "DB 장애"를 구분하지 못한다 |

## 2. 캐시 (최소한만)

Cache Components에서는 DB 읽기가 `"use cache"` 안이거나 `<Suspense>` 안이어야 빌드가 된다. 태그 · 갱신 엔드포인트 · 로딩 상태 다듬기는 하지 않고, 느린 화면이 보이면 그때 따로 잡는다.

| 메서드 | 캐시 | 비고 |
|---|---|---|
| `listVarieties` | `"use cache"` + `cacheLife("hours")` | 시세 · 판정은 하루 1~2번 바뀐다 |
| `searchIndex` | `"use cache"` + `cacheLife("hours")`, 안의 별칭 · 카테고리 읽기만 `cacheLife("days")` | 카탈로그는 드물게 바뀌지만 품종은 목록(hours)에서 뽑는다. 중첩 캐시는 바깥 `cacheLife`가 이기므로 바깥을 days로 두면 품종이 며칠 묵는다(03에서 고침) |
| `getVariety` | 캐시 없음. React `cache()`로 한 요청 안에서만 한 번 읽는다 | 상세는 그때그때 조회. `generateMetadata`와 본문이 같은 요청에서 두 번 부른다 |
| `featuredIds` | 코드 상수 | |
| "오늘"(서울 날짜) | 지금처럼 요청 때 계산 | `getSeoulToday()` |

- `/prices/[variety]`의 `generateStaticParams`는 `featuredIds`만 돌려준다 (최소 1개 규칙). 빌드가 상세 때문에 DB를 부르지 않는다. 나머지 품종은 요청 때 그린다.
- 목록 캐시 때문에 빌드는 DB를 읽는다. Vercel Production · Preview 환경변수에 `WEB_DATABASE_URL`이 있어야 한다 (사람 작업). 판정이 0행이어도 빈 목록으로 빌드된다.

## 3. 파일 배치 (데이터 흐름 패턴)

```
app/(price)/**/page.tsx         params 검증 · getPriceSource() · View에 props. DB를 모른다
features/price/data/
  price-source.ts               PriceSource 인터페이스 + getPriceSource(). 화면이 부르는 유일한 입구
  db.ts                         postgres 클라이언트 하나 (server-only, prepare:false, 개발 중 HMR에도 하나)
  db-source.ts                  PriceSource 구현. 메서드마다 캐시 정책만 정하고 queries/에 db()를 넘긴다
  queries/<메서드>.ts           판정 읽기 module. sql을 받아 SQL 실행 · 모양 검사 · 어긋난 행 처리까지 하고 검사된 값을 돌려준다
  queries/*.db.test.ts          위 interface를 로컬 DB(샘플 판정 묶음, web_reader)로 확인한다. pnpm db:test
packages/price/src/schema.ts    가격 화면 모양의 유일한 정의(zod). types.ts는 여기서 z.infer로 만든 타입을 내보낸다
features/price/<화면>/          그리기만. 데이터를 직접 부르지 않는다
```

고칠 곳 찾기: 화면이 이상하면 View, 값의 모양이 어긋나거나 필드를 더할 때는 `schema.ts` 한 곳과 배치(`packages/price-ingest/src/judgment/build.ts`), 어떤 행을 읽는지가 이상하면 `queries/`, 캐시 정책은 `db-source.ts`.

경계 검사(`data-boundary.test.ts`): `data/` 밖에서는 `db`, `db-source`, `queries/`를 import하지 않는다.

## 4. 쿼리

- `listVarieties`: `current_judgment`의 `payload`에서 목록 행의 키(`VARIETY_SUMMARY_KEYS`, 요약 스키마의 키)만 골라 읽고 `VarietySummary` 스키마로 파싱한다. 상세 전용 필드를 더해도 목록에는 들어가지 않는다(2026-10-30 구조 검토 A). 어긋난 행은 빼고 서버 로그에 품종 id를 남긴다. 순서는 SQL에서 카테고리 · 품종 이름 순으로 고정한다(화면은 받은 순서대로 그린다).
- `getVariety(id)`: `payload->>'id' = $1`인 한 행의 `payload`를 `VarietyDetail` 스키마로 파싱한다. 없으면 `null`, 모양이 어긋나면 던진다.
- `searchIndex`: 품종(`id` · `name` · `item` · `category`)은 `listVarieties` 결과에서 뽑는다(판정이 없는 품종이 검색에 나와 상세가 404가 되는 일을 막는다). 별칭은 `price.alias`, 카테고리는 `price.category`에서 읽는다.
- `featuredIds`: `data/featured.ts` 상수(지금 `FEATURED_IDS`를 옮긴다). 목록에 없는 id는 화면의 `pickByIds`(`packages/price/src/list.ts`)가 이미 건너뛴다.

## 5. 티켓

| # | 티켓 | 막힘 |
|---|---|---|
| 01 | `packages/price` zod 스키마 | - |
| 02 | DB 읽기 구현과 하드코딩 데이터 제거 | 01 |
| 03 | 페이지 정리와 화면 확인 | 02 |
| 04 | 문서 정리 | - |

## 6. 범위 밖 (나중에)

- 캐시 태그와 배치 후 갱신 신호(06 "아직 열림")
- 화면별 로딩 상태(skeleton) 다듬기
- `freshness` · `notices`(수집 멈춤 안내)
