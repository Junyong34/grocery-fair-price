# 03. DB 크기 감시

Status: ready-for-agent
Type: task
Blocked by: 없음

## 목적

가공식품을 열고 출처를 늘리면 행이 빠르게 는다. 크기를 날마다 남기고 문턱을 넘으면 알린다. [ingest-foundation/05](../../ingest-foundation/issues/05-failure-handling.md)의 "DB 크기 감시" 칸을 이 티켓으로 떼어 온다.

## 할 일

- [ ] 수집 실행이 끝날 때 `pg_database_size`와 `price` 표별 `pg_total_relation_size`·행 수를 남긴다 (새 표 또는 `ingest_run`의 열. 새 표면 `comment on`·RLS·ERD·helpers 목록 규칙을 따른다)
- [ ] 문턱 알림: 기존 `alert/` 경로로. 문턱 값은 02의 플랜 결과에 맞춘다(Free면 400MB, Pro면 플랜 용량의 80%)
- [ ] ingest-foundation/07의 남은 실측 두 칸(요약 뒤 DB 크기, 조사일당 요약 행 수)을 이 기록으로 채운다
- [ ] ingest-foundation/05에서 해당 칸을 이 티켓 링크로 바꾼다

## 완료 기준

- 운영에서 하루 한 줄 이상 크기 기록이 쌓이고, 문턱 테스트가 통과한다.
