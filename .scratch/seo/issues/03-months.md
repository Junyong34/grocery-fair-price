# 03. 2b 월별: 제목·빵부스러기

Status: resolved
Blocked by: 01

## 할 일

- [x] 제목 패턴 파일에 2b 제목을 추가한다.
  - 목록 `<title>` 앞부분: `월별 제철 음식`
  - 월 상세 `<title>` 앞부분: `{m}월 제철 음식`
  - description: 월마다 다르게 쓴다. 그 달 대표 품종 이름 2~3개를 넣으면 검색 스니펫에 쓸모가 있다. 품종은 `foodsInMonth`에서 고르고, 고르는 규칙은 함수에 적는다.
- [x] `app/seasonal/(this-month)/months/page.tsx`와 `months/(detail)/[month]/page.tsx`의 `createMetadata()`에 위 값을 넘긴다. OG 이미지 글자는 그대로 둔다.
- [x] 월 상세 페이지에 `<JsonLd data={breadcrumb([...])} />`를 넣는다.
  - 빵부스러기: 장볼날(`routes.home`) › 월별 제철 음식(`routes.seasonal.months`) › {m}월 제철 음식
  - 위치: params를 읽는 Suspense 안이어도 된다. 빌드 때 프리렌더되므로 HTML 원문에 들어간다.

## 완료 조건

- `/seasonal/months/3`의 HTML 원문에 `BreadcrumbList`가 있고, 검사기에서 오류가 없다.
- 12개월의 description이 서로 다르다. 순수 함수이므로 vitest로 확인한다.
- 공통 완료 조건을 지킨다.

## Answer

2026-10-16 구현. 대표 품종 규칙: 그림이 있는 품종을 먼저, 그 달에만 가까운(제철 달이 적은) 품종을 먼저, 그다음 이름순으로 3개를 고른다(`titles.ts` `monthHighlights`). 3월 설명은 "냉이·달래·미나리 등"이다. 빵부스러기는 장볼날 › 월별 제철 음식 › 3월 제철 음식이다.
