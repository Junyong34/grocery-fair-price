# 09. KAMIS 재등록 감시와 주간 14일 다시 받기

Status: claimed (코드·오프라인 테스트 완료 2026-11-27. 남은 것: 로컬 DB 테스트, live 계약 테스트, ingest-kamis.yml에 재등록 감시 단계 넣기)
Type: task (AFK)
Blocked by: 07

## Question

KAMIS는 몇 달 지난 날짜의 행을 다시 등록한다 (15일 넘게 뒤 7%, kamis.md 6-3). 매일 `cond[orgnl_reg_dt::GTE]`로 재등록을 감시하고, 매주 월요일 최근 14일을 다시 받는 보조 작업을 만든다 (5-1).

## 할 일

- [x] API 클라이언트에 `cond[orgnl_reg_dt::GTE]` 지원과 계약 고정 (kamis.md 1장, 03 진행 기록 "남은 것")
- [x] 감시 기준 시각: 직전 성공 감시의 시각을 어디서 읽는지 (`ingest_run`)
- [x] 재등록 행은 05의 병합으로 정정 처리. **90일 밖 날짜의 행은 관측값에 넣지 않는다** (보존 정리가 켜졌다, ingest-foundation/10, 2026-10-26). 원본에서 그날 표본을 다시 만들어 `daily_quote`를 바꾸고 `observation_revision.rebuild_result`를 남긴다 (pipeline 3-3 "보존 기간이 지난 행이 다시 등록되어 오면" 1~5). `recomputeDailyQuote`는 90일 밖 날을 다시 계산하지 않으므로 복원은 원본 표본을 세션 임시 표에 넣고 같은 계산을 그 표에 하는 길이 필요하다
- [x] `ingest --source kamis --job reregistration_watch`. 주간 14일 다시 받기는 11에서 `--recheck-days 14`로 만들었다
- [x] 테스트: 재등록 행이 와서 값이 바뀌면 `revision`·`observation_revision`·`correction_count`

## 완료 기준

- 로컬에서 두 작업이 돌고 테스트가 통과한다.

## 진행 기록

- 2026-11-27: 이미 있던 것 — 주간 14일 다시 받기(`--recheck-days 14`, 11), 보존 기간 안 재등록의 정정 처리(`load/observation.ts` 병합: 값이 바뀌면 `revision + 1`, `observation_revision`, 그날 `source_day.corrected_at`·`correction_count`, 등록 시각만 바뀌면 정정 아님. `test/db/load.db.test.ts`가 이미 덮는다), `ingest_run.job`의 `reregistration_watch` 값과 `observation_revision.rebuild_result` 열(마이그레이션 불필요).
- 클라이언트 (`src/sources/kamis.ts`): `regSince`(YYYY-MM-DDTHH:MM:SSZ) → `cond[orgnl_reg_dt::GTE]`. **계약 고정**: 명세 밖 조건이라 응답에 그 시각보다 먼저 등록된 행이 섞이면(조건이 무시됨) `ApiContractError`로 끊는다. 실측 테스트(`test/live/contract.live.test.ts`)에 "먼 미래 시각이면 0건"을 더했다(호출 1회). 실측 테스트는 돌리지 않았다(운영 키·한도를 쓰지 않기로 함).
- 수집 (`src/ingest/collect.ts` `collectKamisWatch`): 품목 140개마다 D-365~D-1 + 등록 시각 조건, 라벨 `reregistration`, 원본 하나. `ingest_run.job = reregistration_watch`.
- 기준 시각 (`src/load/ledger.ts` `lastOkRunStart`, `run.ts` `watchSinceOf`): 직전에 **성공(ok)한** 감시의 `started_at`(초 아래 버림). 감시가 부분 실패로 끝나면 기준이 그대로라 다음 감시가 같은 구간을 다시 받는다. 성공한 감시가 없으면 7일 전(처음 켤 때. 그 앞은 매일·주간 범위가 받았다).
- 90일 밖 행 (pipeline 3-3 1~5):
  - `load/load-file.ts`: KAMIS 정기 원본(백필 아님)의 행 중 오늘(KST)에서 90일 전보다 오래된 날은 관측값에 넣지 않고 `LoadOutcome.outdated`로 넘긴다(`restore-rules.ts` `splitByRetention`).
  - `load/restore.ts` `restoreOutdatedRows`: 그 조사일을 담은 모든 KAMIS 원본(`loaded`·`partially_rejected`, 받은 순서)을 Storage에서 읽어 자연키마다 마지막 값을 취하고, 이번 원본 바로 전 값을 이전 값으로 삼는다. 값이 같으면 정정이 아니라 남기지 않는다(`isCorrection`). 다르면(또는 이전 값을 모르면) 그날 표본(KAMIS 원본 + 축평원 관측값)을 세션 임시 표 `obs_restore`에 넣어 매핑을 붙이고, mapped·primary가 아니면 `not_aggregated`, 맞으면 `daily-quote.ts` `rebuildStagedQuotes`가 정기 수집과 같은 표본·집계로 그 (품종, 규격, 조사일)의 모든 범위를 낸다. 원본이 하나라도 지워졌거나 못 읽었거나 지금 칸 중 하나라도 표본 수가 줄면 `kept`(그대로 둠, `rebuildVerdict`), 아니면 그 묶음의 행을 지우고 새로 넣는다. 정정 후보마다 `observation_revision`(`rebuild_result`, 이전 값은 복원한 원본의 값, 모르면 null, `revision`은 그 키의 이력 수 + 1) 한 줄. 값이 바뀐 날의 `source_day` 정정 표시는 그 행이 있을 때만 올린다. `kept`는 로그에 경고. 복원이 실패하면 적재 실패로 세어 실행을 부분(1)으로 끝낸다.
  - 일자 요약: 재등록 감시 원본은 1년 범위라 전체를 다시 내지 않고 병합에서 바뀐 날(`MergeResult.dates`)만 다시 낸다.
- 워크플로 (`ingest-kamis.yml`): 매일 실행(06:30, 09:30 다시 받기, 수동 실행)의 수집 단계 뒤에 "재등록 감시" 단계. 주간 다시 받기 실행에서는 돌지 않는다. 알림 잡은 수집이 성공했으면 감시의 종료 코드로 알린다. `timeout-minutes` 30 → 50. 호출: 하루 140회 안팎 추가(매일 140 + 축산 페이지 + 감시 140 + 주간 약 200/주, KAMIS 한도 10,000의 4% 안팎).
- 순수 함수 테스트를 먼저 썼다: `test/restore.test.ts` 7개(정정 판단, 보존 기간 나누기, 다시 만든 집계로 바꿀지), 요청 주소·클라이언트 계약 3개, 수집 계획·인자·기준 시각 3개.
- 검증: `CI=true pnpm --filter @workspace/price-ingest test` 396개 통과, `pnpm typecheck`, `pnpm lint` 오류 0.
- **확인하지 못한 것**:
  - DB 테스트 `test/db/reregistration.db.test.ts`(4개: 매일 수집 → 보존 기간 안 재등록의 revision 2·`observation_revision` 3줄·`correction_count`, 보존 기간 밖 재등록은 관측값을 건드리지 않고 `not_aggregated` 3줄·이전 값은 앞 감시 원본의 값, 등록 시각만 바뀌면 줄을 남기지 않음)는 썼지만 **Docker가 꺼져 있어 돌리지 못했다**. SQL(`restore.ts`, `rebuildStagedQuotes`)은 한 번도 DB에서 실행되지 않았다. `pnpm db:start` 뒤 `pnpm --filter @workspace/price-ingest test:db`가 먼저다.
  - `rebuilt`·`kept` 길(매핑된 품종의 집계를 원본으로 다시 만들기)은 DB 테스트가 없다. 카탈로그 매핑이 있는 원천 키로 90일 밖 날을 만드는 준비가 커서 남겼다.
  - 완료 기준 "로컬에서 두 작업이 돈다"는 로컬 DB가 없어 확인하지 못했다. 운영 API·DB는 부르지 않았다.
  - 백필 원본(품목 × 1년 파일)까지 읽으므로 90일 밖 재등록이 있는 날은 원본을 140개 안팎 내려받는다. 실제 걸리는 시간은 재 보지 않았다.

## Answer

2026-11-27. `ingest --source kamis --job reregistration_watch`가 매일 수집 뒤에 돈다.

1. 감시 기준 시각은 `ingest_run`에서 직전 **성공** 감시의 `started_at`. 없으면 7일 전.
2. 조사일 범위는 D-365~D-1 (원본 1년 보관, 재등록 최대 249일 뒤).
3. 90일 안의 재등록은 기존 병합이 정정으로 처리한다. 90일 밖은 관측값에 넣지 않고 원본에서 그날 표본을 다시 만들어 완전할 때만 `daily_quote`를 바꾸고, 정정 후보마다 `observation_revision.rebuild_result`를 남긴다.
4. 등록 시각 조건이 무시되면(명세 밖) 계약 오류로 감시가 실패하고 알림 규칙(2회 연속)을 탄다. 그때는 주간 14일 다시 받기가 남는다.
5. 마이그레이션은 필요 없었다.
