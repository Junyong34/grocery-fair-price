# 06. 참가격 원본 적재 (상품·점포)

Status: resolved
Type: task (AFK)
Blocked by: 05

## Question

05의 적재 트랜잭션에 참가격 행을 태운다. 참가격은 품종 대신 상품(`product`, `product_source_key`)과 점포(`store`, `obs_place`)가 생긴다. 대응표가 없어도 상품 단위로 이력이 쌓여야 한다.

## 할 일

- [x] 새 상품 판별 (pipeline.md 6-1 "새 상품 판별", 3-6): DB에 없는 `goodId`는 새 상품, `product_source_key` 기간
- [x] 점포: `entpId` → `store`·`obs_place`. 점포 정보는 점포 마스터(`getStoreInfoSvc`)에서 온다. 마스터를 언제 받을지(실행마다 / 처음 보는 점포가 있을 때만) 정하고 `## Answer`에. 판매처(`store_seller`)는 운영자 매핑이라 비워 둔다
- [x] 행사 플래그(`goodDcYn`, `plusoneYn`) → `promo_*`, `plusoneYn=Y`면 `one_plus_one_unverified` (3-12 #13)
- [x] 참가격 `source_day`는 조사일 단위. 상태 전이는 10에서 쓰므로 여기서는 행을 만들고 `ok`/`pending`만
- [x] `test:db`: 참가격 샘플 원본 적재, 다시 받기 갱신 0행, 처음 보는 점포·상품

## 완료 기준

- 참가격 샘플 원본이 로컬 DB에 적재되어 `observation`(`obs_kind = shelf_price`, `product_id` 있음)이 생기고 테스트가 통과한다.

## Answer

2026-10-26. 05의 `loadRawFile`에 참가격을 태웠다. 마스터 처리와 상품 연결은 `packages/price-ingest/src/load/chamga.ts`.

1. **마스터는 실행마다 받는다** (사용자 결정 Q1-a). 수집은 점포 마스터(`getStoreInfoSvc.do`)·상품 마스터(`getProductInfoSvc.do`)를 각 1회 받아 원본으로 올린 뒤 가격을 받는다. 원본 파일의 `endpoint`로 갈라, 마스터 파일은 관측값 없이 마스터만 채운다. `loadPendingFiles`가 받은 순서로 적재하므로 마스터가 가격보다 먼저 들어간다. 받는 쪽 순서는 10이 만든다.
2. **마스터에 없는 번호가 가격에 오면 가격을 잃지 않는다** (Q2-a). 점포는 위치(`obs_place`)만 먼저 만들고(관측값은 위치를 가리키므로 충분하다), 상품은 임시 이름 `참가격 상품 <goodId>`로 만든다. 다음 마스터 적재가 점포 상세(`store`)를 넣고, 속성 이력이 없는 상품에 이름·용량·분류를 채우며 상품 이름을 바꾼다. 상품이 두 개로 갈리지 않는다 (테스트로 고정).
3. **상품**: 처음 보는 `goodId`마다 상품, 출처 키 연결(`product_source_key`), 품종 연결(`product_variety_map`, `pending`, `origin = al_rule`)을 만든다. 기간은 모두 참가격 첫 조사일 **2026-06-12**부터다. 받은 날부터로 두면 12에서 채울 과거 조사일의 가격이 상품에 이어지지 않는다. 가격 행은 조사일에 유효한 연결로 상품 ID를 찾고, 없으면 그 행을 거부한다. 첫·마지막 가격 조사일(`first_price_on`·`last_price_on`)을 넓힌다. 상품 마스터는 **식품(AL `0301`·`0302`, 457개)만** 받는다.
4. **점포**: BU 업태 → `channel`, 편의점(CS)은 `national_only`, 좌표(x가 위도)·주소·AR 원천값을 남긴다. 지역(`region_code`)은 05와 같이 비운다. 처음 보는 업태 코드면 그 점포 행을 거부한다. 판매처 연결(`store_seller`)은 운영자 매핑이라 만들지 않는다.
5. **관측값**: `obs_kind = shelf_price`, `product_id` 있음, 용량(`qty_raw`·`unit_raw`)은 상품 속성에 있어 비운다. 행사: `goodDcYn`·`plusoneYn`이 없으면 모름(`null`), `plusoneYn = Y`면 `one_plus_one_unverified` (3-12 #13). `source_day`는 조사일 단위로 05의 병합이 `ok`로 둔다. 상태 규칙은 10.
6. **참가격 원천 키는 `source_code_map`을 만들지 않는다.** 상품을 거쳐 품종에 잇기 때문이다 (3-1). `masters.ts`의 원천 키 등록이 참가격이면 건너뛴다. 가격 행으로 먼저 생긴 원천 키는 이름(`label`)이 비어 있다가 상품 마스터가 채운다.

뺀 것 (사용자 결정, 지도 Out of scope): 마스터 변경 감지(이름·용량 바뀜, `goodId` 재사용 의심, 점포 재등록 연결, 사라진 상품 판정·`missing_streak`), `product_daily_summary`.

테스트 (`test:db` 4개 추가, 전체 19개 통과): 마스터 → 가격 순서(점포 630, 편의점 4곳 `national_only`, 식품 상품 457, `source_code_map` 0, 품종 연결 `pending` 457, 가격 419행이 한 상품·점포 상세 있는 위치를 가리킴, 다시 받기 0행·상품 수 그대로), 가격이 마스터보다 먼저(임시 이름 → 마스터 뒤 제 이름, 같은 상품 ID, 위치의 본 날짜 유지), 행사 세 경우, 거부 세 가지(연결 기간 밖 조사일, 가격 0, 형식). price-db DB 테스트 204개 그대로 통과.
