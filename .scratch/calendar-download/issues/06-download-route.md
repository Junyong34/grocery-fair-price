# 06. 다운로드 Route Handler

Status: resolved
Blocked by: 01, 02

## 목적

`/seasonal/downloads/[edition]/[paper]`(정확한 꼴은 `routes`에서 정한다)가 R2 presigned URL로 302한다. ADR 0003.

## 할 일

- [x] Next 16.4 Route Handler 문서(`apps/web/node_modules/next/dist/docs/`) 확인. Cache Components와 동적 응답이 맞물리는 방식.
- [x] 게시된 에디션·공개 용지만 허용, 나머지 404. 내려간 에디션은 상세 페이지로 302.
- [x] presigned 수명 60초, `Content-Disposition: attachment; filename="<한글 제목>.pdf"`(RFC 5987 `filename*`), 응답에 `X-Robots-Tag: noindex`, `Cache-Control: no-store`.
- [x] ~~`robots.ts`에 파일 경로 Disallow.~~ 하지 않기로 했다(아래 Comments). `shared/seo/pages.ts` 등록 규칙에 맞춘다(가드 테스트).
- [x] 읽기 키는 서버 전용 모듈(`server-only`). 키가 없으면 503과 로그.
- [x] 광고 게이트가 들어갈 자리를 함수 하나로 남긴다(지금은 늘 통과). 주석 한 줄.

## 완료 조건

- 루트 검사 통과. 로컬에서 버튼 → R2에서 PDF가 받아진다. 60초 뒤 같은 presigned URL은 거부된다.

## Comments

2026-10-29 R2 없이 할 수 있는 부분을 먼저 했다.

- `app/seasonal/downloads/[edition]/[paper]/route.ts`: `resolveDownload`(순수, 테스트)로 게시 에디션 · 공개 용지만 302, 내린 에디션은 상세(6-1)로 302, 나머지 404. 모든 응답 `Cache-Control: no-store`, `X-Robots-Tag: noindex`. 광고 확인이 들어갈 자리에 주석.
- `features/seasonal/downloads/server/download-url.ts`의 `downloadUrl`: 개발 서버는 로컬 `public/downloads/<id>/a4.pdf`, 운영은 지금 null(503). **남은 일: R2 presign 분기**(수명 60초, `ResponseContentDisposition`에 `downloadFileName`을 RFC 5987 `filename*`로). 지금 파일 이름은 링크의 `download` 속성으로 정해지는데, 다른 출처(R2)로 302되면 브라우저가 이 속성을 무시하므로 presign 쪽에서 넣어야 한다.
- robots.txt Disallow는 하지 않기로 바꿨다(이 저장소는 noindex로만 막는다). 스펙 · ADR 0003을 고쳤다.

2026-10-30 R2 presign 분기를 붙였다.

- R2 객체 키는 `downloads/<id>/<paper>.pdf`(`objectKey`, 로컬 `downloadPath`에서 앞의 `/`만 뺀 값). 연도 · 종류 폴더는 두지 않는다: 종류는 id에 이미 있고, 연도는 사양에서 바뀔 수 있어 키가 바뀌면 옛 객체가 남으며, 포스터에는 연도가 없다. 다시 생성하면 같은 키에 덮어쓴다.
- `downloadUrl`: R2 읽기 키 네 개(`R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_READ_*`)가 있으면 60초 서명 링크, 없으면 개발 서버는 로컬 파일, 운영은 로그를 남기고 503. 저장 파일 이름은 `attachmentDisposition`(영문 `filename` + 한글 `filename*`, RFC 5987)을 서명에 넣는다.
- `next.config.ts`가 루트 `.env`를 불러온다(있을 때만, 이미 있는 환경 변수는 덮어쓰지 않음). 그래서 로컬에 R2 키가 있으면 개발 서버도 R2로 받는다. 03(게시 때 업로드)이 들어오기 전에는 로컬에서 새로 공개한 에디션이 R2에 없어 R2가 404를 낸다.
- 확인(개발 서버 3000, 임시 manifest 항목 `monthly-999` + R2에 올린 작은 PDF, 끝나고 둘 다 지움): 라우트 302(`no-store`, `noindex`) → R2 200 `application/pdf`, `Content-Disposition`에 한글 이름. 65초 뒤 같은 서명 링크 403. 없는 에디션 · A3 404. 루트 typecheck · lint(오류 0) · test 통과.
