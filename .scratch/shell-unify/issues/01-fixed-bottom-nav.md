# 01. 하단 내비 고정 4칸

Status: ready-for-agent
Type: task (AFK)
Blocked by: 없음

## 목적

영역마다 3칸 ↔ 4칸으로 바뀌는 하단 내비를 어디서나 같은 4칸(시세 · 제철달력 · 담은 품종 · 나의 식탁)으로 맞춘다(spec 1장).

## 할 일

- [ ] `apps/web/shared/shell/menus.ts`: `MENUS`의 `price` · `seasonal` 두 목록과 `MenuArea`를 없애고 목록 하나로 만든다. "계절" 메뉴를 지운다.
- [ ] 활성 판정을 spec 1장 표대로 맞춘다. 제철달력 칸은 `/seasonal` 아래 1h를 뺀 모든 경로에서 활성이다(`also`). `nav-link.tsx`의 `matchesPath`에 테스트를 먼저 더한다.
- [ ] `SiteShell` · `SiteHeader` · `FloatingNav`에서 `area` prop을 지운다. `PriceShell` · `SeasonalShell`이 넘기던 값도 정리한다.
- [ ] 담은 품종 배지(`BasketBadge`)가 제철 화면에서도 보이게 한다. 배지를 넣는 곳을 영역 레이아웃에서 공통 셸로 옮긴다. features끼리 import하지 않으므로, 배지가 `features/price`에 있으면 `shared/`로 내릴지 판단한다.
- [ ] 루트 `app/not-found.tsx`와 `/seasonal/<없는 주소>`가 같은 4칸을 보이는지 확인한다.
- [ ] `docs/project-structure.md`의 `shell/` 행을 고친다. `.scratch/price-screens/spec.md` 2장에 "`.scratch/shell-unify/spec.md`로 대체됨"을 적는다.

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과
- 375 · 1280에서 P1 · P3 · P4 · 2a · 3a · 1g · 1h · 1i · `/privacy`의 활성 칸이 표와 맞는다. 콘솔 오류가 없다.
