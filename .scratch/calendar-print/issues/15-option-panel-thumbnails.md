# 15. 옵션 패널 구성 선택에 와이어프레임 썸네일

Status: resolved
Blocked by: 01

## 목적

편집기의 "구성" 선택(01에서 만든 `layout`·`cover` 선택)을 이름 목록 대신 `<Wireframe>` 썸네일 목록으로 보여 준다. 썸네일은 지금 고른 용지 방향으로 그린다.

## 할 일

- [x] `wireframe-catalog.ts`의 항목과 사양 값을 잇는 표를 만든다(코드에서 `kind` + `layout`/`cover` → 항목). `available`인 항목만 고를 수 있게 하고, `needs-option`은 보이지 않거나 "준비 중"으로 둔다. 표가 사양의 모든 값을 덮는지 테스트한다.
- [x] `option-field.tsx`에 썸네일 선택 필드 종류를 더한다(cojeev에 맞는 컴포넌트가 있으면 쓴다: radio card 류).
- [x] 키보드로 고를 수 있고, 썸네일마다 안 이름이 읽힌다.
- [x] 다른 티켓 진행 중에도 할 수 있지만, 새 안이 `available`이 될 때마다 썸네일이 자동으로 늘어나야 한다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/admin` 편집기를 375·1280 폭에서 열어 콘솔 오류·hydration 경고가 없다. 썸네일을 눌러 구성을 바꾸면 미리보기가 바뀐다.

## Answer

2026-10-23 완료.

- 표: 선택지(`Option`)에 `code`(와이어프레임 안)를 두고, 구성·표지 필드에 `wireframes: "sheet" | "cover"`를 단다(`option-fields.ts`). 한 안을 여러 값이 같이 쓴다(M-A = scatter·grid·none). 사양 쪽은 구성 값을 `LAYOUTS`·`MONTHLY_COVERS`로 내보내 스키마가 이것을 쓴다.
- 테스트(`option-fields.test.ts`): 종류마다 구성 선택지 = `LAYOUTS[kind]`, 값마다 같은 종류·같은 쪽의 `available` 안이 있음, `available`인 시트·표지 안은 모두 어느 선택지에서 고를 수 있음. 새 구성을 더하고 안을 `available`로 바꾸면서 코드를 빼먹으면 이 테스트가 막는다.
- 화면(`editor/wireframe-choice.tsx`): cojeev RadioGroup(card)로 썸네일 칸을 늘어놓는다. 썸네일은 지금 용지 방향으로 그리고, 그 방향이 없는 안(세로 전용)은 세로로 그려 "세로 용지만"을 붙인다. 같은 쪽의 `needs-option` 안은 뒤에 "준비 중"으로 덧붙이고 고를 수 없다. 화살표 키로 고르고, 칸마다 "코드 이름"(준비 중이면 "(준비 중)")이 읽힌다. 고른 칸은 금색 테두리·바탕, cojeev 동그라미 표시는 감춘다(`admin.css`).
- 확인: 1280·375 폭에서 콘솔 오류·hydration 경고 없음, 가로 넘침 없음(375는 2열). 썸네일 클릭·왼쪽 화살표로 구성을 바꾸면 미리보기가 바뀜(M-E → 블록 12장, M-D). 가로 용지로 바꾸면 썸네일이 가로로 그려짐. 처음 단 묶음 제목 `<label>`이 입력과 이어지지 않는다는 콘솔 안내가 떠 span으로 바꿨다. 확인용 에디션은 지웠다.

