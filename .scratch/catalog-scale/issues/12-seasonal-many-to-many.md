# 12. 제철 품종과 시세의 다대다 연결

Status: needs-triage
Type: task
Blocked by: 11

[catalog-evolution/plans/04](../../catalog-evolution/plans/04-seasonal-mapping.md)를 이어 받는다.

## 요약

- 웹 `priceVarietyPath()`가 제철 ID와 같은 문자열의 시세 품종만 찾아, '마늘 → 깐마늘(국산)'처럼 ID가 다른 연결은 링크가 없다
- 제철 ID 목록을 판정 payload에 싣고, 대상이 여럿이면 제철 상세에 목록을 보여 준다
- 제철 매핑도 어드민(07)에서 고친다

## 완료 기준

- catalog-evolution/04의 완료 기준.
