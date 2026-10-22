# 13. 원형 판 부품 + 월별 포스터 P-C 열두 달 원형 판

Status: ready-for-agent
Blocked by: 01
구성: `month-poster` · `wheel` (P-C)

## 목적

새 부품 **원형 판**(부채꼴 N개, 부채꼴마다 그림 몇 개)을 만들고, 월별 포스터에 `layout: "wheel"`(부채꼴 12개)로 쓴다. 이 부품은 S-C(14)도 쓴다(부채꼴 4개).

## 할 일

- [ ] 인터페이스를 먼저 정한다(`mattpocock-skills:codebase-design`). 부채꼴 경계·그림 위치 계산은 `packages/seasonal`의 순수 함수(테스트 먼저: 그림이 부채꼴 밖으로 나가지 않는다), 그리기는 `features/print/parts/`. 10의 막대표와 같은 경계 규칙을 따른다.
- [ ] 부채꼴마다 그림 수 상한(`foods.max`)과 달 이름 위치를 정한다. 가로 용지 처리를 정한다(와이어프레임은 세로만).
- [ ] 숨길 옵션: `grid`.
- [ ] **A4 한 장을 실제로 인쇄해 글자·그림 크기를 확인**하고 14로 간다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/month-poster.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: P-C를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
