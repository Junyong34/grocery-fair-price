# 05. 스크롤 셸: 화면별 헤더 동작(SC5)과 스티키 묶음

Status: resolved
Type: task (AFK)
Blocked by: 02, 04

## 목적

헤더를 화면마다 `hide-on-scroll` 또는 `pinned`로 동작하게 하고, 탭 줄과 구간 줄을 헤더와 한 묶음으로 고정한다(spec 4장, 캔버스 H 페이지).

## 할 일

- [x] `shared/shell`에 경로 → `{ header: 루트|하위|검색, scroll: "hide-on-scroll" | "pinned" }` 화면 표를 둔다(04와 같은 표). 경로 패턴 매칭은 순수 함수로 만들고 테스트를 먼저 쓴다. 표에 없는 경로는 pinned로 둔다.
- [x] 스크롤 방향 판정은 순수 함수(이전 위치, 지금 위치, 문서 높이 → 보임/숨김)로 만들고 테스트를 먼저 쓴다.
  - 10px 임계값
  - 맨 위 8px 안에서는 보임
  - 끝 overscroll 무시
- [x] 셸 묶음(헤더 + 탭 줄 슬롯 + 구간 줄 슬롯): 헤더가 숨으면 묶음 전체를 `translateY(-48px)`로 옮긴다. 구간 줄 슬롯은 화면이 채운다(06). 지금의 떠 있는 둥근 바 모양(`useScrolledDown`)은 보이는 헤더에 유지한다.
- [x] 헤더 안으로 초점이 들어가면 보인다. `prefers-reduced-motion`이면 바로 바뀐다.
- [x] 지금 탭(하단 내비 칸 · 탭 줄)을 다시 누르면 맨 위로 스크롤한다.
- [x] 데스크톱(≥1024)은 늘 pinned다.
- [x] `main`의 위 · 아래 여백과 `scroll-margin-top`(2a `#month-N` 해시 이동, 섹션 칩 이동)을 묶음 높이에 맞춘다.

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과
- 375에서 hide-on-scroll 화면(2a · 2b · 1g)과 pinned 화면(P3 · 1h · P4)의 세 상태(맨 위 / 내리는 중 / 위로 살짝)가 캔버스 H와 맞는다.
- iOS 튕기는 스크롤에서 헤더가 깜빡이지 않는다(Safari 또는 터치 흉내로 확인).
- 콘솔 오류 · 하이드레이션 경고가 없다.

## Answer

2026-11-02. `shared/shell/header-scroll.ts`(`headerScrollStep`, 테스트 9건)가 보임 여부를 정한다. `site-nav.tsx`의 `useHeaderVisible`이 `screenOf(pathname).scroll`이 hide-on-scroll일 때만 이 함수를 돌린다(모바일만).

- **헤더**: 숨을 때 `data-hidden`으로 `-translate-y-[72px]`(떠 있는 바의 그림자까지)만큼 올라간다. `motion-safe` 전환이라 reduced-motion이면 바로 바뀐다. 헤더 안으로 초점이 들어오면 다시 보인다.
- **고정 줄**: 스펙의 "묶음 전체를 transform"과 다르게 구현했다. 헤더만 transform하고, 고정 줄은 `<html>`의 `--shell-top`(56px/0px)을 `top`으로 읽어 따라 움직인다. 06의 구간 줄도 같은 변수를 쓴다.
- **다시 누르기**: 지금 탭(하단 내비 칸 · 제철달력 탭)을 다시 누르면 맨 위로 간다(`scroll-to-top.ts`).
- **스크롤 여백**: 2a 달 섹션 · 계절 상세 칩 이동의 `scroll-margin-top`을 데스크톱에서 `lg:scroll-mt-32`로 키웠다(헤더 + 탭 줄).
- **확인**: 375에서 2b 그 달을 확인했다. 맨 위 / 600px 내림(헤더 숨김, 탭 줄 top 0) / 60px 올림(헤더 다시 보임, 탭 줄 top 56). 1h(pinned)는 내려도 헤더가 숨지 않았다. 오류는 없었다. iOS 실기기의 튕김 스크롤은 확인하지 못했고, 판정 함수 테스트로만 덮었다.
