# 07. 1h 나의 식탁: noindex·`h1`

Status: ready-for-agent
Blocked by: 01

## 목적

1h는 기기에 저장된 기록으로 채워지는 화면이다. 크롤러에게는 빈 상태만 보이므로 색인하지 않는다. 대신 `h1`은 넣는다. 접근성 때문이고, 네이버 점검 항목이기도 하다.

## 할 일

- [ ] `app/seasonal/my-table/page.tsx`의 `createMetadata()`에 `noIndex: true`를 넣는다. 01에서 `NOINDEX_ROUTES`에는 이미 들어 있다.
- [ ] `apps/web/features/seasonal/my-table/`에 `h1`(나의 식탁)을 하나 넣는다.
  - 화면에 이미 제목 역할을 하는 글자가 있으면 그 요소를 `h1`로 바꾼다.
  - 그런 글자가 없으면 `sr-only`로 넣는다.
  - 다른 화면(2b 목록, 3a 목록)과 같은 방식으로 맞춘다.

## 완료 조건

- `SITE_INDEXABLE=true`로 빌드해도 `/seasonal/my-table`에 noindex가 있다.
- `h1`이 정확히 하나다.
- `next-dev-loop`으로 폭 375와 1280에서 화면을 확인했을 때 겉모습이 바뀌지 않는다.
- 공통 완료 조건을 지킨다.
