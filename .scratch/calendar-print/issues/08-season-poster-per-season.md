# 08. 계절 포스터 S-D 계절마다 한 장(4쪽)

Status: ready-for-agent
Blocked by: 01
구성: `season-poster` · `per-season` (S-D)

## 목적

계절 포스터에 `layout: "per-season"`을 더한다. 계절마다 한 쪽, 한 PDF에 4쪽이다. 계절 하나에 판 전체를 쓰니 그림이 가장 크다.

## 할 일

- [ ] `pageCount`: `per-season`이면 4. `spec.test.ts`에 더한다.
- [ ] 생성기(`features/admin-print/server/generate.ts`)의 쪽 수 검사가 4쪽을 받아들이는지 본다.
- [ ] 다운로드 화면·매니페스트의 파일 이름과 설명(쪽 수 표시가 있으면)을 고친다. 월간 12개월 묶음과 같은 방식이면 그대로 쓴다.
- [ ] 계절마다 품종 수 차이가 커서 칸이 비거나 넘치는 계절이 없는지 본다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/season-poster.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: S-D를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.
