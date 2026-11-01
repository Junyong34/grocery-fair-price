# 01. 하단 내비 고정 4칸

Status: resolved
Type: task (AFK)
Blocked by: 없음

## 목적

영역마다 3칸 ↔ 4칸으로 바뀌는 하단 내비를 어디서나 같은 4칸(시세 · 제철달력 · 담은 품종 · 나의 식탁)으로 맞춘다(spec 1장).

## 할 일

- [x] `apps/web/shared/shell/menus.ts`: `MENUS`의 `price` · `seasonal` 두 목록과 `MenuArea`를 없애고 목록 하나로 만든다. "계절" 메뉴를 지운다.
- [x] 활성 판정을 spec 1장 표대로 맞춘다. 제철달력 칸은 `/seasonal` 아래 1h를 뺀 모든 경로에서 활성이다(`also`). `nav-link.tsx`의 `matchesPath`에 테스트를 먼저 더한다.
- [x] `SiteShell` · `SiteHeader` · `FloatingNav`에서 `area` prop을 지운다. `PriceShell` · `SeasonalShell`이 넘기던 값도 정리한다.
- [x] 담은 품종 배지(`BasketBadge`)가 제철 화면에서도 보이게 한다. 배지를 넣는 곳을 영역 레이아웃에서 공통 셸로 옮긴다. features끼리 import하지 않으므로, 배지가 `features/price`에 있으면 `shared/`로 내릴지 판단한다.
- [x] 루트 `app/not-found.tsx`와 `/seasonal/<없는 주소>`가 같은 4칸을 보이는지 확인한다.
- [x] `docs/project-structure.md`의 `shell/` 행을 고친다. `.scratch/price-screens/spec.md` 2장에 "`.scratch/shell-unify/spec.md`로 대체됨"을 적는다.

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과
- 375 · 1280에서 P1 · P3 · P4 · 2a · 3a · 1g · 1h · 1i · `/privacy`의 활성 칸이 표와 맞는다. 콘솔 오류가 없다.

## Answer

2026-11-02. `shared/shell/menus.ts`가 목록 하나(`MENUS`)와 `activeMenuKey`를 내보낸다. 활성 판정은 순수 함수 `shared/shell/match-path.ts`로 옮겼다(`nav-link`가 다시 내보냄). `MenuArea` · `area` prop을 지웠다. 담은 품종 배지는 `app/seasonal/layout.tsx`가 `SeasonalShell`에 `badges`로 넣는다(라우트 레이아웃은 features를 import할 수 있다). 375 · 1280에서 `/`, `/seasonal/seasons`, `/seasonal/my-table`, `/basket`, `/privacy`의 활성 칸을 확인했고 콘솔 오류는 없었다(LCP 경고만 있음, 이전부터 있던 것).
