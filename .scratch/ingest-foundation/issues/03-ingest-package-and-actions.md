# 03. 수집 패키지와 GitHub Actions 워크플로

Status: ready-for-agent
Type: task
Blocked by: 01, 02, p2-data-source-spec/12

## 목적

API 호출 → 원본 Storage 저장 → 변환 → Postgres upsert → 재계산을 하는 CLI를 만들고, GitHub Actions가 출처별 시각에 부르게 한다.

## 할 일

- [ ] 패키지: `packages/price-ingest` (제안). `p2/12`의 API 클라이언트·계약 테스트와 `p4/03`의 어댑터가 이 안에 들어간다
- [ ] CLI: `ingest --source kamis|ekape|chamga --date YYYY-MM-DD`, `ingest --fill-gaps`(`source_day`의 빈 날 메우기), `recompute`
- [ ] 순서: 원본을 먼저 Storage에 올린 뒤 적재한다 (DB 실패 시 다시 적재할 수 있게)
- [ ] 접속: DB는 `INGEST_DATABASE_URL`(`ingest_writer`, Supavisor **세션 모드 5432**)로만. 트랜잭션 모드(6543)는 쓰지 않는다. Storage는 `SUPABASE_URL` + `SUPABASE_SECRET_KEY`(`sb_secret_…`)로만 (pipeline.md 3-0 "접속", "키")
- [ ] 적재 단위: **원본 파일 하나 = 트랜잭션 하나.** `begin` → `pg_advisory_xact_lock(hashtext('ingest:' || source))` → `COPY` → 임시 표(`on commit drop`) → 정정 비교·`observation_revision` → 병합 → `raw_object.load_status` → `commit`. `recompute`는 `hashtext('recompute')` lock
- [ ] 병합은 바뀐 행만 고쳐 쓴다: `on conflict … do update … where (비교 열) is distinct from (excluded…)` (pipeline.md 3-3의 SQL). 값이 같은 다시 받기에서 갱신 행 수가 0인지 테스트로 고정
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
