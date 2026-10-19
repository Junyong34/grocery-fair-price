# 01. Supabase 계정·연결 정보 설정

Status: ready-for-human
Type: task

## 목적

수집과 적재를 시작하려면 Supabase 프로젝트와 연결 정보가 있어야 한다. 사람이 계정을 만들고 값을 넣는다. 에이전트는 값을 보지 않고 변수 이름만 쓴다.

## 사람이 할 일

- [ ] supabase.com 계정 생성, 새 프로젝트 생성 (Free 플랜, 리전은 서울 `ap-northeast-2`)
- [ ] DB 비밀번호를 비밀번호 관리자에 보관
- [ ] Storage 버킷 `raw` 생성 (비공개)
- [ ] 아래 값을 루트 `.env`에 넣기 (커밋 금지. pre-commit의 `scripts/check-no-secrets.sh`가 막는다)
- [ ] 같은 값을 GitHub 저장소 Settings → Secrets and variables → Actions에 등록 (`SUPABASE_ANON_KEY`는 06 결정 후)

| 변수 | 어디서 | 쓰는 곳 |
|---|---|---|
| `DATA_GO_KR_SERVICE_KEY` | 이미 있음 | 수집 (로컬, Actions) |
| `DATABASE_URL` | Project Settings → Database → Connection string (Session pooler) | 마이그레이션, 수집 적재 |
| `SUPABASE_URL` | Project Settings → API → Project URL | Storage 업로드 |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role | Storage 업로드 (Actions·로컬 전용, 웹앱에 절대 넣지 않음) |
| `SUPABASE_ANON_KEY` | Project Settings → API → anon | 웹앱 읽기 방식이 supabase-js로 정해질 때만 (06) |

- [ ] 개발계정 3개의 활용기간 종료일을 확인해 이 파일 아래 `## Answer`에 적기 (운영계정 전환 알림에 쓴다, 05)

## 완료 기준

- 에이전트가 `.env`의 변수 존재만 확인하고(값 출력 없이) `DATABASE_URL`로 접속이 되는지 확인했다.
- Actions Secrets에 같은 이름이 등록돼 있다.
