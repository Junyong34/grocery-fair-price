# 06. 월간 M-D 쓰는 달력: 큰 칸 + 그림 띠 두 줄 + 빈 칸 그림

Status: ready-for-agent
Blocked by: 01
구성: `monthly` · `strip` (M-D)

## 목적

월간에 `layout: "strip"`을 더한다. 달력 칸을 키워 일정을 적게 하고, 그림은 띠 두 줄(세로 14개, 가로는 왼쪽 열 12개)과 1일 앞·말일 뒤 빈 날짜 칸에 넣는다.

## 할 일

- [ ] `parts/print-calendar.tsx`: 빈 날짜 칸에 그림을 넣을 수 있게 한다(칸 위치 목록을 받는 쪽이 그림을 그리는 모양이 좋다). 빈 칸 위치 계산은 순수 함수로, 테스트 먼저.
- [ ] 품종 나누기: 띠에 먼저 채우고 남은 것을 빈 칸에. 2027년 기준 모든 달·주 시작(일/월)에서 그림 있는 품종이 모두 들어가는지 테스트한다(인계 문서에서 검산함: 빈 칸 0~11개 + 띠 14개 ≥ 달마다 7~19개).
- [ ] 큰 칸 달력: 칸에 쓸 자리가 생기도록 날짜를 칸 왼쪽 위에 둔다.
- [ ] 숨길 옵션: `memo`는 세로에서 메모 줄 두 줄로 고정할지 정한다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/monthly.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: M-D를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽 (세로·가로)을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
