# 06. 1i 품종: 제목·설명·빵부스러기·sitemap 이미지

Status: resolved
Blocked by: 01

## 목적

품종 페이지 79개가 "{품종} 제철" 검색에 걸리게 한다. 일러스트는 이미지 검색에 노출되게 한다.

## 할 일

- [x] 제목 패턴 파일에 1i 제목을 추가한다.
  - `<title>` 앞부분: `{대게} 제철 시기`
  - description에 넣을 것: 제철 달(`formatSeasonMonths`), 별칭이 있으면 별칭(예: "광어(넙치)"), 같은 때 제철인 식재료·관련 명절 안내
  - description은 품종마다 달라야 한다.
- [x] `app/seasonal/foods/[food]/page.tsx`의 `createMetadata()`에 위 값을 넘긴다. OG 이미지 글자는 그대로 둔다.
- [x] 전체 페이지(`foods/[food]/page.tsx`)에만 빵부스러기 JSON-LD를 넣는다: 장볼날 › {대게} 제철 시기
  - 시트(`@sheet/(.)foods/[food]`)에는 넣지 않는다. 크롤러는 URL을 직접 열기 때문에 시트를 보지 않는다.
- [x] 레지스트리의 `/seasonal/foods/[food]` 항목에 `images`를 붙인다. 대상은 `isDrawn(id)`인 품종만이고, 값은 `/foods/<id>/color.svg`의 절대 주소다.
- [x] 이미지 alt는 이미 `FoodImage`가 `food.name`을 넣는다. 손댈 필요가 있는지만 확인한다.

## 완료 조건

- `/sitemap.xml`에서 그림이 있는 품종 항목에 `<image:image>`가 있고, 그림이 없는 품종 항목에는 없다.
- `/seasonal/foods/snow-crab`
  - `<title>`이 `대게 제철 시기 | 장볼날`이다.
  - HTML 원문에 `BreadcrumbList`가 있다.
- 79개의 description이 모두 다르다. vitest로 확인한다.
- 공통 완료 조건을 지킨다.

## Answer

2026-10-16 구현. 설명에는 제철 달, 별칭, 관련 명절(`festivalsWithFood`, 있을 때만), 같은 때 제철인 품종 2개를 넣는다. 예: "대게 제철은 12·1·2·3월이에요. 설날 무렵 제철 식재료예요. 같은 때 제철인 딸기·참돔도 함께 확인해 보세요." sitemap 이미지는 그림이 있는 49개에 붙는다. 시트 경로(제철 화면 안에서 누름)는 그대로 열린다.
