# 04. 월간 M-B 달력 옆 제철 체크 목록

Status: resolved
Blocked by: 01
구성: `monthly` · `side-check` (M-B)

## 목적

월간에 `layout: "side-check"`를 더한다. 그 달 품종 이름을 달력 오른쪽 세로 목록에 체크 칸과 함께 넣는다. 그림 수보다 많은 품종을 싣는다. 세로 용지만 쓴다.

## 할 일

- [x] `layout`에 `side-check`. 가로 용지 처리를 정한다.
- [x] 목록에 들어갈 품종: 그 달 품종 전체인지, 그림 있는 품종만인지 정한다(그림 없는 품종 이름을 넣으면 "그림보다 많은 품종"이 된다).
- [x] 숨길 옵션: `memo`(체크 목록이 그 역할을 한다).

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/monthly.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: M-B를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.

## Answer

2026-10-22 완료.

- 가로 용지: 파서가 거른다(그림·달력·목록 세 열이 되어 좁음). 세로 전용 구성은 `spec.ts`의 `PORTRAIT_ONLY` 표로 모았다(P-D의 따로 있던 `refine`도 여기로).
- 목록: 그 달 품종 전체(그림 없는 품종 포함, `monthChecklist`), 한 줄에 하나, 02의 `CheckList`를 쓴다. 폭 52mm, 제목 "이달의 제철". 가장 많은 달(11월 20개)에도 넘침 없이 9.1pt.
- 위 그림은 M-A 흩뿌림과 같다. 숨김: `memo`(인쇄도 무시).
- 확인: A4 세로 열두 달, 목록·달력 넘침 0(스크립트로 잼). 편집기에서 구성을 바꾸면 "달력 아래"가 사라지고 미리보기가 바뀜, 콘솔 오류 없음. A3는 보지 않았다.
- `monthly.tsx`에 prettier를 돌리면 저장소 설정(80자)으로 파일 전체가 바뀐다. 인쇄 파일들은 그 형식이 아니라서 돌리지 않았다.
