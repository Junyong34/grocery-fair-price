# 02. 데이터 경계: `PriceSource`와 하드코딩 구현

Status: resolved
Type: task (AFK)
Blocked by: 01

## 목적

화면이 아는 입구를 하나로 둔다. 지금은 하드코딩 데이터, 다음 단계에서 `supabase-source.ts`를 더하고 `getPriceSource()`만 바꾸면 끝나야 한다 (spec 3-2).

## 할 일

- [x] `apps/web/features/price/data/price-source.ts`: `PriceSource` 인터페이스(`listVarieties`, `getVariety`, `searchIndex`, `featuredIds`, 모두 `async`)와 `getPriceSource()`. 파일 맨 위 주석에 다음 단계에서 어떤 표/뷰가 어떤 메서드를 채우는지 적는다 (`current_judgment`, `judgment_snapshot.payload`, `variety` · `item` · `alias`)
- [x] `fixture-source.ts`: 하드코딩 구현
- [x] `fixtures/`: 와이어프레임 값. 배추 시세 4,500 · 평소가 4,150, 범위 3,900~5,200 (45곳), 대형마트 3,900 · 전통시장 4,940, 10/26 배추 장소 표본, 판정 전 품종(샤인머스켓 · 쥬키니 · 호주산 등심 · 찹쌀), 오래됨 · 표본 적음 상태를 볼 품종 하나씩, 판매가 있는 품종 1~2개
- [x] 데이터 경계 검사: `features/price` 안에서 `data/` 밖 파일이 `fixtures/`를 import하면 실패하는 vitest

## 완료 기준

- 위 검사와 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과.

## Answer

2026-10-27. `apps/web/features/price/data/`: `price-source.ts`(`import "server-only"`, 인터페이스와 `getPriceSource()`, 맨 위 주석에 Supabase 단계의 표 · 뷰 대응), `fixture-source.ts`, `fixtures/`(`varieties.ts`, `detail-baechu.ts`, `details.ts`), 검사 `data-boundary.test.ts` · `fixtures/fixtures.test.ts`.

- slug는 품종 카탈로그(`packages/price-ingest/src/catalog/varieties.ts`)를 따랐다. 카탈로그에 없는 단호박(`kabocha`), 호주산 등심(`au-beef-sirloin`)은 임시.
- 상태 품종: 판정 전 = 쥬키니 · 샤인머스켓 · 호주산 등심 · 찹쌀, 오래됨 = 갈치(10/9 조사), 표본 적음 = 쪽파(3곳). 판매가 = 배추 · 삼겹살.
- 배추 외 품종의 상세(장소, 6개월 추이, 예상)는 목록 행에서 품종 id 시드로 만든다. 업태별 중간값과 범위는 장소 표본에서 계산해 앞뒤가 맞는다.
- 와이어프레임 배추 값은 서로 어긋난다: 범위 3,900~5,200(스펙 값)인데 장소 표본에는 3,480(대형마트 C)과 7,530(동문시장)이 있다. 스펙 값을 그대로 두었다. Supabase 단계에서는 `daily_quote`의 min · max가 표본에서 나오므로 저절로 맞는다.
