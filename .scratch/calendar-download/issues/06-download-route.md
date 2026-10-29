# 06. 다운로드 Route Handler

Status: ready-for-agent
Blocked by: 01, 02

## 목적

`/seasonal/downloads/[edition]/[paper]`(정확한 꼴은 `routes`에서 정한다)가 R2 presigned URL로 302한다. ADR 0003.

## 할 일

- [ ] Next 16.4 Route Handler 문서(`apps/web/node_modules/next/dist/docs/`) 확인. Cache Components와 동적 응답이 맞물리는 방식.
- [ ] 게시된 에디션·공개 용지만 허용, 나머지 404. 내려간 에디션은 상세 페이지로 302.
- [ ] presigned 수명 60초, `Content-Disposition: attachment; filename="<한글 제목>.pdf"`(RFC 5987 `filename*`), 응답에 `X-Robots-Tag: noindex`, `Cache-Control: no-store`.
- [ ] `robots.ts`에 파일 경로 Disallow. `shared/seo/pages.ts` 등록 규칙에 맞춘다(가드 테스트).
- [ ] 읽기 키는 서버 전용 모듈(`server-only`). 키가 없으면 503과 로그.
- [ ] 광고 게이트가 들어갈 자리를 함수 하나로 남긴다(지금은 늘 통과). 주석 한 줄.

## 완료 조건

- 루트 검사 통과. 로컬에서 버튼 → R2에서 PDF가 받아진다. 60초 뒤 같은 presigned URL은 거부된다.
