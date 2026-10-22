# 14. 계절 포스터 S-C 사계절 원형 판

Status: ready-for-agent
Blocked by: 01, 13
구성: `season-poster` · `wheel` (S-C)

## 목적

계절 포스터에 `layout: "wheel"`(부채꼴 4개)을 더한다. 13의 원형 판 부품을 쓴다.

## 할 일

- [ ] 13의 부품을 그대로 쓴다. 부채꼴이 커서 그림이 많이 들어가므로 배치가 고르게 되는지 본다.
- [ ] `seasonLabel` 위치(부채꼴 안 / 바깥 둘레)를 정한다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/season-poster.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: S-C를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
