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

## jangbol-growth/06에서 옮긴 질문 (2026-11-27)

[제철·가격 대응과 가격 허브의 연결 범위](../../jangbol-growth/issues/06-link-coverage.md)를 이 티켓으로 합쳤다.

- 실제 카탈로그를 대조해 제철 품종을 대응 가능 / 모호 / 미대응으로 나눈다. 이름 · slug가 같다는 이유만으로 원산지 · 규격 차이를 지우지 않는다.
- 제철 품종 하나에 시세 품종이 여럿이거나 없을 때의 링크와 설명.
- 제철 링크로 닿지 않는 시세 품종을 노출할 허브가 따로 필요한지, 검색 · 목록으로 충분한지.
