# 08. 3a 계절 히어로 · 계절 상세

Status: ready-for-human
Blocked by: 03

## 목적

명세 3.3을 만든다. 히어로는 `/seasonal/seasons`, 상세는 `/seasonal/seasons/[season]`이다.

## 할 일

- [x] `/examples/season-backgrounds`: cojeev 배경 후보(`sunwash-background`, `pigment-field`, `sprouts-background`, `grain-dissolve` 등) 3~4개를 계절색 토큰으로 칠해 카드 크기로 나란히 보인다. 모바일에서 프레임 저하가 없는지 함께 확인한다. 
- [x] 히어로 카드: 계절색 바, 라벨, "지금 계절" 태그, 계절명, 설명, **대표 품종 4개를 크게 겹친 구성**, 고른 배경, 개수, "{계절} 제철 보기 →".
- [x] 모바일: 1장씩 가로 캐러셀(cojeev `carousel` 후보 또는 scroll-snap), 점 4개, 첫 화면은 지금 계절. 보이는 카드의 배경만 움직인다.
- [x] 데스크톱: 4장 한 줄, 마우스를 올린 장이 `flex 1 → 1.7`.
- [x] 계절 상세: 월별 묶음(모바일 4열, 데스크톱 8열), 이전/다음 계절(순환).
- [x] `<ViewTransition>`: 카드 → 상세의 계절명 공유 요소 전환, 이전/다음 슬라이드.

## 완료 조건

- 카드를 누르면 계절명이 이어지며 상세로 가고, 뒤로 가면 돌아온다.
- 375와 1280 스크린샷.

- [ ] 사용자가 배경을 고르면 `features/seasonal/seasons/season-style.ts`의 `SEASON_BACKGROUND`를 바꾸고 spec에 적는다(지금은 `sunwash`).

## Answer

2026-10-14 구현. 배경 선택만 사용자 결정 대기.

- 배경 후보(`/examples/season-backgrounds`): cojeev `pattern-background`의 sunwash·sprouts·contours(SVG, 가볍다), `pigment-field`(WebGL), plain(CSS 그라데이션). 모두 계절색 토큰으로 칠하고, 아래에서 번지는 계절색 그라데이션을 공통으로 깐다.
  - pigment-field 셰이더는 `--v-pink/blue/yellow`와 `--v-paper`를 읽는다. 카드마다 이 변수를 계절색으로 덮어쓴다. 화면에 보일 때만 WebGL이 돌고(cojeev useMotionVisibility), 캐러셀에서 옆 카드는 멈춰 있다.
- 대표 품종 `seasonHighlights(season, 4)`: 그림 있는 품종을 먼저, 그 계절 제철 달이 많은 순. 처음에는 제철 길이를 먼저 봤다가 여름에 그림 없는 농어·오이가 뽑혀 순서를 바꿨다(테스트를 고친 뒤 구현을 바꿨다).
- 히어로: 카드 줄 하나가 모바일 캐러셀(scroll-snap, 점, "i / 4")과 데스크톱 4장 한 줄(hover `flex-grow 1 → 1.7`)을 모두 맡는다. 첫 위치는 지금 계절(`useToday`, 한 번만). 다른 화면에 갔다 오면 보던 카드 그대로.
- 계절 상세: 월별 묶음(모바일 4열, md 6열, 데스크톱 8열), 데스크톱 왼쪽 월 요약(앵커), 이전/다음 순환.
- ViewTransition: 계절명 공유 요소(`season-title-*`, 같은 이름이 한 화면에 둘이면 오류라 비교 페이지는 끈다), 이전/다음은 `transitionTypes` season-next/prev로 좌우 슬라이드(globals.css).
- `"use client"` 파일에서 상수를 내보내면 서버 컴포넌트에서 쓸 수 없어 `season-style.ts`로 뺐다.
- 검증(375·1280): 지금 계절(가을)에서 시작, 카드 → 상세 → 다음(겨울) → 뒤로 두 번 → 히어로 위치 유지, 데스크톱 hover 폭(360 / 212), startViewTransition 호출 확인, `get_errors` 없음, `next build` 통과.
