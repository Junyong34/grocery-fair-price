# 15. 사람 손 없이 일주일 돌았는지 확인하고 닫기

Status: resolved
Type: task (AFK)
Blocked by: 11, 12, 13, 14

## Question

목적지에 닿았는가? 운영에서 일주일 동안 세 출처가 정한 시각에 사람 손 없이 쌓였는지 기록으로 확인하고, 나눠 담았던 원래 티켓을 정리한다.

## 할 일

- [x] 운영 `ingest_run`·`source_day`로 7일간 출처별 실행·상태 표 (빠진 실행, 늦은 실행, 메워진 날)
- [x] Actions 로그 무작위 몇 개에서 키·접속 주소가 없는지
- [x] [ingest-foundation/03](../../ingest-foundation/issues/03-ingest-package-and-actions.md)과 [search-first-view/04](../../search-first-view/issues/04-chamgagyeok-scheduled-fetch.md)에 결과를 적고, 이 지도 Out of scope로 미룬 것(재계산, 관측값 정리·재등록 복원, merge-product, 원본 삭제)을 03의 남은 일로 옮긴 뒤 상태를 고친다. `ingest-foundation/spec.md` 표도
- [x] pipeline.md 5장에 실측과 다른 점이 있으면 고친다
- [x] 지도의 "수집 시각 조정" 안개는 2주 뒤 일이므로 03의 남은 일로 넘긴다

## 완료 기준

- 일주일 표가 `## Answer`에 있고, 원래 티켓들이 이 지도의 결과를 가리킨다.

## Answer

2026-11-09 결산. 운영 `ingest_run`·`source_day`(읽기 전용 조회)와 Actions 실행 기록으로 10-29~11-09 열이틀을 봤다. **세 출처가 사람 손 없이 매일 쌓였다.**

### 출처별 실행 (KST)

| 출처 | 정기 실행 | 결과 | 실제 시작 시각 | 비고 |
|---|---|---|---|---|
| KAMIS 매일 | 12/12 | 모두 `ok`, 호출 140/8000, 46~68초 | 09:19~12:00 | 주말 조사일은 556~561행(평일 약 5,500행)이 정상 |
| KAMIS 주간 다시 받기 | 2/2 (11-02, 11-09 월) | `ok`, 151회 | 10:28, 10:41 | |
| 축평원 매일 | 12/12 | `ok`, 21~24회 | 09:25~12:03 | 조사일 26~27행 |
| 축평원 백필 | 12/12 | `partial`(예산 소진, 정상) → 11-09 마지막 달에서 `tasks_failed` | 같은 실행 뒤 | 아래 "남은 문제" |
| 참가격 | 12/12 | `ok` 11, `partial` 1(10-30 `unreachable`, 다음 날 회복) | 09:32~12:08 | 10-23 조사일 95,265행이 사람 손 없이 들어왔고 요약도 생겼다 |
| heartbeat | 2/2 (10-29, 11-04 수) | 성공 | | |

- **빠진 날 없음.** `source_day`는 KAMIS·축평원 10-26~11-08 모두 `ok`. 정정은 KAMIS 10-26 한 번. 참가격 10-30은 `empty_expected`(격주), 11-06은 `pending`(등록 전, 정상).
- **Actions 실패 1회.** 11-02 KAMIS 실행의 보존 정리 단계(첫 실행). 수집 자체는 `ok`였고, 알림 #3이 열렸다가 다음 날 닫혔다. 같은 날 `3fc1a51`로 고쳤다.
- **늦은 실행.** cron은 06:30~07:00인데 실제로는 **3~5시간 늦게** 돈다(최대 12:00). 09:30 다시 받기가 첫 실행보다 먼저 도는 날도 있다. pipeline.md 5-1의 "몇 분~수십 분"을 실측으로 고쳤다.
- **남은 `running` 행 하나.** 10-29 11:41 축평원 `daily`(같은 날 11:55 재실행이 `ok`). 실행이 중간에 끊겨 상태를 못 바꾼 것으로 보인다. 화면·알림에는 영향이 없다.

### 비밀값

Actions 로그 9개(수집 8, heartbeat 1, 4,100줄)에서 `serviceKey=값`, `postgres://`, `sb_secret_`, JWT, Supabase 호스트 패턴이 하나도 나오지 않았다.

### DB 크기 (11-09)

- 전체 **369MB**(보존 정리 직전 측정). `observation` 252MB(93.8만 행: 참가격 6 조사일 57.2만, KAMIS 90일 33.1만, 축평원 3.6만), `daily_quote` 59MB, `season_index` 14MB, `product_daily_summary` 9.6MB.
- 오늘 보존 정리가 참가격 39.5만 행, KAMIS 4.3만 행을 지웠다. Postgres는 지운 자리를 파일 크기로 돌려주지 않고 다음 적재에 다시 쓴다. 그래서 크기는 이 근처에서 멈출 것으로 본다. **다만 400MB(알림 기준)까지 31MB밖에 남지 않았다.** 감시와 알림은 [catalog-scale/03](../../catalog-scale/issues/03-db-size-watch.md), 플랜 전환은 [catalog-scale/02](../../catalog-scale/issues/02-supabase-pro-backup.md).

### 남은 문제

- **축평원 백필 마지막 묶음 3개 실패** (`ekape:4301·4304·4401:2023-01`, `calls_failed`). 2023-01-01·02 응답이 계약 검사(`ApiContractError`, HTTP 200)에 걸린다. 실패한 묶음은 매일 다시 시도되어 하루 약 93회를 쓴다. 계약을 고치거나 그 묶음을 닫아야 한다 → [ingest-foundation/04](../../ingest-foundation/issues/04-kamis-backfill.md).

### 옮긴 일

- 이 지도의 Out of scope 중 남은 것(`merge-product`, 원본 삭제), Not yet specified의 "수집 시각 조정"은 [ingest-foundation/03](../../ingest-foundation/issues/03-ingest-package-and-actions.md)의 남은 일로 옮겼다. 재계산·관측값 정리는 이미 만들어졌다(ingest-foundation/10·11, 07).
- [12](12-chamga-workflow-and-catch-up.md), [ingest-foundation/07](../../ingest-foundation/issues/07-chamga-seller-summary-retention.md)을 닫았다. [search-first-view/04](../../search-first-view/issues/04-chamgagyeok-scheduled-fetch.md)는 이미 resolved다.
