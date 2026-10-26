# 03. 수집 패키지와 GitHub Actions 워크플로

Status: ready-for-agent
Type: task
Blocked by: 01, 02, p2-data-source-spec/12

> 2026-10-26: 남은 일 중 정기 수집을 켜는 데 필요한 것을 [ingest-schedule 지도](../../ingest-schedule/map.md)로 나눴다. 재계산, 관측값 정리·보존 기간 밖 재등록 복원, `merge-product`, 원본 삭제는 품종 목록 뒤로 미뤄 이 티켓에 남는다 (지도의 Out of scope).

## 목적

API 호출 → 원본 Storage 저장 → 변환 → Postgres upsert → 재계산을 하는 CLI를 만들고, GitHub Actions가 출처별 시각에 부르게 한다.

## 할 일

- [ ] 패키지: `packages/price-ingest` (제안). `p2/12`의 API 클라이언트·계약 테스트와 `p4/03`의 어댑터가 이 안에 들어간다
- [ ] CLI: `ingest --source kamis|ekape|chamga --date YYYY-MM-DD`, `ingest --fill-gaps`(`source_day`의 빈 날 메우기), `recompute`(시작 때 기본 규격 검사 질의, pipeline.md 3-1), 운영자용 `merge-product --from A --into B` (상품 병합, pipeline.md 3-6)
- [ ] 순서: 원본을 먼저 Storage에 올린 뒤 적재한다 (DB 실패 시 다시 적재할 수 있게)
- [ ] 적재 전 대조 (결정 B, 2026-10-22): 실행마다 Storage의 최근 N일 폴더(`raw/{source}/…`)를 목록으로 읽어 `raw_object`에 없는 파일을 `pending_load`로 채운 뒤, `pending_load` 파일을 모두 적재한다. N은 7일로 확정했다 (2026-10-22: 수집 실패 2회 연속 알림(5-3)이 며칠 안에 사람을 부르므로 7일이면 복구 여유가 충분하다). 실행 사이의 로컬 기록은 쓰지 않는다. 완료 기준의 "DB를 끊고 돌려도 다음 실행에서 적재"가 이 경로로 검증된다
- [ ] 접속: DB는 `INGEST_DATABASE_URL`(`ingest_writer`, Supavisor **세션 모드 5432**)로만. 트랜잭션 모드(6543)는 쓰지 않는다. Storage는 `SUPABASE_URL` + `SUPABASE_SECRET_KEY`(`sb_secret_…`)로만 (pipeline.md 3-0 "접속", "키")
- [ ] 적재 단위: **원본 파일 하나 = 트랜잭션 하나.** `begin` → `pg_advisory_xact_lock(hashtext('ingest:' || source))` → `COPY` → 임시 표(`on commit drop`) → 정정 비교·`observation_revision` → 병합 → `raw_object.load_status` → `commit`. `recompute`는 `hashtext('recompute')` lock
- [ ] 병합은 바뀐 행만 고쳐 쓴다: `on conflict … do update … where (비교 열) is distinct from (excluded…)` (pipeline.md 3-3의 SQL, 비교 열에 `product_id` 포함). 값이 같은 다시 받기에서 갱신 행 수가 0인지 테스트로 고정. 정정은 `source_day.status`를 바꾸지 않고 `corrected_at`·`correction_count`만 올린다
- [ ] **필수 시나리오: 보존 기간 밖 재등록** (pipeline.md 3-3, 2026-10-21). 90일이 지난 KAMIS 조사일의 행이 다시 오면 관측값에 넣지 않고, 그 조사일을 담은 원본 파일 전체로 표본을 복원해 세션 임시 표에서 집계를 다시 내고 `daily_quote`를 한 트랜잭션에서 바꾼다. 원본이 하나라도 지워졌거나(`purged_at`) 복원 표본이 지금 `n`보다 적으면 집계를 그대로 두고 `observation_revision`(`rebuild_result = kept`)과 경보만 남긴다. 두 경우 모두 테스트로 고정
- [ ] 원본을 지울 때(보존 기간 지난 KAMIS·축평원)는 Storage 파일만 지우고 `raw_object.purged_at`을 채운다. 행은 지우지 않는다 (3-7)
- [ ] 원본 경로 규칙: `raw/{source}/{YYYY}/{MM}/{DD}/{call-key}.ndjson.gz`. 보존 기간은 용량 실측 후 정함 (1년 지난 원본 삭제 검토)
- [ ] 워크플로 `.github/workflows/ingest-*.yml`: pipeline.md 5-1 일정 (cron은 UTC), `concurrency: { group: ingest-<source>, cancel-in-progress: false }` (DB의 advisory lock과 두 겹), `timeout-minutes`, Secrets (`DATA_GO_KR_SERVICE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `INGEST_DATABASE_URL`)
- [ ] 참가격: `search-first-view/04`를 여기서 함께 처리. 2026-06-12 이후 빠진 조사일을 먼저 채운다 (늦을수록 손실)
- [ ] 호출 예산: 실행마다 출처별 상한 (pipeline.md 5-2 한도 초과 행)
- [ ] 키·접속 주소가 로그·오류에 남지 않는지 테스트

## 완료 기준

- 세 출처가 정한 시각에 사람 손 없이 적재된다.
- 일부러 DB 접속을 끊고 돌리면 원본은 Storage에 남고, 다음 실행에서 적재된다.
- 같은 출처 적재 두 개를 동시에 돌리면 하나가 lock을 기다렸다가 이어서 돌고, 결과가 하나만 돌린 것과 같다.
- 보존 기간 밖 재등록 테스트: 원본이 다 있으면 집계가 원본 전체 표본으로 바뀌고(다시 온 행 하나로 바뀌지 않는다), 원본이 불완전하면 집계가 그대로다.

## 진행 기록

**1차 (2026-10-22): 원본 보관과 대조 경로** (`packages/price-ingest/src/load/`)
- `raw-file.ts`: 1번째 줄은 헤더(출처, 엔드포인트, 받은 실행의 작업·번호·시작 시각, 호출 기록, 받은 시각, 행 수, 계약 기준, 어댑터 버전), 2번째 줄부터는 응답 행을 손대지 않고 그대로 둔다. gzip으로 묶는다. 헤더를 파일 안에 두어서 DB 기록이 없어도 파일만으로 `raw_object` 기록을 다시 만든다.
- 내용 해시(`content_sha256`)는 압축 전 **행 줄만**의 SHA-256이다. 헤더(받은 시각 등)는 넣지 않는다. 같은 응답을 다시 받으면 같은 값이 되어 `duplicate`를 가릴 수 있다 (점검 뒤 고침: 처음에는 헤더를 포함한 gzip 바이트를 해시해서 다시 받을 때마다 값이 달랐다).
- 호출 키는 묶음 라벨과 받은 시각(밀리초까지)이다. 다시 받은 파일도 자기 경로를 가져서, 내용이 같으면 `duplicate` 기록을 따로 남길 수 있다.
- `storage.ts`: 업로드·목록·내려받기·삭제. 비밀 키만 쓴다. 중복 업로드는 HTTP 400과 본문 코드 `KeyAlreadyExists`로 온다 (로컬 실측, 409가 아니다).
- `ledger.ts`, `reconcile.ts`: 실행 기록 시작, 대조(최근 7일 폴더), 기록 없는 원본을 `pending_load`로 등록.
- 객체 키는 버킷 `raw` 안에서 `{출처}/{YYYY}/{MM}/{DD}/{호출키}.ndjson.gz`다. DB의 `storage_path`는 그 앞에 버킷 이름을 붙인 `raw/{출처}/…`다 (DB 열 주석, pipeline 3-7. 점검 뒤 고침: 처음에는 `raw/`를 뺐다). 날짜 폴더는 KST 수집일이다.
- 대조가 채운 기록의 `ingest_run_id`는 **원본을 받은 실행**이다 (DB 열 주석). 헤더에 실행 번호가 있으면 그것을, 없으면(DB가 처음부터 안 되었으면) 헤더의 작업·시작 시각으로 그 실행을 `status = failed`, `error_code = db_unreachable`로 기록해 가리킨다. 같은 실행의 원본은 같은 기록을 가리킨다 (점검 뒤 고침: 처음에는 대조한 실행을 넣었다).
- `sql.array`는 연결의 첫 쿼리에서 배열로 보내지지 않아 실패했다 (postgres 3.4.9, 로컬 실측). 목록은 JSON 배열(`jsonb_array_elements_text`)로 넘긴다.
- 테스트: 순수 함수 `pnpm test` 148개 (대조 기간, 원본 형식, 키), 로컬 DB·Storage 통합 `pnpm test:db` 4개. DB 기록 없이 올린 원본을 다음 실행이 `pending_load`로 등록하고, 기록된 파일은 다시 등록하지 않고, 같은 내용 재업로드는 `exists`, 7일 밖 파일은 대조하지 않는다.

**남은 것 (2차 이후)**
- 적재 트랜잭션: 출처별 advisory lock → 임시 표 COPY → 정정 비교 → 병합 → `loaded`. 자연키를 DB 번호로 바꾸는 단계(결정 1)를 이 트랜잭션 안에 둔다.
- "DB를 끊고 돌려도 다음 실행에서 적재"를 `pending_load` 적재까지 end-to-end로 검증. 같은 출처 동시 실행 lock 테스트.
- 같은 대상을 다시 받았을 때 내용 해시가 직전 파일과 같으면 올리지 않고 `duplicate`로 기록 (3-7). 해시는 이제 행 내용만으로 나오므로 비교할 수 있다.
- 적재가 `obs_place`·`market`·`store` 행을 만들 재료: 어댑터 초안에는 시장 이름·지역 코드, 점포 정보가 없다. 원본 행이나 마스터에서 읽는다.
- KAMIS 재등록 감시 조건 `cond[orgnl_reg_dt::GTE]` 지원과 계약 고정 (kamis.md 1장).
- CLI(`ingest`, `--fill-gaps`, `recompute`, `merge-product`), 워크플로, 보존 기간 밖 재등록 복원, 04(참가격 정기 수집).
