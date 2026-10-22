# 04. 월간 M-B 달력 옆 제철 체크 목록

Status: ready-for-agent
Blocked by: 01
구성: `monthly` · `side-check` (M-B)

## 목적

월간에 `layout: "side-check"`를 더한다. 그 달 품종 이름을 달력 오른쪽 세로 목록에 체크 칸과 함께 넣는다. 그림 수보다 많은 품종을 싣는다. 세로 용지만 쓴다.

## 할 일

- [ ] `layout`에 `side-check`. 가로 용지 처리를 정한다.
- [ ] 목록에 들어갈 품종: 그 달 품종 전체인지, 그림 있는 품종만인지 정한다(그림 없는 품종 이름을 넣으면 "그림보다 많은 품종"이 된다).
- [ ] 숨길 옵션: `memo`(체크 목록이 그 역할을 한다).

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/monthly.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: M-B를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
