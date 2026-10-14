# 10. 전역 품종 검색

Status: ready-for-agent
Blocked by: 03

## 목적

모바일 헤더의 "검색"과 데스크톱 "음식 검색"이 같은 검색 오버레이를 연다.

## 할 일

- [x] 초성 매처 `packages/seasonal/src/search/match-foods.ts`는 07에서 만들었다(이름·별칭·초성, 앞에서 맞는 것 먼저).
- [ ] cojeev `command`(`pnpm ui:add`)로 오버레이를 만든다. `overlay-kit`으로 연다. 결과 행은 `FoodImage`, 이름, 제철 달이고, 고르면 1i로 간다.
- [ ] 데스크톱 상단 입력에 포커스하거나 `/`를 누르면 열린다.

## 완료 조건

- "ㅈㅇ"으로 전어가 나온다.
- 키보드만으로 열고, 고르고, 1i까지 갈 수 있다.
