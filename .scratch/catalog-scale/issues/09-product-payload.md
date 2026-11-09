# 09. 가공식품 상품 payload와 공개

Status: done
Type: task
Blocked by: 01, 05

## 목적

참가격 가공식품 상품을 화면에 올릴 데이터를 만든다. 판정은 내지 않고 최근 조사일 가격과 업태·판매처별 비교를 보여 준다.

## 입력

- `product_daily_summary`(조사일 × 상품 × 범위 `national`·`channel:<업태>`·`seller:<id>`): 최저·중앙·최고, 행사 뺀 중앙, 점포·판매처 수, 행사 수. 요약은 영구, 점포별 관측값은 최근 6 조사일 (ingest-foundation/07)
- 상품 이름·용량(`goodTotalCnt`·`goodTotalDivCode`)·제조사(p2/06 결정에 따름)·카테고리(05)

## 할 일

- [x] payload 모양 (`packages/price`에 zod 스키마): 최근 조사일, 전국 중간·최저·최고, 업태별·판매처별 행, 행사 중인 판매처, 최근 6 조사일 추이, 기준 단위 환산(100g·100ml당)
- [x] 판정 묶음과 같은 포인터(`judgment_current`)로 공개한다 (catalog-evolution/06의 "화면용 카탈로그 정보를 판정 묶음에 싣는다"). 상품 행을 같은 묶음에 넣을지 별도 묶음으로 둘지 정한다
- [x] 단종·조사 중단 상품(`product.status = 'not_surveyed'`)과 마지막 조사일이 오래된 상품의 표시 규칙
- [x] ADR 0004대로 payload가 화면 모양인지 확인

## 작업 계획 (2026-11-09)

운영 DB 현황(읽기만): 참가격 상품 457개(모두 surveyed), 품종에 이은 64·품목만 정할 388·pending 5. `product_daily_summary`는 2026-06-12~10-23, 2주마다 조사일 하나(최근 448개 상품), 조사일마다 전국 1행·업태 약 3행·판매처 약 6행. 판매처 11곳.

정한 것:
- **대상은 상품 457개 전부**다. 품종에 이은 상품도 상품 페이지를 갖고, payload에 그 품종 id를 싣는다(10에서 "이 상품의 시세" 링크).
- **카테고리·품목**: `product.item_id`가 있으면 그 품목·카테고리, 없으면 출처 분류 대응표(05, 참가격 AL 소분류)의 카테고리와 소분류 이름을 쓴다. 388개 품목 검토(06)를 기다리지 않는다.
- **저장**: 판정과 같은 묶음(`judgment_batch`)에 새 표 `price.product_snapshot (batch_id, product_id, payload)`와 뷰 `price.current_product`를 둔다. 같은 `judgment_current` 포인터로 함께 바뀌므로 판정과 상품이 한 번에 공개된다. 판정 행 표에 섞지 않는 이유: `judgment_snapshot`은 품종·규격 FK와 판정 열을 가진다.
- **판정은 내지 않는다**. 대신 최근 조사일의 전국 중간·최저·최고, 업태별 중간, 판매처별 가격(행사 표시), 최근 조사일 추이, 100g·100ml당 가격.

단계:
1. **payload 스키마** `productDetailSchema` (`packages/price/src/schema.ts`): id(참가격 goodId), name, item, category, size(`500g`), unitPrice 기준(100g·100ml·1개), surveyedOn, price(전국 중간), range(min·max·n), perUnit, channels[], sellers[](가격·행사), trend[](조사일·중간·최저), status(`active`·`stale`·`discontinued`), varietyId|null, basis. 스키마 테스트 먼저
2. **빌드 함수** `packages/price-ingest/src/judgment/product.ts`: 요약 행 → payload (순수 함수, vitest 먼저). 100g당 환산, 오래된 조사일 규칙(마지막 조사일이 묶음의 최근 조사일보다 28일 넘게 이르면 stale, `not_surveyed`면 discontinued)
3. **마이그레이션**: `product_snapshot` + 뷰 + `comment on` + RLS·권한(`web_reader` 읽기, `ingest_writer` 쓰기) + ERD 그룹·helpers 목록. `pnpm db:test`, `pnpm db:erd`
4. **배치에 넣기**: `writeJudgment`가 같은 트랜잭션에서 상품 payload를 쓰고, 실패하면 묶음 전체를 실패로 둔다. DB 테스트(`test:db`)
5. **운영 적용**(사용자 승인 뒤, push 전): 마이그레이션 → 판정 묶음 한 번 → 상품 행 수 확인
6. 문서: `pipeline.md` 3-4, `docs/project-structure.md`, 이 티켓 Answer

10으로 넘기는 것: 웹 읽기(`getPriceSource().getProduct`), 상품 URL, 검색 색인, 화면.

## 완료 기준

- 참가격 식품 상품 전부의 payload가 운영 판정 묶음에 있다.

## Answer (2026-11-09)

- 운영 적용: 마이그레이션 `20261112000100_price_product_snapshot.sql`, 판정 묶음 45(trigger `catalog-09`)에 상품 454개 (active 450, stale 4). 457개 중 3개는 전국 요약이 한 번도 없어 payload가 없다. 판정 행 130은 그대로
- 카테고리 분포: 양념·소스·가루 89, 음료·주류 65, 간편식·냉동 53, 과자·간식 47, 유제품 34, 라면·면 31, 햄·어묵·두부 28, … 모두 품목이 정해져 "기타"가 없다(06 가공식품 제안 388개를 같은 날 적용)
- 상품 행은 같은 묶음이라 판정과 함께 공개된다. 상품 행이 지금 묶음보다 20% 넘게 줄면 묶음을 failed로 둔다
- 행사: 참가격 응답 대부분이 행사 여부를 주지 않아(`promo_unknown_n` = 점포 수) payload는 판매처별 `promo` 참·거짓만 싣는다
- stale 판정: 상품의 마지막 조사일이 묶음의 최근 조사일보다 28일 넘게 이르면 stale. 추이는 상품마다 자기 마지막 조사일부터 182일 (묶음 기준으로 자르면 stale 상품이 사라지는 버그를 DB 테스트가 잡았다)
- 10이 할 일: `getPriceSource()`에 상품 읽기, 상품 URL(`id` = 참가격 goodId), 검색 색인, 화면

