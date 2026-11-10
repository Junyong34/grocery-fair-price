# 이유식 과일 시기 및 주의 식재료 도감 — 지도

Label: wayfinder:map
만든 날: 2026-11-10

## Destination

부모가 신생아 이유식(4~6개월)부터 24개월+까지 안심하고 과일을 먹일 수 있도록, 월령별 적정 과일과 필수 손질법(질식 예방), 그리고 돌 전후 주의 식재료(꿀, 생우유, 주스, 견과류 등)를 대시보드와 A4 냉장고 출력물로 제공한다.
기존 제철달력(`/seasonal`)의 '이번 달 제철 뱃지'와 시세(`/prices`), 그리고 이유식 궁합표(`/baby-food/pairings`)와 상호 연동한다.

## Notes

- **단위 작업 규칙**: 티켓 하나를 작업할 때마다 `Status: claimed`로 바꾸고 시작하며, 끝난 뒤 `Status: resolved` 및 결과를 기록한다.
- **테스트 주도 (TDD)**: 도메인 데이터와 순수 함수(`packages/seasonal/src/data/infant-fruits.ts`)는 `infant-fruits.test.ts`를 먼저 작성하고 통과시킨다.
- **품질 기준**: 모든 작업 종료 시 repo 루트에서 `pnpm typecheck`, `pnpm lint`(0 errors), `pnpm test`가 통과해야 한다.
- **반응형 검증**: 화면 구현 시 `375px`(모바일)과 `1280px`(데스크톱)에서 콘솔 오류나 가로 스크롤 깨짐 없이 동작해야 한다.
- **이미지 전략**: 이미 있는 27종의 SVG를 우선 재사용하고, 망고 등 없는 이미지는 점선 자리(fallback)를 두며 별도 티켓([05](issues/05-illustrations-backlog.md))으로 제작을 분리한다.

## Decisions so far

<!-- 닫힌 티켓마다 한 줄: [제목](링크): 답 요약 -->

- [기획 및 의학적 기준 확정 (Grill-Me)](../spec.md): 6단계 세분화, 관행+소아과 팩트 병기, 제철/시세 연동, 동적 경고 배너, A4 2종(세로/가로) 지원 합의.
- [01 도메인 데이터 스키마 및 순수 함수 TDD](issues/01-domain-data.md): `infant-fruits.ts` 6단계 월령, 21종 과일, 8종 주의 식재료 및 판정 순수 함수 구현, vitest 11개 통과.
- [02 라우트 및 SEO 색인 등록](issues/02-routes-and-seo.md): `/baby-food/fruits`, `/baby-food/fruits/[stage]` 라우트 및 `routes.ts`, `pages.ts` 등록, SEO 가드 테스트 통과.
- [03 UI 컴포넌트 및 인터랙션 구현](issues/03-fruits-ui-components.md): 탭바, 3단계 뱃지 카드, 동적 경고 배너, 바텀시트 상세 가이드, 하단 금지 도감 컴포넌트 구축.
- [04 A4 인쇄용 출력물(세로형/가로형) 및 어드민 연동](issues/04-print-editions.md): A4 1장 냉장고 부착용 템플릿(세로/가로), 로컬 어드민 미리보기 및 Headless Chrome PDF 생성기 연동.
- [05 일러스트 제작 백로그 및 플레이스홀더 처리](issues/05-illustrations-backlog.md): 망고 점선 플레이스홀더 및 포도/오렌지 임시 폴백 매핑, 신규 일러스트 체크리스트 정리.
- [06 전체 검증, 브라우저 실측 및 커밋](issues/06-verification-and-closeout.md): `pnpm typecheck`, `pnpm lint`, `pnpm test` 100% 통과 및 반응형 레이아웃 확인 완료.

## Frontier

- **모든 티켓 해결 완료 (Done)**
