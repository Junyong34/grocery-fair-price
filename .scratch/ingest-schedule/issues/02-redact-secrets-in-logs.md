# 02. 오류·로그에 키와 접속 주소가 남지 않게

Status: open
Type: task (AFK)
Blocked by: -

## Question

수집 코드가 어떤 경로로 실패해도 data.go.kr 키, `SUPABASE_SECRET_KEY`, `INGEST_DATABASE_URL`(비밀번호 포함)이 표준 출력·오류 메시지·스택에 나오지 않는가? 저장소가 공개라 Actions 로그를 누구나 본다. GitHub의 Secret 가리기는 값을 그대로 찍을 때만 동작하고, URL 인코딩된 키(`+`·`/`·`=`가 `%2B` 등으로 바뀜)는 가리지 않는다.

## 할 일

- [ ] 지금 있는 가리기 확인: `packages/price-ingest/src/http.ts`의 `redactedParams`, `errors.ts`. 요청 URL 전체, `fetch` 오류의 `cause`, postgres 라이브러리의 연결 오류(접속 주소를 메시지에 넣는지), Storage 오류 본문
- [ ] 빠진 경로를 막는다. 원본 키와 URL 인코딩된 키를 모두 지운다
- [ ] 테스트: 가짜 키(`+`·`/`·`=` 포함)와 가짜 접속 주소로 호출 실패·DB 연결 실패·Storage 실패를 일으켜, 던진 오류와 로그 문자열에 키·비밀번호가 원본으로도 인코딩으로도 없는지
- [ ] 워크플로가 쓸 규칙을 적어 둔다: `set -x` 금지, 환경변수 덤프 금지, 인코딩된 키를 `::add-mask::`로 추가 가리기 (11에서 적용)

## 완료 기준

- 위 테스트가 `pnpm test`에 있고 통과한다.
