# 08. 계절 포스터 S-D 계절마다 한 장(4쪽)

Status: resolved
Blocked by: 01
구성: `season-poster` · `per-season` (S-D)

## 목적

계절 포스터에 `layout: "per-season"`을 더한다. 계절마다 한 쪽, 한 PDF에 4쪽이다. 계절 하나에 판 전체를 쓰니 그림이 가장 크다.

## 할 일

- [x] `pageCount`: `per-season`이면 4. `spec.test.ts`에 더한다.
- [x] 생성기(`features/admin-print/server/generate.ts`)의 쪽 수 검사가 4쪽을 받아들이는지 본다.
- [x] 다운로드 화면·매니페스트의 파일 이름과 설명(쪽 수 표시가 있으면)을 고친다. 월간 12개월 묶음과 같은 방식이면 그대로 쓴다.
- [x] 계절마다 품종 수 차이가 커서 칸이 비거나 넘치는 계절이 없는지 본다.

## 흐름

1. `packages/seasonal/src/print/spec.ts`·`spec.test.ts`: 값을 더하고 테스트를 먼저 쓴다.
2. `apps/web/features/admin-print/editor/option-fields.ts`·`option-fields.test.ts`: 선택지를 더하고, 이 구성에 해당하지 않는 옵션을 숨긴다.
3. `apps/web/features/print/season-poster.tsx`
4. `apps/web/features/admin-print/lib/wireframe-catalog.ts`: S-D를 `available`로 바꾸고 `options`를 실제 값으로 고친다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 이 구성 한 쪽을 스크린샷으로 확인. A3도 한 번 본다.
- `/admin` 편집기에서 이 구성을 고르면 미리보기가 바뀌고 콘솔 오류가 없다.

## Answer

2026-10-23 완료.

- `pageCount`: `per-season`이면 4(`SEASONS.length`). 생성기(`checkPdf`)는 `pageCount`로 쪽 수를 검사하므로 고칠 것이 없었다. 편집기에서 PDF를 만들어 A4·A3 모두 4쪽, 쪽 크기 맞음을 확인했다.
- 다운로드 화면·매니페스트에는 쪽 수 표시가 없고 파일 이름은 에디션 id·용지라 그대로 둔다.
- 한 장: 큰 계절 이름(영문 표기 켜면 위에 작게), 오른쪽에 그 계절 달(겨울은 12 · 1 · 2월), 계절색 줄, 판 전체 줄 맞춤 그림, 발에 제목과 쪽 번호. 바탕 `season`은 장마다 그 계절색.
- 품종 수: 그림 있는 품종 봄 12, 여름 19, 가을 26, 겨울 10. 그림 크기는 장마다 판에 맞춘다(네 칸을 맞추던 S-A·S-B와 다르다). 봄·겨울은 그림이 폭에 막혀 판 아래위가 비어, 줄 사이를 넓혀(`align-content: space-evenly`) 판 높이를 채웠다. `foods.max` 기본 24면 가을은 24개, 30이면 26개 전부 들어간다.
- 숨는 옵션 없음.
- 확인: A4 세로·가로(계절색 바탕), A3 세로 네 쪽 모두 판 넘침 0, 여백 밖 0. 편집기에서 구성을 고르면 미리보기가 4쪽(봄·여름·가을·겨울)으로 바뀜, 콘솔 오류 없음. 확인용 에디션과 PDF는 지웠다.

