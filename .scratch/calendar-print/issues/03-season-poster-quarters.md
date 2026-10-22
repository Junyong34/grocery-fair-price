# 03. 계절 포스터 S-B 사분면(세로) / 네 열(가로)

Status: resolved
Blocked by: 01
구성: `season-poster` · `quarters` (S-B)

## 목적

계절 포스터에 `layout: "quarters"`를 더한다. 세로 용지는 2×2 사분면, 가로 용지는 계절마다 한 열이다. 가로 열은 그림 아래에 그림 없는 품종 이름까지 적는다(와이어프레임 S-B).

## 할 일

- [x] `layout`에 `quarters`.
- [x] 계절 칸 안의 그림 배치는 지금 띠(`bands`)와 같은 부품을 쓰고, 칸 비율만 바꾼다.
- [x] 인쇄물에는 그림 있는 품종(`isDrawn`)만 넣는다는 규칙과, 가로 열의 "그림 없는 품종 이름"이 부딪친다. 이름만 적는 것은 괜찮은지 정하고 spec "종류별 레이아웃 메모"에 적는다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/season-poster.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: S-B를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽 (세로·가로)을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.

## Answer

2026-10-22 완료.

- 그림 없는 품종 이름은 넣지 않았다(인쇄물에는 그림 있는 품종만이라는 원칙 유지). 와이어프레임 S-B의 이름 목록도 지웠다. spec "종류별 레이아웃 메모"에 적음.
- `season-poster.tsx`: 띠와 사분면을 같은 코드로 그린다(`arrangement`가 열·행·안쪽 여백을 낸다). 사분면·열은 칸에 테(hairline)와 3mm 안쪽 여백. 네 칸의 그림 크기는 가장 많은 계절(가을, 기본 상한 24)에 맞춘다.
- 확인: A4 세로(2×2)·가로(네 열) 스크린샷. A3는 보지 않았다.
