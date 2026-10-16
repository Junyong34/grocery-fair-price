# 05. 1g 명절: 제목·빵부스러기

Status: ready-for-agent
Blocked by: 01

## 할 일

- [ ] 제목 패턴 파일에 1g 제목을 추가한다.
  - `<title>` 앞부분: `{추석} 음식`
  - description: 전통 음식 이름(`traditionalDishes`)과 시기(`period`)를 넣는다.
- [ ] `app/seasonal/(season)/festivals/[festival]/page.tsx`의 `createMetadata()`에 위 값을 넘긴다. OG 이미지 글자는 그대로 둔다.
- [ ] 빵부스러기 JSON-LD를 넣는다: 장볼날 › {추석} 음식
  - `/seasonal/festivals`는 페이지가 없고 proxy가 다른 곳으로 보낸다. 그래서 중간 단계를 두지 않는다.
- [ ] 명절은 `Event` 마크업을 쓰지 않는다. 이유는 spec에 있다.

## 완료 조건

- `/seasonal/festivals/chuseok`의 HTML 원문에 `BreadcrumbList`가 있고, 검사기에서 오류가 없다.
- 공통 완료 조건을 지킨다.
