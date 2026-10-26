# 09. 적재 때 품종 매핑 적용과 기존 관측값 다시 매핑

Status: ready-for-agent
Type: task
Blocked by: 08

## 목적

지금 적재(`load-file.ts`)는 품종 매핑을 쓰지 않아 관측값의 `variety_id`·`spec_id`·`price_per_base`·`unit_rule_id`가 늘 `null`이다. 08이 매핑을 넣으면 적재가 그것을 쓰게 하고, 이미 쌓인 관측값도 다시 매핑한다.

## 이미 있는 것

- 어댑터는 매핑 함수(`ctx.mapping(source, key, date)`, `src/adapt/mapping.ts`)와 기준 단위 환산(`src/adapt/units.ts`의 `pricePerBase`)을 이미 받는다. 적재(`load-file.ts`)가 빈 매핑을 넘기고 있을 뿐이다. 매핑을 DB(`source_code_map`·`product_variety_map`)에서 읽어 넘기는 것이 핵심이다.
- 카탈로그 키 판정은 `src/catalog/match.ts`(08).

## 할 일

- [ ] 적재: 관측일에 유효한 `source_code_map`(KAMIS·축평원) 또는 `product_variety_map`(참가격)이 `mapped`면 품종·규격·단위 규칙을 넣고 기준 단위 가격을 계산한다 (pipeline 3-1 계산식). 원천 단위 파싱: KAMIS `20kg`·`10개`·`1포기`·`1손`, 축평원 `원/100g`·`원/Kg`·`원/30구`·`원/1L`, 참가격 용량·용량단위. 단위 계열이 규칙과 다르면 `null`
- [ ] 새 원천 키를 `pending`으로 등록할 때 카탈로그 키와 맞으면 바로 `mapped`로 (철마다 바뀌는 배추·무 품종 코드, 철이 와야 오는 품목)
- [ ] 다시 매핑 명령: 매핑이 바뀐 원천 키의 관측값(보존 기간 안)을 DB에서 다시 계산한다. 정정 기록(`observation_revision`)은 남기지 않는다 (값이 아니라 분류가 바뀐 것)
- [ ] DB 테스트: 매핑된 키, 단위가 안 맞는 키, 매핑 기간 밖 관측일
