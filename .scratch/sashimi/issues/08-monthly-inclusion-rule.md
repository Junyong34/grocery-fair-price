# 08. 제철 회 월별 포함 규칙

Status: needs-triage
Type: grilling
Blocked by: —

[jangbol-growth/07](../../jangbol-growth/issues/07-sashimi-consistency.md)에서 옮겼다(2026-11-27).

## 질문

제철 회 월별 목록을 무엇을 기준으로 만들 것인가: 품종의 제철 범위 겹침, 원자료의 추천 달, 대표 달 중 하나. 정한 규칙 하나로 12개월을 검증하고, 수동 목록과 예외(양식/자연산, 겨울 연도 경계, 근거 미확인 품종)를 어떻게 설명할지 정한다.

## 그 사이 바뀐 것

- 신규 횟감 추가(94c76c6), 보류 횟감 14개 작성(2ed1fc3), 18개 품종 제철 달 수정(f0e3a75) · 전복 · 참다랑어 등 수정(69c4bae).
- 근거 자료: [research-months.md](../research-months.md), [spec.md](../spec.md).

## 완료 기준

- 규칙 하나와 예외 표, 12개월 검증 사례. 순수 함수를 바꾸면 테스트를 먼저 쓴다.
