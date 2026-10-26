# 01. Actions Secrets 등록과 개발계정 종료일 확인

Status: open
Type: task (HITL)
Blocked by: -

## Question

Actions가 수집에 쓸 비밀값이 저장소에 들어가 있는가? 사람이 값을 넣고, 에이전트는 이름만 확인한다. [ingest-foundation/01](../../ingest-foundation/issues/01-supabase-setup.md)의 남은 칸이다.

## 사람이 할 일

- [ ] GitHub 저장소 Settings → Secrets and variables → Actions에 `DATA_GO_KR_SERVICE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `INGEST_DATABASE_URL`(`ingest_writer`, Supavisor 세션 모드 5432) 등록. `WEB_DATABASE_URL`·`SUPABASE_DB_PASSWORD`는 넣지 않는다
- [ ] DB 비밀번호를 비밀번호 관리자에 보관
- [ ] data.go.kr 마이페이지에서 개발계정 3개의 활용기간 종료일을 확인해 아래 `## Answer`에 적고, 30일 전 날짜를 달력에 넣기

## 에이전트가 할 일

- [ ] `gh secret list`로 이름 네 개가 있는지 확인 (값은 보지 않는다)
- [ ] 로컬 `.env`로 `INGEST_DATABASE_URL` 접속 → `select current_user`가 `ingest_writer`인지 (값 출력 없이)

## 완료 기준

- Secrets 이름 네 개가 있고, 종료일이 `## Answer`에 있다.
