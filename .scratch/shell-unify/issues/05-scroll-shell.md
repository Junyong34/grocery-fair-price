# 05. 스크롤 셸: 화면별 헤더 동작(SC5)과 스티키 묶음

Status: ready-for-agent
Type: task (AFK)
Blocked by: 02, 04

## 목적

헤더를 화면마다 `hide-on-scroll` 또는 `pinned`로 동작하게 하고, 탭 줄과 구간 줄을 헤더와 한 묶음으로 고정한다(spec 4장, 캔버스 H 페이지).

## 할 일

- [ ] `shared/shell`에 경로 → `{ header: 루트|하위|검색, scroll: "hide-on-scroll" | "pinned" }` 화면 표를 둔다(04와 같은 표). 경로 패턴 매칭은 순수 함수로 만들고 테스트를 먼저 쓴다. 표에 없는 경로는 pinned로 둔다.
- [ ] 스크롤 방향 판정은 순수 함수(이전 위치, 지금 위치, 문서 높이 → 보임/숨김)로 만들고 테스트를 먼저 쓴다.
  - 10px 임계값
  - 맨 위 8px 안에서는 보임
  - 끝 overscroll 무시
- [ ] 셸 묶음(헤더 + 탭 줄 슬롯 + 구간 줄 슬롯): 헤더가 숨으면 묶음 전체를 `translateY(-48px)`로 옮긴다. 구간 줄 슬롯은 화면이 채운다(06). 지금의 떠 있는 둥근 바 모양(`useScrolledDown`)은 보이는 헤더에 유지한다.
- [ ] 헤더 안으로 초점이 들어가면 보인다. `prefers-reduced-motion`이면 바로 바뀐다.
- [ ] 지금 탭(하단 내비 칸 · 탭 줄)을 다시 누르면 맨 위로 스크롤한다.
- [ ] 데스크톱(≥1024)은 늘 pinned다.
- [ ] `main`의 위 · 아래 여백과 `scroll-margin-top`(2a `#month-N` 해시 이동, 섹션 칩 이동)을 묶음 높이에 맞춘다.

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과
- 375에서 hide-on-scroll 화면(2a · 2b · 1g)과 pinned 화면(P3 · 1h · P4)의 세 상태(맨 위 / 내리는 중 / 위로 살짝)가 캔버스 H와 맞는다.
- iOS 튕기는 스크롤에서 헤더가 깜빡이지 않는다(Safari 또는 터치 흉내로 확인).
- 콘솔 오류 · 하이드레이션 경고가 없다.
