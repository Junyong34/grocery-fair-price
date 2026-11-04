# 제철 회 목록의 월별 포함 기준과 근거

Parent: ../map.md
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: open
Assignee: —
Blocked by: —

## Question

제철 회 월별 목록은 음식의 제철 범위, 원자료의 추천 월, 대표 달 중 무엇을 기준으로 생성해야 하며, 예외는 어떻게 설명하는가?

- sashimi.ts는 모든 품종을 대표 달 하나에 배정하는 단일 구조가 아니다. 수동 월별 목록과 추가 품종·제철 수정 예외가 있으므로 원안의 문제 설명부터 구분한다.
- 제철 범위 겹침을 채택할 때 회로 먹는 대상 집합, 겨울의 연도 경계, 양식/자연산 차이, 근거 미확인 품종의 취급을 정한다.
- 11월 방어·광어 노출은 회귀 예시로 검토하되 두 사례만 맞춰 전체 12개월의 정합성을 판단하지 않는다.
- 기존 .scratch/sashimi/spec.md, research-months.md와 seafood-content 근거를 재사용하고 모순을 기록한다.

완료 산출물: 단일 포함 규칙·예외·근거 표기·12개월 검증 사례. 순수 함수 변경은 이후 구현에서 테스트 먼저 작성한다.
