# 02. 저장소 결정

Status: resolved
Type: grilling

## 목적

통합 데이터와 원본(raw)을 **어디에 저장하고 어떻게 읽을지** 정한다. 2026-10-19 ADR 0002로 정했다.

## 입력 사실

- 데이터 규모는 크지 않다. 용량 추정은 pipeline.md 2장.
- 쓰기는 하루 몇 번의 배치뿐이고, 읽기는 사용자 요청이다.
- 판정에 필요한 질의: 품종별 최근 N주 중앙값, 같은 달 예년 가격, 최저·최고. 이 질의가 쉬운지가 선택 기준이다.

## 결정할 것

- [ ] raw와 정규화 데이터의 저장 위치를 같이 둘지 분리할지
- [ ] 판정에 필요한 질의를 이 저장소에서 어떻게 계산할지
- [ ] 월 비용 상한
- [ ] 백업·재구축: raw에서 정규화를 다시 만들 수 있는지

## 완료 기준

- 선택과 이유가 ADR(`grocery-price/docs/adr/0002-...`)로 기록되어 있다.
- 통합 스키마(01)가 이 선택으로 깨지는 부분이 없는지 확인했다.

## Answer

**Supabase Postgres(정제 데이터) + Supabase Storage(원본, gzip) + GitHub Actions(수집).** [ADR 0002](../../../grocery-price/docs/adr/0002-supabase-and-github-actions.md) (2026-10-19, 사용자 결정).

- raw와 정규화 데이터: 같은 Supabase 프로젝트 안에서 Storage와 Postgres로 나눈다.
- 판정 질의: Postgres SQL (pipeline.md 3-4 집계 테이블).
- 월 비용: 무료 플랜 안에서 시작.
- 백업·재구축: Storage 원본에서 다시 만들 수 있다. 주 1회 `pg_dump` (pipeline.md 5-3-1).
- 정적 JSON 게시(GitHub Pages), SQLite는 고르지 않았다.
