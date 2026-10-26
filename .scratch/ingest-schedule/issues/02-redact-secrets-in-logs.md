# 02. 오류·로그에 키와 접속 주소가 남지 않게

Status: resolved
Type: task (AFK)
Blocked by: -

## Question

수집 코드가 어떤 경로로 실패해도 data.go.kr 키, `SUPABASE_SECRET_KEY`, `INGEST_DATABASE_URL`(비밀번호 포함)이 표준 출력·오류 메시지·스택에 나오지 않는가? 저장소가 공개라 Actions 로그를 누구나 본다. GitHub의 Secret 가리기는 값을 그대로 찍을 때만 동작하고, URL 인코딩된 키(`+`·`/`·`=`가 `%2B` 등으로 바뀜)는 가리지 않는다.

## 할 일

- [x] 지금 있는 가리기 확인: `packages/price-ingest/src/http.ts`의 `redactedParams`, `errors.ts`. 요청 URL 전체, `fetch` 오류의 `cause`, postgres 라이브러리의 연결 오류(접속 주소를 메시지에 넣는지), Storage 오류 본문
- [x] 빠진 경로를 막는다. 원본 키와 URL 인코딩된 키를 모두 지운다
- [x] 테스트: 가짜 키(`+`·`/`·`=` 포함)와 가짜 접속 주소로 호출 실패·DB 연결 실패·Storage 실패를 일으켜, 던진 오류와 로그 문자열에 키·비밀번호가 원본으로도 인코딩으로도 없는지
- [x] 워크플로가 쓸 규칙을 적어 둔다: `set -x` 금지, 환경변수 덤프 금지, 인코딩된 키를 `::add-mask::`로 추가 가리기 (11에서 적용)

## 완료 기준

- 위 테스트가 `pnpm test`에 있고 통과한다.

## Answer

2026-10-26.

**확인한 경로** (가짜 값으로 실측):

| 경로 | 결과 |
|---|---|
| API 호출 실패 (연결·시간 초과) | 안전. `getText`가 원래 오류를 버리고 `ApiTransportError`(출처 이름만)를 던진다 |
| API HTTP 오류·게이트웨이 인증 오류·업무 오류·계약 오류 | 안전. 메시지에 출처·코드·필드 경로만 넣는다. 호출 기록(`CallRecord`)은 `serviceKey`를 뺀 파라미터만 담는다 |
| Storage 실패 | 안전. `StorageError`는 작업 이름과 HTTP 상태만 담는다. 응답 본문은 넣지 않는다 |
| DB 연결 거부·DNS 실패·비밀번호 틀림 | 안전. postgres 오류는 호스트·포트·사용자 이름까지만 담는다 (비밀번호 없음) |
| **DB 접속 주소 형식이 잘못됨** | **샌다.** 비밀번호의 `+ / = #`를 인코딩하지 않고 넣으면 postgres가 `TypeError: Invalid URL`을 던지고, 그 오류의 `input` 속성에 비밀번호가 든 주소 전체가 담긴다. `console.error`가 그대로 찍는다 |

**막은 것**
- `connectIngest`가 주소를 먼저 검사해, 잘못된 형식이면 주소 없는 `DbUrlError`("비밀번호의 특수문자는 퍼센트 인코딩해서 넣는다")를 던진다.
- `src/secrets.ts`: 비밀값 세 개(`DATA_GO_KR_SERVICE_KEY`, `SUPABASE_SECRET_KEY`, `INGEST_DATABASE_URL`)마다 그대로·퍼센트 인코딩·폼 인코딩·디코딩·주소 안의 비밀번호 변형을 모아 `***`로 지우는 지우개(`redactorFromEnv`)와, 오류를 속성까지 펼쳐 지운 뒤 글자로 만드는 `describeError`. 이미 인코딩된 키(data.go.kr "Encoding 키")를 넣어 둔 경우도 원래 모양을 지운다. **07의 CLI는 모든 오류를 `describeError`로만 찍는다** (07 할 일에 넣음). 2차 방어선이다: 지금 있는 오류 클래스는 애초에 값을 담지 않고, 라이브러리가 예상 밖으로 담는 경우를 이것이 막는다.
- `actionsMaskCommands`: 인코딩 변형까지 Actions 로그 가리기에 더하는 `::add-mask::` 줄. Actions 안에서만 쓴다.

**워크플로 규칙 (11·12·13·14에서 적용)**
1. 비밀값은 그 단계의 `env:`로만 넘긴다. `run:` 줄 안에 `${{ secrets.X }}`를 직접 쓰지 않는다 (명령 줄이 로그에 남는다).
2. 수집 단계 맨 앞에서 인코딩 변형을 `::add-mask::`로 더한다 (CLI가 `GITHUB_ACTIONS=true`일 때 스스로 하게 한다, 07).
3. `set -x`, `env`/`printenv`, `node -p process.env` 같은 환경변수 덤프 금지. 디버그 로깅(`ACTIONS_STEP_DEBUG`)을 켜지 않는다.
4. 오류 본문을 그대로 GitHub 이슈에 붙이지 않는다. 알림(13)은 `ingest_run.error_code`와 `describeError`를 거친 요약만 쓴다.
5. Secret의 `INGEST_DATABASE_URL`은 비밀번호를 퍼센트 인코딩한 값으로 넣는다 (아니면 `DbUrlError`로 멈춘다).

테스트 (`test/secrets.test.ts`, 10개, `pnpm test`에 들어간다): 변형 모으기, 지우개, 환경변수 세 개, 가리기 명령, 잘못된 주소가 `DbUrlError`로 바뀜, 지우개 없이 찍으면 Invalid URL이 새는 것과 `describeError`가 막는 것, DB 연결 거부, API 연결 실패(세 출처)·HTTP 500·게이트웨이 인증 오류의 오류와 호출 기록, Storage 실패와 403(본문에 키가 있어도). 키는 `+ / =`가 든 가짜 값이다.
