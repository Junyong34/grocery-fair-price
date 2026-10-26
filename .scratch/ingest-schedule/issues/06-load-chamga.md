# 06. 참가격 원본 적재 (상품·점포)

Status: open
Type: task (AFK)
Blocked by: 05

## Question

05의 적재 트랜잭션에 참가격 행을 태운다. 참가격은 품종 대신 상품(`product`, `product_source_key`)과 점포(`store`, `obs_place`)가 생긴다. 대응표가 없어도 상품 단위로 이력이 쌓여야 한다.

## 할 일

- [ ] 새 상품 판별 (pipeline.md 6-1 "새 상품 판별", 3-6): DB에 없는 `goodId`는 새 상품, `product_source_key` 기간
- [ ] 점포: `entpId` → `store`·`obs_place`. 점포 정보는 점포 마스터(`getStoreInfoSvc`)에서 온다. 마스터를 언제 받을지(실행마다 / 처음 보는 점포가 있을 때만) 정하고 `## Answer`에. 판매처(`store_seller`)는 운영자 매핑이라 비워 둔다
- [ ] 행사 플래그(`goodDcYn`, `plusoneYn`) → `promo_*`, `plusoneYn=Y`면 `one_plus_one_unverified` (3-12 #13)
- [ ] 참가격 `source_day`는 조사일 단위. 상태 전이는 10에서 쓰므로 여기서는 행을 만들고 `ok`/`pending`만
- [ ] `test:db`: 참가격 샘플 원본 적재, 다시 받기 갱신 0행, 처음 보는 점포·상품

## 완료 기준

- 참가격 샘플 원본이 로컬 DB에 적재되어 `observation`(`obs_kind = shelf_price`, `product_id` 있음)이 생기고 테스트가 통과한다.
