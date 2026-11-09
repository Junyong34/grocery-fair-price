# 11. 식재료 규격별 판정

Status: needs-triage
Type: task
Blocked by: 04

[catalog-evolution/plans/01](../../catalog-evolution/plans/01-classification-and-search.md)을 이어 받는다. 내용은 그 문서를 따르고, 카탈로그를 코드가 아니라 DB에서 읽는 점만 다르다.

## 요약

- 판정이 품종마다 기본 규격 하나뿐이다(`judgment/cli.ts`의 `s.is_default` 조인, 평소가의 `variety_id` 단독 키, 웹 `get-variety.ts`의 `limit 1`). 이미 수집되는 규격(냉동 꽃게, 시금치 중품 등)이 화면에 없다
- 판정 단위를 품종 × 규격으로, 검색은 품종 아래 규격 행, URL은 규격 경로
- 판정 행이 136 → 최대 200(지금 기준), 카탈로그가 늘면 더 는다

## 완료 기준

- catalog-evolution/01의 완료 기준.
