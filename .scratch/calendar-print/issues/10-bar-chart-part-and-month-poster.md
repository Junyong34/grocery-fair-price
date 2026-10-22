# 10. 막대표 부품 + 월별 포스터 P-B 품종×달 막대표

Status: ready-for-agent
Blocked by: 01
구성: `month-poster` · `chart` (P-B)

## 목적

새 부품 **제철 막대표**(행 = 품종, 열 = 1~12월, 제철 달을 막대로)를 만들고, 월별 포스터에 `layout: "chart"`로 쓴다. 이 부품은 Y-C(11), C-3(12)도 쓴다.

## 할 일

- [ ] 인터페이스를 먼저 정한다(`mattpocock-skills:codebase-design`). 경계: 행 배치·막대 위치 계산은 `packages/seasonal`의 순수 함수(테스트 먼저), 그리기는 `apps/web/features/print/parts/`. `wireframe-shapes.ts`의 막대표 도형과 계산을 나눠 쓸 수 있는지 본다(와이어프레임은 어드민 기능이므로 인쇄 부품이 어드민을 import하지 않게 한다. 나눠 쓴다면 아래 층으로 옮긴다).
- [ ] 행 순서(카테고리별, 제철 시작 달 순 등)와 그림 아이콘을 행 앞에 둘지 정한다.
- [ ] 품종이 많아(67개) A4 한 장에 들어가는지, `foods.max`·`categories`로 줄이는지 정한다. 숨길 옵션: `grid`.
- [ ] **A4 한 장을 실제로 인쇄해 글자 크기를 확인**하고 11·12로 간다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/month-poster.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: P-B를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
