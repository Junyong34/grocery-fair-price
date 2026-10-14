# 10. 전역 품종 검색

Status: resolved
Blocked by: 03

## 목적

모바일 헤더의 "검색"과 데스크톱 "음식 검색"이 같은 검색 오버레이를 연다.

## 할 일

- [x] 초성 매처 `packages/seasonal/src/search/match-foods.ts`는 07에서 만들었다(이름·별칭·초성, 앞에서 맞는 것 먼저).
- [x] cojeev `command`(`pnpm ui:add`)로 오버레이를 만든다. `overlay-kit`으로 연다. 결과 행은 `FoodImage`, 이름, 제철 달이고, 고르면 1i로 간다.
- [x] 데스크톱 상단 입력에 포커스하거나 `/`를 누르면 열린다.

## 완료 조건

- "ㅈㅇ"으로 전어가 나온다.
- 키보드만으로 열고, 고르고, 1i까지 갈 수 있다.

## Answer

2026-10-14 완료.

- `features/seasonal/search/food-search.tsx`: cojeev `command`(cmdk) + `dialog`를 `overlay-kit`으로 연다. 거르기는 cmdk 대신 `matchFoods`(초성·별칭·앞에서 맞는 것 먼저, `shouldFilter={false}`). cojeev `CommandDialog`는 cmdk 옵션을 넘기지 않아 `Dialog`+`Command`로 직접 짰다.
- 결과 행은 cojeev 자동 꾸밈 아이콘을 끄고(`adornment={false}`) 품종 그림·이름·제철 달. 고르면 `router.push(food)` → 제철 화면 안에서는 품종 상세 시트(가로채기)로 뜬다.
- 모바일 헤더 오른쪽 돋보기 버튼, 데스크톱 상단 "음식 검색 /" 버튼. 어디서든 `/`를 누르면 열린다(입력란에 쓰는 중이면 가로채지 않음).
- cojeev 레지스트리의 `dialog.tsx`가 Radix Close에 Base UI `render` prop을 넘겨 타입 오류가 났다. `asChild`로 고쳤다(파일에 주석). `pnpm ui:add`로 다시 받으면 되돌아간다.
- 검증: 데스크톱 `/` → "ㅈㅇ" → 전어·바다장어·오징어 → Enter → 전어 패널, Esc로 닫기. 모바일 돋보기 → "ㄱ" → ↓↓ → Enter → 감자 시트. `get_errors` 없음, `next build` 통과.
