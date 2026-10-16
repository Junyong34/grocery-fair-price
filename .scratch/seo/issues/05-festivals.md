# 05. 1g 명절: 제목·빵부스러기

Status: resolved
Blocked by: 01

## 할 일

- [x] 제목 패턴 파일에 1g 제목을 추가한다.
  - `<title>` 앞부분: `{추석} 음식`
  - description: 전통 음식 이름(`traditionalDishes`)과 시기(`period`)를 넣는다.
- [x] `app/seasonal/(season)/festivals/[festival]/page.tsx`의 `createMetadata()`에 위 값을 넘긴다. OG 이미지 글자는 그대로 둔다.
- [x] 빵부스러기 JSON-LD를 넣는다: 장볼날 › {추석} 음식
  - `/seasonal/festivals`는 페이지가 없고 proxy가 다른 곳으로 보낸다. 그래서 중간 단계를 두지 않는다.
- [x] 명절은 `Event` 마크업을 쓰지 않는다. 이유는 spec에 있다.

## 완료 조건

- `/seasonal/festivals/chuseok`의 HTML 원문에 `BreadcrumbList`가 있고, 검사기에서 오류가 없다.
- 공통 완료 조건을 지킨다.

## Answer

2026-10-16 구현. 설명은 "{명절}({시기})에 먹는 전통 음식 {음식…}, 그리고 {명절} 무렵 제철 식재료를 소개해요."이다.
