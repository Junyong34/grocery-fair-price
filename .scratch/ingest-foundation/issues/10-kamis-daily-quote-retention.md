# 10. KAMIS 일별 시세 재계산과 90일 보존 정리

Status: resolved
Type: task
Blocked by: 09, ingest-schedule/11

## 목적

KAMIS 관측값은 최근 90일만 남기고, 그보다 오래된 날은 일별 시세(`daily_quote`)로만 남긴다 (pipeline 3-9 보관 1, 6-1). 지우기 전에 그날의 `daily_quote`가 있어야 한다. 운영 DB에는 아직 KAMIS 관측값이 없어 `ingest-schedule/11`(KAMIS·축평원 정기 수집)이 먼저다.

## 할 일

- [x] 적재 뒤 그날의 `daily_quote`를 다시 계산하는 단계 (`recompute`의 첫 조각, 3-4). 대표값 계산식은 로드맵 ②가 정하므로 지금은 `calc_version`을 붙인 중앙값
- [x] 보존 정리: `daily_quote`가 있는 날 중 90일보다 오래된 KAMIS 관측값을 묶음 `delete`. 원본(Storage)은 지우지 않는다
- [ ] ~~보존 기간 밖 재등록~~ → `ingest-schedule/09`로 옮김. 매일·주간 수집은 D-14까지라 90일 밖 행이 오지 않는다. 재등록 감시가 생길 때 함께 만든다. 보존 기간 밖 재등록: KAMIS가 90일 밖 날의 값을 다시 올리면 원본에서 그날을 다시 계산한다 (pipeline 3-3, `ingest-schedule/09`와 함께 본다)
- [x] 실측: 정리 뒤 DB 크기

## Answer (2026-10-26)

- **일자 요약** `src/load/daily-quote.ts` `recomputeDailyQuote(tx, basis, dates, today)`, `calc_version = median-1` (대표값 계산식은 로드맵 ②가 정한다).
  - 시세(`quote`): KAMIS·축평원 중 매핑이 `mapped`·`primary`인 원천 키만. `national`은 시장 표본 전부 또는 전국 값(축산 시도 평균은 세지 않음), `market_type:<유형>`은 시장 표본만. 값은 중앙값, `n`은 관측 위치 수.
  - 판매가(`shelf_price`): 참가격. `national`, `channel:<업태>`. 행사(true)는 값에서 빼고 `promo_excluded_n`, `n`은 재등록 사슬(lineage) 점포 수. `seller:`·`region:` 범위는 07·이후.
  - 이상치·기준 단위 가격 없는 행은 세지 않는다. 날짜 하나를 다시 계산하면 그날 그 기준의 행을 새 결과로 맞춘다(없어진 품종·범위는 지움). **시세는 90일 밖 날을, 판매가는 관측값이 없는 날을 다시 계산하지 않는다** (지워진 날을 남은 행만으로 계산하면 집계가 망가진다). 기준별 advisory lock.
  - 수집 실행(`run.ts`)이 적재한 원본의 대상 기간을 다시 계산한다. 실패하면 부분(`load_failed`)으로 끝내고 다음 실행이 다시 한다. `catalog --mappings`도 다시 매핑 뒤 관측값이 있는 모든 날을 다시 계산한다.
- **보존 정리** 마이그레이션 `20261026000100_price_purge_guard.sql`: `purge_expired_observations`에 안전장치. KAMIS는 90일 밖이면서 그날 KAMIS 시세 요약이 있거나 대표로 집계될 KAMIS 행이 없는 날만, 참가격은 6 조사일 밖이면서 그 조사일의 상품 요약(`product_daily_summary`, 07)이 있는 날만 지운다. 그래서 **07 전에는 참가격을 지우지 않는다.** 명령 `pnpm --filter @workspace/price-ingest purge [--dry-run]`, KAMIS 워크플로 월요일 실행 끝에 `보존 정리` 단계.
- **운영 적용 (2026-10-26)**: `supabase db push --db-url`(소유자, 출력 가림)로 마이그레이션. `catalog --mappings`로 일자 요약 시세 545행·판매가 335행. 예: 2026-10-23 배추 상품 1포기 전국 4,500원(시장 45곳)·전통시장 5,000·대형유통 3,900, 사과 상품 1개 2,000원, 삼겹살 100g 2,914원(축평원). `purge --dry-run`: 지울 것 없음(KAMIS는 10/23부터라 2027-01-21쯤 처음 지운다). DB 71MB.
- 남은 것: 보존 기간 밖 재등록 복원(ingest-schedule/09), 5년 백필(04)은 같은 계산 함수를 임시 표에 쓰도록 바꿔야 한다(지금 백필 코드는 price-db 샘플용 간이 계산).
