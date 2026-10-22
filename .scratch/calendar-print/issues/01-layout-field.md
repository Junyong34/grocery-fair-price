# 01. 구성(layout) 필드와 예전 에디션 호환

Status: ready-for-agent
## 목적

spec "구성(layout) 늘리기"의 결정대로 종류마다 `layout` 필드를 만든다. 이 티켓에서는 **지금 있는 모양만** 값으로 둔다. 새 안은 다음 티켓들이 하나씩 더한다.

## 할 일

- [ ] `spec.ts`
  - 월간: `foodLayout`을 `layout: "scatter" | "grid" | "none"`으로 바꾼다. `cover: boolean`을 `cover: "none" | "year"`로 바꾼다.
  - 연간 한 장 `layout: "pairs"`, 계절 포스터 `layout: "bands"`, 월별 포스터 `layout: "cells"`. 모두 `.default()`.
  - 읽을 때 옮기기: 월간에 `foodLayout`만 있으면 `layout`으로, `cover: true/false`는 `"year"/"none"`으로. `z.preprocess`나 같은 효과의 방법으로 하고, 파서 밖의 코드는 새 모양만 본다.
  - `DEFAULT_SPECS`, `pageCount`(`cover !== "none"`)를 고친다.
- [ ] `spec.test.ts`: 예전 모양 JSON(1차 구현 때의 `DEFAULT_SPECS` 그대로)을 읽으면 새 모양이 되는지, 새 모양은 그대로 읽히는지, 없는 `layout` 값은 거부되는지.
- [ ] `edition.test.ts`: 예전 에디션 JSON이 읽히는지.
- [ ] `option-fields.ts`: 종류마다 맨 앞에 "구성" 섹션(`layout` 선택)을 둔다. 월간 표지는 토글 대신 선택. 고른 `layout`에 따라 필드를 숨기는 장치를 만든다(예: 필드에 `when?: (spec) => boolean`). 지금 쓰는 곳: 월간 `layout: "none"`이면 품종 개수·이름 숨김.
- [ ] `option-field.tsx`·`options-panel.tsx`: 숨김 반영.
- [ ] `features/print/monthly.tsx`: `spec.layout`·`spec.cover`를 읽게 고친다.
- [ ] `wireframe-catalog.ts`: `options` 문자열을 새 이름으로(`foodLayout` → `layout`, C-1 `cover: "year"`).
- [ ] spec "1차 구현에서 달라진 점"의 `foodLayout` 줄에 바뀐 이름을 적는다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `apps/web/print-editions/`에 있는 에디션이 모두 열리고, 미리보기가 바뀌기 전과 같다(바뀌기 전 스크린샷과 비교).
- 예전 에디션은 "다시 생성 필요"로 보인다(해시가 바뀜, spec "예전 에디션 호환"). 다시 생성해 PDF 쪽 수가 맞는지 본다.
