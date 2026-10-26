# 09. KAMIS 재등록 감시와 주간 14일 다시 받기

Status: open
Type: task (AFK)
Blocked by: 07

## Question

KAMIS는 몇 달 지난 날짜의 행을 다시 등록한다 (15일 넘게 뒤 7%, kamis.md 6-3). 매일 `cond[orgnl_reg_dt::GTE]`로 재등록을 감시하고, 매주 월요일 최근 14일을 다시 받는 보조 작업을 만든다 (5-1).

## 할 일

- [ ] API 클라이언트에 `cond[orgnl_reg_dt::GTE]` 지원과 계약 고정 (kamis.md 1장, 03 진행 기록 "남은 것")
- [ ] 감시 기준 시각: 직전 성공 감시의 시각을 어디서 읽는지 (`ingest_run`)
- [ ] 재등록 행은 05의 병합으로 정정 처리. **90일 밖 날짜의 행은 관측값에 넣지 않는다** (보존 정리가 켜졌다, ingest-foundation/10, 2026-10-26). 원본에서 그날 표본을 다시 만들어 `daily_quote`를 바꾸고 `observation_revision.rebuild_result`를 남긴다 (pipeline 3-3 "보존 기간이 지난 행이 다시 등록되어 오면" 1~5). `recomputeDailyQuote`는 90일 밖 날을 다시 계산하지 않으므로 복원은 원본 표본을 세션 임시 표에 넣고 같은 계산을 그 표에 하는 길이 필요하다
- [ ] `ingest --source kamis --job reregistration_watch`. 주간 14일 다시 받기는 11에서 `--recheck-days 14`로 만들었다
- [ ] 테스트: 재등록 행이 와서 값이 바뀌면 `revision`·`observation_revision`·`correction_count`

## 완료 기준

- 로컬에서 두 작업이 돌고 테스트가 통과한다.
