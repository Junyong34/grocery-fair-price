# 01. Supabase 계정·연결 정보 설정

Status: ready-for-human
Type: task

## 목적

수집과 적재를 시작하려면 Supabase 프로젝트와 연결 정보가 있어야 한다. 사람이 계정을 만들고 값을 넣는다. 에이전트는 값을 보지 않고 변수 이름만 쓴다.

## 사람이 할 일

- [x] supabase.com 계정 생성, 새 프로젝트 생성 (Free 플랜, 리전은 도쿄 `ap-northeast-1`, ref `ifrgflcbljozfcvuqprq`). 서울을 골라도 대시보드의 리전 자동 선택이 다른 리전을 잡아 도쿄로 정했다. 서울과 왕복 30ms 안팎 차이이고 웹앱은 서버에서 읽어 캐시하므로 감수한다. 리전은 만든 뒤 바꿀 수 없다 (2026-10-26)
- [ ] DB 비밀번호를 비밀번호 관리자에 보관
- [x] Storage 버킷 `raw` 생성 (비공개, 정책 없음)
- [x] Project Settings → API Keys에서 새 비밀 키(`sb_secret_…`) 하나 만들기. 옛 `anon`·`service_role` 키는 쓰지 않는다
- [x] Project Settings → Data API의 노출 스키마(Exposed schemas)에 `price`를 넣지 않는다 (기본값 그대로 두면 된다)
- [x] (02의 마이그레이션 적용 뒤) 02의 마이그레이션이 롤 `ingest_writer`·`web_reader`를 만든 뒤, SQL 편집기에서 비밀번호만 정하기 (`alter role ingest_writer with password '…'`, `web_reader`도). 롤과 권한은 마이그레이션이 만들고 사람은 비밀번호와 접속 주소만 넣는다
- [x] 아래 값을 루트 `.env`에 넣기 (커밋 금지. pre-commit의 `scripts/check-no-secrets.sh`가 막는다)
- [ ] Actions용 값은 GitHub 저장소 Settings → Secrets and variables → Actions에, 웹앱용 값은 Vercel 프로젝트 환경변수에 등록

| 변수 | 어디서 | 쓰는 곳 |
|---|---|---|
| `DATA_GO_KR_SERVICE_KEY` | 이미 있음 | 수집 (로컬, Actions) |
| `SUPABASE_URL` | Project Settings → API → Project URL | Storage 업로드 (로컬, Actions) |
| `SUPABASE_SECRET_KEY` | Project Settings → API Keys → Secret key (`sb_secret_…`) | **Storage 업로드에만** (로컬, Actions). DB 쓰기에는 쓰지 않는다. 웹앱에 절대 넣지 않음 |
| `INGEST_DATABASE_URL` | Connect → Session pooler 주소(포트 5432)에서 사용자를 `ingest_writer.<project-ref>`, 비밀번호를 위에서 정한 값으로 | 수집 적재 (로컬, Actions). 직접 접속 주소는 IPv6 전용이라 Actions에서 안 된다. 트랜잭션 모드(6543)는 쓰지 않는다 |
| `WEB_DATABASE_URL` | Connect → Transaction pooler 주소(포트 6543)에서 사용자를 `web_reader.<project-ref>`로 | 웹앱 서버 컴포넌트 (Vercel 환경변수, 로컬 `.env`). **서버 전용.** `NEXT_PUBLIC_`을 붙이지 않는다. Actions에는 넣지 않는다 |
| `SUPABASE_DB_PASSWORD` | 프로젝트 생성 때 정한 `postgres` 비밀번호 | 로컬 `.env`만. 마이그레이션 적용(`supabase db push`). Actions·Vercel에 넣지 않는다 |

- Actions에서 Supabase CLI를 쓰게 되면(지금은 계획 없음) 이 프로젝트 하나로 범위를 좁힌 개인 액세스 토큰을 `SUPABASE_ACCESS_TOKEN`으로 넣는다 ([scoped PAT](https://supabase.com/changelog/scoped-personal-access-tokens-ga)).
- 2026-10-20 결정에 맞춰 표를 바꿨다 (웹앱 서버 전용 읽기, 새 키, 롤 접속. [pipeline.md 3-0](../../../grocery-price/docs/30-data/pipeline.md)). 예전의 `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`는 쓰지 않는다.

- [x] 개발계정 3개의 활용기간 종료일을 확인해 이 파일 아래 `## Answer`에 적기 (운영계정 전환 알림에 쓴다, 05) → 2028-10-08, `ingest-schedule/01` Answer

## 완료 기준

- 에이전트가 `.env`의 변수 존재만 확인하고(값 출력 없이) `INGEST_DATABASE_URL`·`WEB_DATABASE_URL`로 각각 접속되고 `select current_user`가 `ingest_writer`·`web_reader`인지 확인했다.
- Actions Secrets에 `DATA_GO_KR_SERVICE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `INGEST_DATABASE_URL`이, Vercel에 `WEB_DATABASE_URL`이 등록돼 있다.
