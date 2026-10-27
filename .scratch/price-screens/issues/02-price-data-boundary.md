# 02. 데이터 경계: `PriceSource`와 하드코딩 구현

Status: ready-for-agent
Type: task (AFK)
Blocked by: 01

## 목적

화면이 아는 입구를 하나로 둔다. 지금은 하드코딩 데이터, 다음 단계에서 `supabase-source.ts`를 더하고 `getPriceSource()`만 바꾸면 끝나야 한다 (spec 3-2).

## 할 일

- [ ] `apps/web/features/price/data/price-source.ts`: `PriceSource` 인터페이스(`listVarieties`, `getVariety`, `searchIndex`, `featuredIds`, 모두 `async`)와 `getPriceSource()`. 파일 맨 위 주석에 다음 단계에서 어떤 표/뷰가 어떤 메서드를 채우는지 적는다 (`current_judgment`, `judgment_snapshot.payload`, `variety` · `item` · `alias`)
- [ ] `fixture-source.ts`: 하드코딩 구현
- [ ] `fixtures/`: 와이어프레임 값. 배추 시세 4,500 · 평소가 4,150, 범위 3,900~5,200 (45곳), 대형마트 3,900 · 전통시장 4,940, 10/26 배추 장소 표본, 판정 전 품종(샤인머스켓 · 쥬키니 · 호주산 등심 · 찹쌀), 오래됨 · 표본 적음 상태를 볼 품종 하나씩, 판매가 있는 품종 1~2개
- [ ] 데이터 경계 검사: `features/price` 안에서 `data/` 밖 파일이 `fixtures/`를 import하면 실패하는 vitest

## 완료 기준

- 위 검사와 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과.
