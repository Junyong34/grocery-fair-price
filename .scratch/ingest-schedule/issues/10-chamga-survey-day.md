# 10. 참가격 조사일 감지·완료 규칙

Status: resolved
Type: task (AFK)
Blocked by: 06, 07

## Question

참가격은 조사일(격주 금요일 전후) 입력이 2일 전~7일 뒤로 퍼지고 며칠에 나뉘어 들어온다. 매일 가볍게 감지하고, 들어왔으면 전체를 받고, 언제 그 조사일을 닫는지를 [chamgagyeok.md 5-4](../../../grocery-price/docs/30-data/sources/chamgagyeok.md) 대로 만든다. [search-first-view/04](../../search-first-view/issues/04-chamgagyeok-scheduled-fetch.md)의 본체다.

## 할 일

- [x] 감지: 확정되지 않은 최근 금요일 2개 × 상품 3개(`1000`, `1395`, `1075`)
- [x] 실행마다 점포·상품 마스터를 각 1회 받아 가격보다 먼저 원본으로 올린다 (06 Answer 1)
- [x] 전체 수집: 식품 457개를 `goodId` 기준으로 (chamgagyeok.md 8장)
- [x] 완료: 행 수가 두 번 연속 같고 마지막 `inputDttm`이 하루 넘게 지나면 확정. 그다음 주 월요일에 한 번 더. 금요일 뒤 10일이 지나도 비면 `empty_expected`
- [x] 확정 상태를 어디에 두는지 (`source_day` 상태와 열로 충분한지) 정하고 `## Answer`에
- [x] `ingest --source chamga`가 날짜 없이 위 규칙으로 돌게
- [x] 테스트: 나뉘어 들어오는 조사일, 빈 조사일 닫기, 월요일 한 번 더

## 완료 기준

- 로컬에서 최근 조사일 하나가 감지 → 전체 수집 → 확정까지 간다.

## Answer

2026-10-26. 규칙 `packages/price-ingest/src/ingest/chamga-schedule.ts`, 상태 읽기·쓰기 `src/load/survey-day.ts`, 실행 흐름 `src/ingest/run.ts`.

```
pnpm --filter @workspace/price-ingest ingest --source chamga                         # 자동 모드 (매일 07:00, 12의 워크플로)
pnpm --filter @workspace/price-ingest ingest --source chamga --survey-day 2026-06-12 [--survey-day …]   # 지정한 조사일 (과거분, 12)
```

**자동 모드**: 오늘(KST)을 포함한 최근 금요일 2개마다 `source_day`를 읽고 할 일을 정한다 (chamgagyeok.md 5-4 그대로).

| 상태 | 할 일 |
|---|---|
| 닫힘(`closed_at`) | 건너뜀 |
| 기록 없음, 또는 행 0인 `pending`·`failed`·`empty_unexpected` | 감지: 상품 `1000`, `1395`, `1075`를 차례로, 행이 나오면 멈춤 (최대 3회). 찾으면 그날 전체 수집. 못 찾으면 금요일 뒤 10일이 지났을 때 `empty_expected`로 닫고, 아니면 `pending`으로 둔다 |
| 완료(`stable_checks ≥ 1` 그리고 마지막 `inputDttm`이 하루 넘게 지남) | 월요일이면 마지막으로 한 번 더 받고 닫음, 아니면 건너뜀 |
| 그 밖(들어오는 중) | 전체 수집 |

- 전체 수집 = 점포 마스터·상품 마스터 각 1회 + 식품 457개 가격. 받을 조사일이 없으면 마스터도 부르지 않는다.
- **확정 상태는 `source_day`의 기존 열로 충분하다** (새 열 없음): `row_count`(그날 관측값 수), `stable_checks`(전체 수집 뒤 행 수가 받기 전과 같으면 +1, 바뀌면 0), `max_source_registered_at`(05의 병합이 채운다), `closed_at`. 완료는 저장하지 않고 이 열들로 매번 계산한다. 그래서 완료 뒤에는 월요일까지 부르지 않아 값이 그대로다.
- 호출이 하나라도 실패한 실행은 `stable_checks`를 세지 않는다 (빠진 상품 때문에 행 수가 우연히 같을 수 있다). 마지막 받기도 실패가 없을 때만 닫는다.
- 감지 응답은 원본으로 남기지 않는다. 찾으면 같은 실행의 전체 수집이 같은 행을 다시 받는다.
- 오래 열려 있는 조사일: 금요일 두 개만 보므로 조사일이 완료되지 않은 채 2주가 지나면 더 보지 않고 열린 채로 남는다. 08(빈 날 메우기)·14(heartbeat)에서 다룬다.
- 조사일 전체 `partial`(최근 4개 조사일 중앙값의 80% 미만, chamgagyeok.md 9장) 판정은 하지 않았다. 행 수 안정 규칙이 "아직 들어오는 중"을 잡고, 부분 누락 판정은 05(장애 처리)의 일이다.

**검증**
- `pnpm test`: `test/chamga-schedule.test.ts` 13개 (최근 금요일, 완료 판단 네 경우, 안정 횟수, 상태별 할 일 여섯 경우, 10일 닫기), `test/ingest.test.ts`에 인자(자동 모드, 여러 조사일).
- `test:db`: `test/db/chamga-auto.db.test.ts` 7개, 2096년 가짜 데이터로 조사일 하나의 생애를 차례로 돈다: 토요일 감지만 6회·두 날 `pending` → 월요일 일부(300곳) 감지·전체 수집(463회)·그 전 금요일 10일 지나 `empty_expected`로 닫음 → 화요일 더 들어옴(419곳)·안정 0 → 수요일 그대로·가격 원본 중복·안정 1·완료 → 목요일 호출 0 → 다음 월요일 마지막 받기·닫음 → 닫힌 날은 다시 안 봄.
- 실제 참가격 호출은 하지 않았다. 하루 한도 2,000회 중 자동 모드 한 번이 약 470회이고, 12의 과거분 채우기가 하루 1,371회를 쓴다. 응답 모양은 06·계약 테스트로 확인돼 있다. 12의 첫 운영 실행이 실제 확인이다.
