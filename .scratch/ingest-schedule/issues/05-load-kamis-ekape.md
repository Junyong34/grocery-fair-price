# 05. 원본 적재 트랜잭션 (KAMIS·축평원)

Status: resolved
Type: task (AFK)
Blocked by: -

## Question

`pending_load` 원본 파일 하나를 한 트랜잭션으로 관측값에 넣는 적재를 만든다. 순서는 pipeline.md 3-0·3-3: `begin` → `pg_advisory_xact_lock(hashtext('ingest:' || source))` → 임시 표(`on commit drop`)에 `COPY` → 정정 비교·`observation_revision` → 바뀐 행만 고쳐 쓰는 병합 → `source_day` 갱신 → `raw_object.load_status` → `commit`.

## 할 일

- [x] 자연키 → DB 번호 바꾸기를 이 트랜잭션 안에: 처음 보는 출처 코드는 `source_item`에 넣고 매핑을 `pending`으로 (3-1). **대응표가 없어도 적재된다**: `variety_id`·`spec_id`·`price_per_base`는 `null`
- [x] 관측 위치: KAMIS 시장(`market`, `obs_place`)과 지역 코드, 축평원 전국·시도. 어댑터 초안에는 시장 이름·지역 코드가 없다(03 진행 기록 "남은 것"). 원본 행에서 읽을지 마스터에서 읽을지 여기서 정하고 `## Answer`에 적는다
- [x] 병합: `on conflict … do update … where (비교 열) is distinct from (excluded…)`. 값이 같은 다시 받기에서 갱신 행 수 0을 테스트로 고정. 정정은 `source_day.status`를 바꾸지 않고 `corrected_at`·`correction_count`만
- [x] `first_seen_at`은 처음 넣을 때만 채운다 (5-1)
- [ ] ~~같은 대상 다시 받기가~~ → 07로 옮겼다 (Answer 4). 같은 대상 다시 받기가 직전 파일과 내용 해시가 같으면 `duplicate`로 기록하고 적재하지 않는다 (3-7)
- [x] `test:db` 통합 테스트: (1) 같은 출처 적재 두 개를 동시에 돌리면 하나가 lock을 기다렸다 잇고 결과가 하나만 돌린 것과 같다, (2) DB 없이 원본만 올린 뒤 다음 실행의 대조 → 적재까지 end-to-end로 들어간다, (3) 같은 파일 두 번 적재해도 행이 그대로

## 완료 기준

- KAMIS·축평원 샘플 원본이 로컬 DB에 `ingest_writer` 롤로 적재되고 위 테스트 셋이 통과한다.

## Answer

2026-10-26. `packages/price-ingest/src/load/`에 적재를 만들었다. `loadRawFile(sql, rawObjectId, file)`이 원본 파일 하나를 한 트랜잭션으로 넣고, `loadPendingFiles`가 `pending_load`를 받은 순서대로 모두 넣는다 (파일 하나가 실패해도 다음으로 넘어가고, 실패한 파일은 `pending_load`로 남는다).

1. **관측 위치·시장의 재료는 원본 행에서 읽는다.** KAMIS 행에 `mrkt_cd`·`mrkt_nm`·`sgg_cd`가 다 있다. 시장 행은 `obs_place(kind = market)` + `market`(이름, `sgg_code_raw`, 유형은 kamis.md 5-1 이름 규칙, `in_official_table`은 코드표 216개와 대조 `kamis-market-codes.ts`). 축산은 `region_avg`(`sgg_cd` `1000`이면 `national`, 그 밖은 `sido`). 축평원은 `region_avg`/`national` 한 곳. 시장은 처음 볼 때만 넣고 다시 쓰지 않는다 (운영자가 고친 유형을 덮지 않게). 행의 `sgg_cd`가 처음 본 시장의 값과 다르면 그 행을 거부한다 (3-3).
2. **지역(`region_code`)은 비워 둔다.** 운영 DB에는 `region` 표도 원천 지역 코드 대응도 없다 (`seed.sql`은 로컬 전용). 원천 코드가 `obs_place.source_place_code`·`market.sgg_code_raw`에 남으므로 대응이 생기면 그때 채운다. 품종 대응표 없이 켜는 결정(지도 Notes)과 같은 이유다.
3. **품종 매핑은 적용하지 않는다.** `variety_id`·`spec_id`·`price_per_base`·`unit_rule_id`는 `null`. 처음 보는 원천 키는 `source_code_map`에 `pending`(`valid_from` = 처음 본 날)으로 등록한다. 매핑이 생긴 뒤에 이 적재로 다시 받으면 `variety_id`를 `null`로 덮으므로, **품종 목록 뒤에는 매핑을 적용하는 단계를 이 적재에 넣어야 한다** (지도 Out of scope의 "품종 목록 뒤 다시 적재"와 함께).
4. **"내용 해시가 직전 파일과 같으면 duplicate" 판정은 07로 옮겼다.** 적재 단계에서는 이미 Storage에 올라간 파일이라 아낄 것이 없고(같은 내용이면 병합이 0행을 고친다), "같은 대상"을 해시만으로 가리면 틀린다: A(100원) → B(120원) → C(100원, 되돌린 정정)에서 C를 A의 중복으로 보면 정정을 잃는다. 07은 올리기 전에 같은 묶음 라벨·같은 대상 기간의 **바로 전 파일**과 비교해 올리지 않는다.
5. **`source_day`**: 행이 온 날은 `pending`·`failed`·`empty_unexpected`에서 `ok`로 바꾼다 (`partial`·`empty_expected`는 그대로, 상태 규칙은 08). `row_count`는 그날 이 출처의 관측값 행 수로, 새로 생긴 행만큼 늘린다 (KAMIS는 품목마다 파일이 따로라서 파일 하나의 행 수로 덮으면 안 된다). `last_changed_at`, `max_source_registered_at`도 채운다.
6. **거부**: 행 스키마와 다른 행(5-2 "응답 형식이 바뀜"), 어댑터의 행 단위 거부(가격 0 등), 시장 시군구 불일치. 원본에만 남고 `raw_object.rejected_rows`로 세며, 일부면 `partially_rejected`, 전부면 `rejected`.
7. **병합 코드는 한 곳에 둔다.** `price-db`의 샘플 적재가 쓰던 임시 표 COPY와 병합 SQL을 `price-ingest/src/load/{copy,observation}.ts`로 옮기고, `price-db`는 `@workspace/price-ingest/load/observation`을 쓴다 (`price-ingest`에 `exports` `./*`). `price-db` DB 테스트 204개가 그대로 통과한다.

테스트 (`pnpm --filter @workspace/price-ingest test:db`, 15개 통과): 새 원천 키·위치·시장과 `pending` 매핑, 같은 내용 재적재 0행·행 수 그대로, 가격 정정(`revision`·이력·`correction_count`, `partial` 유지), 등록 시각만 바뀜(정정 아님), 행 거부 세 가지, 축평원 당일·평년 행과 재적재 0행, 다른 접속이 출처 lock을 잡으면 기다렸다 이어 감, 두 적재 동시 실행 결과가 하나와 같음, DB 기록 없이 Storage에만 올린 원본이 대조 → 적재로 들어감. 순수 함수 `pnpm test` 193개(시장 유형 표 포함).

남은 것: 참가격 적재는 06. `source_code_table`(응답으로 코드표 채우기)은 하지 않았다. `source_item.label`에 이름이 있어 운영자 목록에는 충분하고, 코드표 대조가 필요해지면 그때 더한다.
