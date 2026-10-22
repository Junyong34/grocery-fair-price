# 01. 구성(layout) 필드와 예전 에디션 호환

Status: resolved
## 목적

spec "구성(layout) 늘리기"의 결정대로 종류마다 `layout` 필드를 만든다. 이 티켓에서는 **지금 있는 모양만** 값으로 둔다. 새 안은 다음 티켓들이 하나씩 더한다.

## 할 일

- [x] `spec.ts`
  - 월간: `foodLayout`을 `layout: "scatter" | "grid" | "none"`으로 바꾼다. `cover: boolean`을 `cover: "none" | "year"`로 바꾼다.
  - 연간 한 장 `layout: "pairs"`, 계절 포스터 `layout: "bands"`, 월별 포스터 `layout: "cells"`. 모두 `.default()`.
  - 읽을 때 옮기기: 월간에 `foodLayout`만 있으면 `layout`으로, `cover: true/false`는 `"year"/"none"`으로. `z.preprocess`나 같은 효과의 방법으로 하고, 파서 밖의 코드는 새 모양만 본다.
  - `DEFAULT_SPECS`, `pageCount`(`cover !== "none"`)를 고친다.
- [x] `spec.test.ts`: 예전 모양 JSON(1차 구현 때의 `DEFAULT_SPECS` 그대로)을 읽으면 새 모양이 되는지, 새 모양은 그대로 읽히는지, 없는 `layout` 값은 거부되는지.
- [x] `edition.test.ts`: 예전 에디션 JSON이 읽히는지.
- [x] `option-fields.ts`: 종류마다 맨 앞에 "구성" 섹션(`layout` 선택)을 둔다. 월간 표지는 토글 대신 선택. 고른 `layout`에 따라 필드를 숨기는 장치를 만든다(예: 필드에 `when?: (spec) => boolean`). 지금 쓰는 곳: 월간 `layout: "none"`이면 품종 개수·이름 숨김.
- [x] `option-field.tsx`·`options-panel.tsx`: 숨김 반영.
- [x] `features/print/monthly.tsx`: `spec.layout`·`spec.cover`를 읽게 고친다.
- [x] `wireframe-catalog.ts`: `options` 문자열을 새 이름으로(`foodLayout` → `layout`, C-1 `cover: "year"`).
- [x] spec "1차 구현에서 달라진 점"의 `foodLayout` 줄에 바뀐 이름을 적는다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `apps/web/print-editions/`에 있는 에디션이 모두 열리고, 미리보기가 바뀌기 전과 같다(바뀌기 전 스크린샷과 비교).
- 예전 에디션은 "다시 생성 필요"로 보인다(해시가 바뀜, spec "예전 에디션 호환"). 다시 생성해 PDF 쪽 수가 맞는지 본다.

## Answer

2026-10-22 완료.

- `spec.ts`: 종류마다 `layout`(월간 `scatter|grid|none`, 연간 `pairs`, 계절 `bands`, 월별 `cells`, 뒤 셋은 `.default()`), 월간 `cover: "none" | "year"`. 예전 모양은 `migrateLegacy`가 `z.preprocess`로 옮긴다(파서 전체에 건다). 테스트에 1차 구현 때 모양(`LEGACY`)을 고정값으로 둠.
- `option-fields.ts`: 종류마다 첫 섹션 "구성"(`layout`, 월간은 표지 선택도 여기). 숨김은 필드의 `when?: (spec) => boolean`과 `isFieldShown`. `options-panel.tsx`가 숨긴 필드를 빼고, 필드가 모두 빠진 섹션은 탭째 뺀다. 지금 쓰는 곳: 월간 `layout: "none"`이면 품종 탭이 사라진다.
- 다음 티켓이 할 일: 값을 더할 때 `layout` enum, `DEFAULT_SPECS`는 그대로, `layout(...)` 선택지에 이름, 해당 없는 옵션에 `when`. option-fields 테스트가 "기본 사양에서는 모든 필드가 보인다"를 보므로 `when`은 기본값에서 참이어야 한다.
- 확인: 예전 모양 사양을 `/print`에 그대로 넣어 13쪽(표지 + 12달), 줄 맞춤으로 나옴. 예전 모양 에디션 파일(임시, 지움)을 편집기에서 열면 구성 "줄 맞춤"·표지 "큰 연도"로 읽힘. 콘솔 오류 없음. 저장된 에디션이 없어(`print-editions/`는 `.gitkeep`뿐) 다시 생성할 것은 없었다.
- 3123번 대신 이미 떠 있던 3000번 개발 서버를 썼다.
