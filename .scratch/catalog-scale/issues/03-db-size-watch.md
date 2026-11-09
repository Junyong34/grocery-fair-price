# 03. DB 크기 감시

Status: claimed
Type: task
Blocked by: 없음

## 목적

가공식품을 열고 출처를 늘리면 행이 빠르게 는다. 크기를 날마다 남기고 문턱을 넘으면 알린다. [ingest-foundation/05](../../ingest-foundation/issues/05-failure-handling.md)의 "DB 크기 감시" 칸을 이 티켓으로 떼어 온다.

## 할 일

- [x] 수집 실행이 끝날 때 `pg_database_size`와 `price` 표별 `pg_total_relation_size`·행 수를 남긴다 (새 표 또는 `ingest_run`의 열. 새 표면 `comment on`·RLS·ERD·helpers 목록 규칙을 따른다)
- [x] 문턱 알림: 기존 `alert/` 경로로. 문턱 값은 02의 플랜 결과에 맞춘다(Free면 400MB, Pro면 플랜 용량의 80%)
- [x] ingest-foundation/07의 남은 실측 두 칸(요약 뒤 DB 크기, 조사일당 요약 행 수)을 이 기록으로 채운다
- [x] ingest-foundation/05에서 해당 칸을 이 티켓 링크로 바꾼다

## 완료 기준

- 운영에서 하루 한 줄 이상 크기 기록이 쌓이고, 문턱 테스트가 통과한다.

## 진행 기록

**2026-11-09 (코드, 운영 적용 전)**
- 새 표 `price.db_size`(잰 시각, 전체 바이트, 표별 `{bytes, rows}` jsonb), `ingest_writer`는 읽기·쓰기만. 문턱은 `calc_param db.size_alert_mb = 400`(Free 500MB의 80%)으로 둬서, 플랜을 바꾸면 배포 없이 값만 고친다. 마이그레이션 `20261109000100_price_db_size.sql`, ERD 묶음 6, `helpers.ts` 목록.
- `size` 명령(`src/db-size.ts`): 한 행을 남기고 크기 상위 5개 표를 찍는다. 문턱을 넘으면 Actions 경고(`::warning::`)만 찍는다. KAMIS 워크플로가 매일 수집·판정 뒤에 부른다(월요일은 보존 정리 뒤).
- 알림: heartbeat(주 1회, 이슈 권한이 있다)가 `pg_database_size`를 직접 재서 문턱 이상이면 `supabase`·`db_size` 이슈를 연다. 넘은 동안에는 "Storage·DB에 닿음"으로 supabase 알림을 닫지 않는다. 날마다 알리지 않는 이유: 보존 정리 뒤 크기는 거의 멈춰 있고(15 결산), 400MB에서 500MB까지는 몇 주 넘게 걸린다.
- 테스트: 문턱·값 검사·알림 이슈 3개(`alert.test.ts`), 기록 DB 테스트 1개(`db-size.db.test.ts`). `pnpm typecheck`·`lint`·`test`·`db:test`·`price-ingest test:db` 통과.
- 실측 기준값(15 결산, 11-09): 369MB. `observation` 252MB, `daily_quote` 59MB, `season_index` 14MB, `product_daily_summary` 9.6MB.

**2026-11-09 운영 적용**: `supabase db push`(소유자 접속, 주소 가림)로 마이그레이션 적용 → 로컬에서 `size`를 운영에 한 번 돌려 첫 행(369MB)을 남김 → push(`b37a20a`).

**남은 것**: (적용 완료) ~~운영 DB에 마이그레이션을 적용한 뒤 push한다.~~ 순서가 바뀌면 KAMIS 워크플로의 "DB 크기" 단계가 표가 없어 실패한다(알림 9). 11-10 KAMIS 정기 실행에서 행이 생기는지 보고 닫는다.
