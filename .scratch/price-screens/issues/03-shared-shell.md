# 03. 셸 통일: 헤더 · 내비를 `shared/`로, 영역별 메뉴, 판정 색 토큰

Status: resolved
Type: task (AFK)
Blocked by: 없음

## 목적

제철과 가격이 같은 헤더 · 하단 내비를 쓰고, 메뉴만 영역에 따라 바뀐다 (spec 2장, 5장).

## 할 일

- [x] `features/seasonal/components/{main-nav,nav-link}.tsx`의 `FloatingNav`, `SeasonalHeader`, `NavLink`를 `apps/web/shared/shell/`로 내린다 (이름은 `FloatingNav`, `SiteHeader`)
- [x] 영역별 메뉴를 한 파일 설정으로: 가격(`/`, `/search`, `/prices/*`, `/basket`) = 시세 · 제철달력 · 담은 품종, 제철(`/seasonal/*`) = 시세 · 제철달력 · 계절 · 나의 식탁. "제철달력"은 월별 보기에서도 활성, "계절"은 명절에서도 활성
- [x] 담은 품종 칸의 개수 배지 자리 (0이면 숨김). 값은 07에서 스토어를 잇는다
- [x] 칸 폭 72px 유지, 375px에서 4칸 확인. 데스크톱(≥1024) 헤더 안 메뉴도 같은 설정
- [x] 로고는 `routes.home`(`/`)으로. 이 티켓에서는 `/`가 아직 제철로 리다이렉트하므로 04가 `/`를 바꾼다
- [x] 제철 레이아웃은 `actions` · `tabs`를 넣는 구조 유지
- [x] `packages/ui/src/styles/globals.css`에 `--color-verdict-{cheap,normal,pricey,none}` (기존 팔레트를 가리키는 이름만)

## 완료 기준

- `/seasonal` 하단 내비가 4칸(시세 · 제철달력 · 계절 · 나의 식탁)이고 활성 표시가 맞다 (375 · 1280). 루트 검사 통과.

## Answer

2026-10-27. `apps/web/shared/shell/`: `site-shell.tsx`, `site-nav.tsx`(`SiteHeader`, `FloatingNav`), `menus.ts`, `nav-link.tsx`. 제철 셸은 `SiteShell area="seasonal"`에 검색 · ⚙(`actions`)와 2차 탭(`tabs`)을 넣는다.

- `routes.home`을 `/`로 바꾸고 `routes.price.*`를 더했다. 04 전까지 `app/page.tsx`는 `routes.seasonal.root`로 보낸다.
- 담은 개수 배지: `shared`는 `features`를 import하지 못하므로 셸이 `badges`(메뉴 key → 요소)를 받는다. 가격 레이아웃이 07의 배지 컴포넌트를 넣는다.
- 판정 색: `--color-verdict-{cheap,normal,pricey,none}`(점 · 선), `-wash`(배경), `-ink`(글자). 값은 sage+forest, gold, holiday, ash를 가리킨다.
- 확인: 375 · 1280에서 `/seasonal` 4칸, 월별 보기 → 제철달력, 명절 → 계절 활성. 콘솔 오류 없음.
