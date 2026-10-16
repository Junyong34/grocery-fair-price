# 02. 홈(2a): `WebSite`·`Organization`, 제목

Status: ready-for-agent
Blocked by: 01

## 목적

구글이 사이트 이름(장볼날)과 로고를 홈에서 읽게 하고, 홈 제목을 검색어에 맞춘다.

## 할 일

- [ ] `apps/web/shared/seo/`의 제목 패턴 파일에 홈 제목을 추가한다.
  - `<title>` 앞부분: `제철 음식 달력`
  - description은 "이달의 제철 식재료"를 포함해 새로 쓴다.
- [ ] `app/seasonal/(this-month)/page.tsx`의 `createMetadata()`에 위 값을 넘긴다. OG 이미지 글자는 그대로 둔다.
- [ ] `<JsonLd data={[website(), organization()]} />`를 넣는다.
  - 조건: `routes.home`이 가리키는 페이지에서만 출력한다.
  - 위치: Suspense 밖, 정적 셸 쪽에 둔다. `connection()` 뒤에 그려지지 않게 한다.
  - `website()`의 `url`: `siteUrl()` 루트로 한다. 구글의 사이트 이름은 도메인 루트 기준이다.
  - `alternateName`: 넣지 않는다.

## 완료 조건

- `/seasonal`의 HTML 원문(JS 실행 전)에 두 JSON-LD가 있다.
- Rich Results Test 또는 schema.org validator에 붙여 넣었을 때 오류가 없다. 로컬이라 URL로는 검사할 수 없으니 HTML을 붙여 넣는다.
- `<title>`이 `제철 음식 달력 | 장볼날`이다.
- 공통 완료 조건(`AGENTS.md`)을 지킨다.
