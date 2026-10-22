# 02. 월별 포스터 P-D 한 줄에 한 달, 장보기 체크

Status: ready-for-agent
Blocked by: 01
구성: `month-poster` · `rows-check` (P-D)

## 목적

월별 포스터에 `layout: "rows-check"`를 더한다. 달마다 한 줄: 큰 숫자, 그림 다섯 개, 이름과 체크 칸. 세로 용지만 쓴다.

## 할 일

- [ ] `layout`에 `rows-check`. 가로 용지면 어떻게 할지 정한다(와이어프레임은 세로만. 파서가 거르거나 세로로 그린다).
- [ ] 그림 다섯 개를 넘는 품종은 이름 목록에만 넣는다. 체크 칸은 빈 네모로 인쇄한다(`memo: "eaten-check"`와 같은 생각).
- [ ] 숨길 옵션: `grid`.
- [ ] 기존 부품(`parts/food-area.tsx`의 줄 맞춤, 이름 목록)으로 만든다. 새 부품이 필요하면 이 화면 파일 안에 둔다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/month-poster.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: P-D를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
