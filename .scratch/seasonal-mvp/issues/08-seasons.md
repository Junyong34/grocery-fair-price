# 08. 3a 계절 히어로 · 계절 상세

Status: ready-for-agent
Blocked by: 03

## 목적

명세 3.3을 만든다. 히어로는 `/seasonal/seasons`, 상세는 `/seasonal/seasons/[season]`이다.

## 할 일

- [ ] `/examples/season-backgrounds`: cojeev 배경 후보(`sunwash-background`, `pigment-field`, `sprouts-background`, `grain-dissolve` 등) 3~4개를 계절색 토큰으로 칠해 카드 크기로 나란히 보인다. 모바일에서 프레임 저하가 없는지 함께 확인한다. 사용자가 고른 결과를 spec에 적는다.
- [ ] 히어로 카드: 계절색 바, 라벨, "지금 계절" 태그, 계절명, 설명, **대표 품종 4개를 크게 겹친 구성**, 고른 배경, 개수, "{계절} 제철 보기 →".
- [ ] 모바일: 1장씩 가로 캐러셀(cojeev `carousel` 후보 또는 scroll-snap), 점 4개, 첫 화면은 지금 계절. 보이는 카드의 배경만 움직인다.
- [ ] 데스크톱: 4장 한 줄, 마우스를 올린 장이 `flex 1 → 1.7`.
- [ ] 계절 상세: 월별 묶음(모바일 4열, 데스크톱 8열), 이전/다음 계절(순환).
- [ ] `<ViewTransition>`: 카드 → 상세의 계절명 공유 요소 전환, 이전/다음 슬라이드.

## 완료 조건

- 카드를 누르면 계절명이 이어지며 상세로 가고, 뒤로 가면 돌아온다.
- 375와 1280 스크린샷.
