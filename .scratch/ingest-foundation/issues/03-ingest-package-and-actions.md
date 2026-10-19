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
- [ ] 원본 경로 규칙: `raw/{source}/{YYYY}/{MM}/{DD}/{call-key}.ndjson.gz`. 보존 기간은 용량 실측 후 정함 (1년 지난 원본 삭제 검토)
- [ ] 워크플로 `.github/workflows/ingest-*.yml`: pipeline.md 5-1 일정 (cron은 UTC), `concurrency`, `timeout-minutes`, Secrets
- [ ] 참가격: `search-first-view/04`를 여기서 함께 처리. 2026-06-12 이후 빠진 조사일을 먼저 채운다 (늦을수록 손실)
- [ ] 호출 예산: 실행마다 출처별 상한 (pipeline.md 5-2 한도 초과 행)
- [ ] 키가 로그·오류에 남지 않는지 테스트

## 완료 기준

- 세 출처가 정한 시각에 사람 손 없이 적재된다.
- 일부러 DB 접속을 끊고 돌리면 원본은 Storage에 남고, 다음 실행에서 적재된다.
