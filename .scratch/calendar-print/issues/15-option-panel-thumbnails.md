# 15. 옵션 패널 구성 선택에 와이어프레임 썸네일

Status: ready-for-agent
Blocked by: 01

## 목적

편집기의 "구성" 선택(01에서 만든 `layout`·`cover` 선택)을 이름 목록 대신 `<Wireframe>` 썸네일 목록으로 보여 준다. 썸네일은 지금 고른 용지 방향으로 그린다.

## 할 일

- [ ] `wireframe-catalog.ts`의 항목과 사양 값을 잇는 표를 만든다(코드에서 `kind` + `layout`/`cover` → 항목). `available`인 항목만 고를 수 있게 하고, `needs-option`은 보이지 않거나 "준비 중"으로 둔다. 표가 사양의 모든 값을 덮는지 테스트한다.
- [ ] `option-field.tsx`에 썸네일 선택 필드 종류를 더한다(cojeev에 맞는 컴포넌트가 있으면 쓴다: radio card 류).
- [ ] 키보드로 고를 수 있고, 썸네일마다 안 이름이 읽힌다.
- [ ] 다른 티켓 진행 중에도 할 수 있지만, 새 안이 `available`이 될 때마다 썸네일이 자동으로 늘어나야 한다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/admin` 편집기를 375·1280 폭에서 열어 콘솔 오류·hydration 경고가 없다. 썸네일을 눌러 구성을 바꾸면 미리보기가 바뀐다.
