# 03. 셸 통일: 헤더 · 내비를 `shared/`로, 영역별 메뉴, 판정 색 토큰

Status: ready-for-agent
Type: task (AFK)
Blocked by: 없음

## 목적

제철과 가격이 같은 헤더 · 하단 내비를 쓰고, 메뉴만 영역에 따라 바뀐다 (spec 2장, 5장).

## 할 일

- [ ] `features/seasonal/components/{main-nav,nav-link}.tsx`의 `FloatingNav`, `SeasonalHeader`, `NavLink`를 `apps/web/shared/shell/`로 내린다 (이름은 `FloatingNav`, `SiteHeader`)
- [ ] 영역별 메뉴를 한 파일 설정으로: 가격(`/`, `/search`, `/prices/*`, `/basket`) = 시세 · 제철달력 · 담은 품종, 제철(`/seasonal/*`) = 시세 · 제철달력 · 계절 · 나의 식탁. "제철달력"은 월별 보기에서도 활성, "계절"은 명절에서도 활성
- [ ] 담은 품종 칸의 개수 배지 자리 (0이면 숨김). 값은 07에서 스토어를 잇는다
- [ ] 칸 폭 72px 유지, 375px에서 4칸 확인. 데스크톱(≥1024) 헤더 안 메뉴도 같은 설정
- [ ] 로고는 `routes.home`(`/`)으로. 이 티켓에서는 `/`가 아직 제철로 리다이렉트하므로 04가 `/`를 바꾼다
- [ ] 제철 레이아웃은 `actions` · `tabs`를 넣는 구조 유지
- [ ] `packages/ui/src/styles/globals.css`에 `--color-verdict-{cheap,normal,pricey,none}` (기존 팔레트를 가리키는 이름만)

## 완료 기준

- `/seasonal` 하단 내비가 4칸(시세 · 제철달력 · 계절 · 나의 식탁)이고 활성 표시가 맞다 (375 · 1280). 루트 검사 통과.
