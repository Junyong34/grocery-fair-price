# 08. 빈 날 메우기와 `source_day` 상태

Status: claimed (코드·오프라인 테스트 완료 2026-11-27, --fill-gaps 뒤로 막아 둠. 남은 것: 로컬 DB 테스트, 워크플로에 --fill-gaps 켜기)
Type: task (AFK)
Blocked by: 07

## Question

Actions 정기 실행은 늦거나 빠진다 (5-1). 시각에 기대지 않고 `source_day`의 빈 날을 메우는 `ingest --fill-gaps`가 KAMIS·축평원에서 어떤 규칙으로 날을 고르고 상태를 바꾸는가?

## 할 일

- [x] 상태 전이 (3-5, 5-2 "아직 안 옴"·"와야 하는데 빔"·"휴일"): `pending` → `ok` / 3일 다시 시도 후 `empty_unexpected` / 휴일이면 `empty_expected`
- [x] 휴일 판단: KAMIS 휴일을 무엇으로 아는지 정한다 (지도의 안개). 우리 공휴일 데이터(`packages/seasonal/src/calendar/`)를 쓸지, 주말·공휴일엔 0건이 정상이라는 규칙만 둘지. `## Answer`에
- [x] `--fill-gaps`가 매일 실행에 함께 돌게 한다: 정한 기간(예: 최근 14일) 안에서 `ok`가 아닌 날을 다시 받는다. 호출 예산 안에서
- [x] 테스트: 하루 빠진 실행 뒤 다음 실행이 그 날을 채운다, 휴일은 다시 받지 않는다, 3일 뒤 `empty_unexpected`

## 완료 기준

- 테스트가 통과하고, `source_day`만 보고 출처별 마지막 정상 날짜를 낼 수 있다 (14가 쓴다).

## 진행 기록

- 2026-11-27: 이미 있던 것 — 행이 온 날을 `ok`로 바꾸는 적재(`load/observation.ts` `settleSourceDays`, 아직 안 옴·실패·와야 하는데 빔 → ok). 없던 것 — 행이 하나도 없는 날은 `source_day` 행 자체가 생기지 않았고(적재가 받은 행의 날짜로만 만든다), 매일 실행은 D-3~D-1만 받아 그보다 오래 빠진 날은 주간 14일 다시 받기까지 비었다.
- 규칙 (순수 함수, `src/ingest/fill-gaps.ts`, 테스트 먼저 `test/fill-gaps.test.ts` 15개):
  - `gapDays`: 기준일 D의 D-14~D-4 중 기록 없음·`pending`·`failed`·`partial`인 날을 오래된 날부터. `ok`·`empty_expected`(휴일)·`empty_unexpected`(닫힌 빈 날)는 다시 받지 않는다.
  - `nextDayState`: 행 있음 → `ok`. 행 없음 + 호출·적재가 깨끗함 → `pending`, `attempts + 1`. **3번 확인했고 D+3이 지났으면** `empty_unexpected` (같은 날 두 번 돈 실행이 일찍 닫지 않게, 실행이 빠진 날 한 번 보고 닫지 않게 둘 다 본다). 깨끗하지 않으면(호출 실패·멈춤·적재 실패) `failed`, 확인 횟수는 세지 않고 `last_error_code`를 남긴다. `empty_expected`·`partial`은 그대로 둔다.
- 실행 (`src/ingest/run.ts`, `src/load/source-day.ts`): `--fill-gaps`면 수집 전에 `source_day`를 읽어 빈 날을 더한다. KAMIS는 기간 호출의 시작일만 앞당긴다(품목당 호출 수 그대로 140, 축산만 페이지가 는다). 축평원은 더한 날마다 축종 7회라 **실행마다 2일(14회)까지**다(하루 한도 1,000 − 정기 21 − 백필 900). 적재 뒤 이번 실행이 확인한 모든 날(KAMIS는 시작일~D-1, 축평원은 부른 날)에 `settleCheckedDays`로 상태·확인 횟수를 쓴다(행이 없던 날도 행을 만든다). 주간 다시 받기(`--recheck-days`)에도 상태는 쓰지만 `--fill-gaps`와는 같이 주지 못한다.
- 워크플로: `ingest-kamis.yml` 매일 실행(주간 다시 받기가 아닐 때)과 `ingest-ekape.yml`이 `--fill-gaps`를 준다. 호출 수: KAMIS 하루 140 + 축산 페이지 몇 회(재등록 감시 140, 주간 약 200을 더해도 한도 10,000의 5% 안팎), 축평원 최대 35 + 백필 900.
- 마지막 정상 날짜: `source_day`에서 `max(target_date) where status = 'ok'` (`load/source-day.ts` `lastOkDays`). heartbeat는 `ok`·`partial`을 본다(그대로 둔다).
- 검증: `CI=true pnpm --filter @workspace/price-ingest test` 384개 통과(새 18개: fill-gaps 15, 수집 계획·인자 3), `pnpm typecheck`, `pnpm lint` 오류 0.
- **확인하지 못한 것**: DB 테스트(`test/db/run.db.test.ts` "빈 날 메우기와 source_day 상태" 4개: 행이 온 날 ok·안 온 날 pending, 하루 빠진 실행 뒤 채움, 3번·3일 뒤 `empty_unexpected`, 휴일·닫힌 날은 다시 받지 않음)는 썼지만 Docker가 꺼져 있어 돌리지 못했다. `pnpm db:start` 뒤 `pnpm --filter @workspace/price-ingest test:db`로 돌려야 한다. 운영에서도 돌리지 않았다.

## Answer

2026-11-27.

1. **휴일 달력은 쓰지 않는다.** 상태는 그 출처의 그날 관측값이 하나라도 있는지로 정한다. 이유: KAMIS는 축산 행이 주말·공휴일에도 오고(kamis.md 7장, 운영 `source_day`의 주말도 `ok`), 축평원도 2026년엔 휴일까지 매일 값이 있다(ekape.md 9장). 그래서 **출처 전체가 0건인 날은 휴일이 아니라 늦거나 빠진 날**이다. 공휴일 달력(`packages/seasonal`)을 끌어오면 의존성이 늘고, 근로자의 날·선거일·사유 모를 0건 날(2025-12-05)은 달력에 없어 어차피 맞지 않는다. 되돌리기 쉽다: 달력이 필요해지면 `nextDayState`에 "예상된 빈 날이면 `empty_expected`" 한 줄을 더한다.
2. KAMIS **소매 품목만** 비는 평일(공휴일)은 출처 단위 상태로는 `ok`다. 그런 날을 가려내는 일은 5-2 "일부만 옴"(품목별 건수, `source_day_part`)이 맡는다 → [ingest-foundation/05](../../ingest-foundation/issues/05-failure-handling.md).
3. 빈 날: 3번 확인 **그리고** D+3 이후 → `empty_unexpected`. 그 뒤로는 다시 받지 않지만, 주간 다시 받기나 재등록 감시로 행이 오면 적재가 `ok`로 바꾼다.
4. 빈 날 메우기 기간은 D-14~D-4, 축평원은 실행마다 2일까지.
