# 05. 원본 적재 트랜잭션 (KAMIS·축평원)

Status: open
Type: task (AFK)
Blocked by: -

## Question

`pending_load` 원본 파일 하나를 한 트랜잭션으로 관측값에 넣는 적재를 만든다. 순서는 pipeline.md 3-0·3-3: `begin` → `pg_advisory_xact_lock(hashtext('ingest:' || source))` → 임시 표(`on commit drop`)에 `COPY` → 정정 비교·`observation_revision` → 바뀐 행만 고쳐 쓰는 병합 → `source_day` 갱신 → `raw_object.load_status` → `commit`.

## 할 일

- [ ] 자연키 → DB 번호 바꾸기를 이 트랜잭션 안에: 처음 보는 출처 코드는 `source_item`에 넣고 매핑을 `pending`으로 (3-1). **대응표가 없어도 적재된다**: `variety_id`·`spec_id`·`price_per_base`는 `null`
- [ ] 관측 위치: KAMIS 시장(`market`, `obs_place`)과 지역 코드, 축평원 전국·시도. 어댑터 초안에는 시장 이름·지역 코드가 없다(03 진행 기록 "남은 것"). 원본 행에서 읽을지 마스터에서 읽을지 여기서 정하고 `## Answer`에 적는다
- [ ] 병합: `on conflict … do update … where (비교 열) is distinct from (excluded…)`. 값이 같은 다시 받기에서 갱신 행 수 0을 테스트로 고정. 정정은 `source_day.status`를 바꾸지 않고 `corrected_at`·`correction_count`만
- [ ] `first_seen_at`은 처음 넣을 때만 채운다 (5-1)
- [ ] 같은 대상 다시 받기가 직전 파일과 내용 해시가 같으면 `duplicate`로 기록하고 적재하지 않는다 (3-7)
- [ ] `test:db` 통합 테스트: (1) 같은 출처 적재 두 개를 동시에 돌리면 하나가 lock을 기다렸다 잇고 결과가 하나만 돌린 것과 같다, (2) DB 없이 원본만 올린 뒤 다음 실행의 대조 → 적재까지 end-to-end로 들어간다, (3) 같은 파일 두 번 적재해도 행이 그대로

## 완료 기준

- KAMIS·축평원 샘플 원본이 로컬 DB에 `ingest_writer` 롤로 적재되고 위 테스트 셋이 통과한다.
