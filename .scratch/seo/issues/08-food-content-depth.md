# 08. 품종 페이지 본문 보강

Status: needs-triage
Blocked by: —

## 문제

품종 데이터에는 이름, 별칭, 카테고리, 제철 달만 있다. 그래서 1i 페이지 79개가 거의 같은 틀이 된다. 구글의 helpful content 기준(E-E-A-T)으로 보면 "얇은 콘텐츠"로 판단될 위험이 있다. 이 문제는 기술 SEO(01~07)로는 해결되지 않는다.

## 정해야 할 것

- 무엇을 더 보여 줄지 정한다. 후보는 다음과 같다.
  - 고르는 법
  - 손질·보관
  - 대표 산지
  - 제철 기준의 출처(농정원 제철 농식품, 해수부 이달의 수산물 등)
- 데이터를 어디서 가져올지, 라이선스는 어떤지 확인한다. 참고: `grocery-price/docs/10-research/content-and-taxonomy.md`
- 문구를 누가 쓰고 누가 검수할지 정한다. 문구는 `packages/seasonal/src/data/copy.ts`에 둔다.
- 출처를 화면에 표기할 방식을 정한다.

## 메모

- 2026-10-16 SEO grilling에서 이번 SEO 범위 밖으로 분리했다(`../spec.md`).
