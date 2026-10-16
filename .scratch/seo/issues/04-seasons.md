# 04. 3a 계절: 제목·빵부스러기

Status: ready-for-agent
Blocked by: 01

## 할 일

- [ ] 제목 패턴 파일에 3a 제목을 추가한다.
  - 목록 `<title>` 앞부분: `계절별 제철 음식`
  - 계절 상세 `<title>` 앞부분: `{봄} 제철 음식`
  - description: 계절마다 다르게 쓴다. 대표 품종 몇 개를 넣는다.
- [ ] `app/seasonal/(season)/seasons/page.tsx`와 `seasons/[season]/page.tsx`의 `createMetadata()`에 위 값을 넘긴다. OG 이미지 글자는 그대로 둔다.
- [ ] 계절 상세 페이지에 빵부스러기 JSON-LD를 넣는다: 장볼날 › 계절별 제철 음식(`routes.seasonal.seasons`) › {봄} 제철 음식

## 완료 조건

- `/seasonal/seasons/spring`의 HTML 원문에 `BreadcrumbList`가 있고, 검사기에서 오류가 없다.
- 공통 완료 조건을 지킨다.
