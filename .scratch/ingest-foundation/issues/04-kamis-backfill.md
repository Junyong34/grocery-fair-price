# 04. KAMIS 5년 백필과 평년 계산 입력

Status: ready-for-agent
Type: task
Blocked by: 03

## 목적

평년(최근 5년 같은 시기 가격)을 직접 계산하려면 KAMIS 소매 5년 이력이 필요하다. KAMIS 자체 API(cert_key)는 키가 없어 쓰지 않는다 (`p2/05` wontfix).

## 할 일

- [ ] 받을 범위: 구분 01 소매, MVP 품목 전체, 최근 5년. 기간 제한은 없고 호출 수 = ceil(행 수/1000): 축산 외 품목당 5년 60~100회, 소 437회 ([kamis.md 8장](../../../grocery-price/docs/30-data/sources/kamis.md)). 동시에 여러 개 보내면 HTTP 504가 나므로 하나씩, 연 단위로 나눠 받는다
- [ ] 호출 수와 일일 한도(10,000) 계산, 며칠에 나눌지
- [ ] **적재 경로 (2026-10-20 결정, pipeline.md 3-9 보관 1).** 관측값 표를 거치지 않는다. 묶음(품목 × 연도)마다: 원본을 Storage에 올림 → `UNLOGGED` 표 `kamis_backfill_stage`에 `COPY` → 그 묶음 날짜로 `daily_quote`를 만듦 (정기 수집과 같은 집계 함수) → 최근 90일 행만 `observation`으로 옮김 → `truncate kamis_backfill_stage`. 묶음 진행은 `backfill_task`. 한 품종이 여러 품목 코드에서 오면(참다래 `419` → 키위 `437`) 같은 묶음으로
- [ ] 용량 감시: 묶음 시작 전에 `pg_database_size`를 보고 400MB를 넘으면 멈추고 알린다. 무료 500MB를 넘으면 DB가 읽기 전용이 된다 ([database-size](https://supabase.com/docs/guides/platform/database-size)). 관측값에 넣었다 `delete`하는 방식은 지운 자리가 돌아오지 않아 쓰지 않는다
- [ ] 축평원 백필은 행이 적어(5년 5만) 관측값에 바로 넣는다
- [ ] 품목별 이력 시작일 확인 (`p2/13`과 공유)
- [ ] 평년 정의 후보 정리: KAMIS 웹의 "평년"(최근 5년 중 최고·최저를 뺀 평균으로 알려짐, 확인 필요)과 같은 방식으로 맞출지 → 로드맵 ② 계산식의 입력
- [x] 축평원 과거 조회 범위 실측 (축평원은 평년을 응답에 같이 준다): 하루 단위, 전국 2012-06 이전부터, 시도 값 2022-01부터. 5년 백필 12,782회, 하루 예산 800으로 약 16일 ([ekape.md 10·11장](../../../grocery-price/docs/30-data/sources/ekape.md))
- [ ] 화면 차트는 1년까지만 쓴다. 5년 치는 평년 계산에만 쓴다

## 완료 기준

- MVP 품목의 5년 소매 이력이 `daily_quote`에 들어가 있고(관측값에는 최근 90일만), 빠진 기간이 목록으로 있다.
- 백필이 끝난 뒤 `kamis_backfill_stage`가 비어 있고 DB 크기가 3-9 추정 안이다.
