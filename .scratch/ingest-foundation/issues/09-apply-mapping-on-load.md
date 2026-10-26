# 09. 적재 때 품종 매핑 적용과 기존 관측값 다시 매핑

Status: resolved
Type: task
Blocked by: 08

## 목적

지금 적재(`load-file.ts`)는 품종 매핑을 쓰지 않아 관측값의 `variety_id`·`spec_id`·`price_per_base`·`unit_rule_id`가 늘 `null`이다. 08이 매핑을 넣으면 적재가 그것을 쓰게 하고, 이미 쌓인 관측값도 다시 매핑한다.

## 이미 있는 것

- 어댑터는 매핑 함수(`ctx.mapping(source, key, date)`, `src/adapt/mapping.ts`)와 기준 단위 환산(`src/adapt/units.ts`의 `pricePerBase`)을 이미 받는다. 적재(`load-file.ts`)가 빈 매핑을 넘기고 있을 뿐이다. 매핑을 DB(`source_code_map`·`product_variety_map`)에서 읽어 넘기는 것이 핵심이다.
- 카탈로그 키 판정은 `src/catalog/match.ts`(08).

## 할 일

- [x] 적재: 관측일에 유효한 `source_code_map`(KAMIS·축평원) 또는 `product_variety_map`(참가격)이 `mapped`면 품종·규격·단위 규칙을 넣고 기준 단위 가격을 계산한다 (pipeline 3-1 계산식). 원천 단위 파싱: KAMIS `20kg`·`10개`·`1포기`·`1손`, 축평원 `원/100g`·`원/Kg`·`원/30구`·`원/1L`, 참가격 용량·용량단위. 단위 계열이 규칙과 다르면 `null`
- [x] 새 원천 키를 `pending`으로 등록할 때 카탈로그 키와 맞으면 바로 `mapped`로 (철마다 바뀌는 배추·무 품종 코드, 철이 와야 오는 품목)
- [x] 다시 매핑 명령: 매핑이 바뀐 원천 키의 관측값(보존 기간 안)을 DB에서 다시 계산한다. 정정 기록(`observation_revision`)은 남기지 않는다 (값이 아니라 분류가 바뀐 것)
- [x] DB 테스트: 매핑된 키, 단위가 안 맞는 키, 매핑 기간 밖 관측일

## 진행 기록

- 2026-10-26: 구현.
  - `src/load/variety.ts`: 관측값 모양의 표에 관측일에 유효한 `mapped` 매핑(KAMIS·축평원 `source_code_map`, 참가격 `product_variety_map`)으로 품종·규격·단위 규칙·기준 단위 가격을 붙이는 SQL 하나. 적재는 임시 표에(`mapStagedObservations`), 다시 매핑은 `price.observation`에(`remapObservations`) 같은 SQL을 쓴다. 바뀐 행만 고치고, 정정 기록은 남기지 않는다.
  - 원천 수량·단위: KAMIS `qty_raw`·`unit_raw`, 축평원 `원/` 뒤(`unit_mismatch`면 비움), 참가격은 관측일의 상품 속성(`total_qty`·`total_unit`). 단위 표는 `adapt/units.ts`의 `UNIT_TABLE` 하나.
  - **포기·마리·장은 1개(ea)로 센다** (기준 단위 "1개"는 배추면 1포기, 생선이면 1마리). 손·단·망은 묶음이라 기준 단위 가격을 비운다. 이전에는 포기를 별도 개수로 봐서 배추가 1개 기준과 맞지 않았다.
  - 적재(`load-file.ts`)가 파일마다 `applyMappings(tx, { onLoad: true })`를 불러 처음 본 원천 키·상품을 카탈로그대로 바로 잇는다. 카탈로그에 없는 참가격 상품은 `ignored`가 아니라 `pending`으로 남겨 운영자가 보게 한다. 분류 표가 없으면 건너뛴다(적재는 멈추지 않는다).
  - 원천 키를 처음 본 날보다 오래된 행이 오면(지난 기간 채우기) 그 키의 첫 매핑 `valid_from`을 그날로 넓힌다 (`masters.ts`). 안 넓히면 백필 관측값에 품종이 붙지 않는다.
  - `catalog --mappings`는 매핑을 넣은 뒤 출처마다 lock을 잡고 관측값을 다시 매핑한다.
- 2026-10-26 운영 적용: `--mappings --dry-run` → `--mappings`. 참가격 관측값 298,878행 중 13,647행(4.6%, 신선식품)에 품종, 13,512행에 기준 단위 가격. 기준 단위 가격이 빈 135행은 양파 1망·대파 1단·시금치 1단·흰다리새우·갈치 100g(기준 1마리) 등 환산 기준이 없는 단위다. 2026-07-10 중앙값 예: 계란 30구 19,980원, 쌀 1kg 4,490원, 배추 1포기 5,300원, 삼겹살 100g 3,490원.
- 남은 것: 볶음참깨 5개(`pending`, 원산지), 묶음 단위 환산 기준(3-12 #10). 일별 시세(`daily_quote`) 계산은 10.
