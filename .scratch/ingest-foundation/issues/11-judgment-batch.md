# 11. 판정 배치: 평소가와 시세로 판정 묶음을 만들어 바꿔 끼우기

Status: resolved
Type: task
Blocked by: -

## 목적

화면은 `price.current_judgment`만 읽는다 (pipeline.md 4-3, 06 Answer). 그런데 판정 행을 쓰는 코드는 샘플용 `packages/price-db/src/aggregate.ts`(`trigger = 'fixture'`)뿐이라 운영 DB의 `judgment_snapshot`·`current_judgment`는 0행이다 (2026-10-30 확인: `daily_quote` 160,713행, `usual_price` 12,541행, 활성 품종 133개). 이대로 `supabase-source.ts`를 붙이면 가격 화면에 아무것도 나오지 않는다.

이 티켓은 수집 패키지에 판정 배치를 더해, 평소가 계산(`usual`)이 끝날 때마다 판정 묶음을 새로 만들고 포인터를 바꾼다. 웹앱 연결(`supabase-source.ts`, 캐시, 갱신 신호)은 다음 티켓이다.

## 이미 있는 재료

판정 숫자는 거의 다 `usual` 명령이 계산해 두었다. 배치는 계산을 다시 하지 않고 모아서 옮긴다.

| 화면 필드 (`VarietyDetail`) | 읽을 곳 |
|---|---|
| `price`, `surveyedOn`, `sampleSize`, `meetsMinN`, `stale` | `daily_quote` 소매 `national`의 가장 최근 행 (`value`, `obs_date`, `n`, `meets_min_n`, `stale_days`, judgment.md 6-3) |
| `usual` | `usual_price`의 그 규격 가장 최근 행 `value` |
| `verdict.pct` | 같은 행 `components.deviation` × 100 (최근 3 조사일 편차의 중앙값, judgment.md 2장). 그날 하루 시세로 다시 내지 않는다 |
| `band` | 같은 행 `components.band` (`low`·`high`, 백분위 20%, ±5~25%) |
| `verdict.kind` | `pct`를 `band`에 견줘 정한다. `usual_price` 행이 없으면 `none`(판정 전, judgment.md 3장) |
| `priceSpread` | 카탈로그 `spread: brand` (쌀 등, judgment.md 5-3) |
| `range` | 그날 `daily_quote` 시장 표본의 최소·최대·수 (KAMIS 관측값) |
| `marketTypes` | `daily_quote` `market_type:*` 범위 |
| `places` | 그날 KAMIS 시장별 관측값. 대형마트는 체인 기호로 묶는다 (`PlaceQuote` 주석) |
| `trend` | 최근 6개월 `daily_quote` `national` + 같은 날의 `usual_price` |
| `shelf` | 참가격 `shelf_price` (`channel:*`, 판매처별). 판매가가 없는 품종은 null |
| `basis` | 출처와 범위 ("KAMIS" / "전국 조사 시장", 축평원 규격은 "축평원" / "전국 평균") |

## 정할 것 (2026-10-30 운영자: 셋 다 추천대로)

- [x] **payload 모양**: pipeline.md 4-1의 JSON은 화면을 만들기 전에 쓴 예시라 지금 화면 계약(`packages/price/src/types.ts`의 `VarietyDetail`)과 필드가 다르다 (`judgment.label`, `confidence.level` 등은 화면이 쓰지 않는다, judgment.md 6-3 "신뢰도는 점수로 만들지 않는다"). **추천: payload를 `VarietyDetail` 그대로 쓰고, 4-1을 그 타입을 가리키도록 고친다.** 그러면 `supabase-source.ts`의 `getVariety`가 옮겨 담기 없이 payload를 돌려준다.
- [x] **예상(`forecast`)**: "평년 흐름으로 본 예상" 계산은 아직 어디에도 없다. 추천: 이 티켓에서는 빈 배열로 두고(화면은 빈 배열을 이미 처리한다) 따로 티켓을 연다. 수준 × 앞날의 계절비율로 낼 수 있지만, 폭(low·high)을 정한 적이 없다.
- [x] **판정 하나로 볼 규격**: `judgment_snapshot`의 키는 품종 × 규격이다. 목록(`listVarieties`)은 품종마다 한 행이므로, 품종의 대표 규격 하나만 고를지 규격마다 행을 둘지. 카탈로그의 대표 규격(primary) 표시가 있으면 그것을 따른다.

## 할 일

- [x] `packages/price-ingest/src/judgment/`: 순수 함수 `buildJudgment(입력) → { row, payload }`를 테스트부터 (`*.test.ts`). 판정 전, 표본 부족, 갱신 지연, 판매가 없음, 쌀(`spread: brand`)을 각각 확인한다
- [x] 판정 이름 맞추기: DB check는 `cheap · normal · expensive`, 화면 타입은 `cheap · normal · pricey · none`. 배치가 옮긴다 (`none`은 DB `verdict = null`). 어느 한쪽 이름을 바꾸지는 않는다
- [x] 명령 `pnpm --filter @workspace/price-ingest judgment [--dry-run]`: `judgment_batch`(`building`) → 활성 품종의 `judgment_snapshot` 쓰기 → 검사 → `ready` → `judgment_current` 포인터 교체. 검사에 걸리면 `failed`로 남기고 포인터는 그대로 둔다
  - 검사: 활성 품종 중 행이 생긴 비율이 직전 묶음보다 크게 줄지 않았는지, `payload`가 `VarietyDetail` 모양인지
  - 오래된 묶음 정리: `ready` 최근 몇 개만 남기고 지운다 (`on delete cascade`)
  - advisory lock (`recompute:judgment`), 같은 날 다시 돌려도 결과가 같다
- [x] 워크플로: `ingest-kamis.yml`·`ingest-ekape.yml`의 `usual` 다음 단계, 참가격 워크플로의 적재 다음 단계에서 부른다. 실패하면 기존 알림(ingest-schedule/13)에 걸린다
- [x] `aggregate.ts`의 샘플 판정도 같은 `buildJudgment`를 쓰게 바꿔, 샘플과 운영이 같은 모양을 쓰게 한다
- [x] 운영 적용: 명령을 한 번 돌리고 행 수와 판정 비율을 이 파일에 적는다

## 완료 기준

- 운영 DB `current_judgment`에 활성 품종의 판정 행이 있다. 축산 대표 규격(축평원 이력 3개월)은 축평원 백필이 끝나는 11-09 무렵까지 판정 전(`verdict = null`)이어도 된다 (judgment.md 7장)
- 판정 비율이 judgment.md 6-2의 운영 판정(싸요 27 · 보통 56 · 비싸요 20, 규격 103개)과 크게 다르지 않다. 다르면 이유를 적는다
- 정기 수집 한 번이 끝난 뒤 새 묶음이 저절로 생기고 포인터가 바뀐다
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm db:test` 통과

## 다음

- `supabase-source.ts`와 `getPriceSource()` 교체, 품종별 `cacheTag`, 갱신 엔드포인트(06 "아직 열림"). 이 티켓이 끝나면 연다
- 예상(`forecast`) 계산 (위 "정할 것")

## Answer (2026-10-30)

- **payload = `VarietyDetail`**. pipeline.md 4-1을 예시 JSON에서 필드별 읽는 곳 표로 바꿨다. 예상(`forecast`)은 빈 배열. 규격은 `spec.is_default`.
- **순수 함수** `src/judgment/build.ts` `buildJudgment(input, { staleDays })` → `{ row, payload }` (테스트 11개, `test/judgment-build.test.ts`). 판정은 `components.deviation`을 정수 %로 바꿔 `components.band`(정수 %)에 견준다. 같은 규칙을 화면과 나누려고 `@workspace/price/verdict`에 `verdictOfPct`를 더하고 `verdictOf`가 그것을 부르게 했다. 평소가 행이 시세 조사일 것이 아니거나 deviation · band가 없으면 판정 전이고, 그때는 추이의 평소가도 비운다.
- **갱신 지연에 하나를 더했다**: 조사일이 전체 최근 조사일보다 7일(`ekape.carried_over_days`) 이상 앞이면 `stale`. 철이 지나 조사가 멈춘 품종(체리 · 참외 · 복숭아 9-23)이 오늘 값처럼 보이지 않게 한다 (judgment.md 6-3에 적음).
- **명령** `src/judgment/cli.ts` `judgment [--trigger] [--dry-run]`: 묶음 `building` → 행 쓰기 → 검사(행 0개, 또는 지금 묶음보다 20% 넘게 줄면 `failed`, 포인터 그대로, 종료 코드 1) → `ready` + 포인터 교체 → 최근 7개 묶음만 남김. advisory lock `recompute:judgment`. DB 테스트 3개 (`test/db/judgment.db.test.ts`).
- **워크플로**: KAMIS는 평소가 다음, 축평원은 수집 뒤 평소가(최근 7일) + 판정(KAMIS 06:30이 먼저 돌아 축평원 그날 시세의 평소가가 비어서), 백필이 끝난 실행은 평소가 6개월 다음, 참가격은 적재 다음. 축평원 백필 잡의 조건을 `needs.ingest.result == 'success'`에서 수집 단계 종료 코드 `0`으로 바꿨다(뒤 단계 실패로 백필이 멈추지 않게). 축평원 · 참가격 알림도 KAMIS처럼 "수집 성공 · 잡 실패"를 예상하지 못한 실패(9)로 알린다.
- **샘플**: `price-db` `aggregate.ts`의 판정 묶음이 같은 `writeJudgment`를 쓴다. 간이 평소가 가장 최근 행에 그날 편차와 ±10% 구간을 넣는다. `pnpm db:test` 210개 통과, 샘플 판정 7행.
- **운영 적용** (묶음 2, `trigger manual`): 행 127 (활성 133 중 소매 national 시세가 없는 6개는 행 없음), **싸요 23 · 보통 41 · 비싸요 15 · 판정 전 48**. 판정 79개 비율 29 · 52 · 19%로 judgment.md 6-2(27 · 56 · 20, 규격 103개 기준 26 · 54 · 19%)와 비슷하다. `web_reader`로 127행 읽힘. 표 크기 376kB(묶음 하나, payload 합 약 1MB 원문).
  - 판정 전 48개: 축평원 시세 품종 20개 전부(이력 3개월, 11-09 무렵 백필 뒤 풀림)와 KAMIS 28개. KAMIS 쪽은 평소가 명령이 판정 전으로 둔 규격(사과 · 감귤 · 단감 · 포도 · 우유 · 가지 등, judgment.md 3장 · 5-2), 대표 규격이 아닌 규격에만 평소가가 있는 품종(계란: 기본 `regular` 없음, `graded` 있음).
  - 갱신 지연 8개: 체리 · 참외 · 복숭아(9-23), 거봉(10-22), 연안 오징어(10-19), 수입 소고기 3개(같은 값 7일 이상).

### 남은 것 / 운영자가 볼 것

- **판정 %와 화면의 두 숫자가 어긋날 수 있다.** 판정 차이가 최근 3 조사일 편차의 중앙값이라, 시세가 하루에 크게 뛰면 화면의 시세 · 평소가로 보이는 차이와 다르다. 예: 배추 10-29 시세 4,880 · 평소가 4,638(+5%)인데 판정 차이는 −12%(10-27 −12%, 10-28 −15%, 10-29 +5%의 중앙값). 화면이 "평소보다 12% 싸요"를 쓰면 숫자끼리 틀려 보인다. 웹앱 연결 전에 화면 문구를 정한다.
- 계란 · 사과처럼 많이 찾는 품종이 판정 전이다. 계란은 대표 규격을 `graded`로 바꿀지, 사과는 평소가 명령이 왜 판정 전으로 두는지(철마다 바뀌는 규격 코드인지) 따로 본다.
- 목록 근거 문구 `LIST_BASIS`("KAMIS 전국 조사 시장" 고정)가 축평원 시세 품종에는 틀린다. 웹앱 연결 때 고친다.
- 다음 티켓: `supabase-source.ts` · `getPriceSource()` 교체 · 품종별 `cacheTag` · 갱신 엔드포인트 (06 "아직 열림"), 예상(`forecast`) 계산.
