# 01. Cloudflare 계정·R2 버킷·API 토큰 두 벌

Status: resolved
Blocked by: —

## 목적

PDF를 둘 비공개 R2 버킷을 만든다(ADR 0003). 운영자가 직접 해야 하는 일이다(계정, 결제 수단).

근거: Cloudflare 공식 문서(2026-10-29 확인) — [Get started](https://developers.cloudflare.com/r2/get-started/), [API tokens](https://developers.cloudflare.com/r2/api/tokens/), [Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [Pricing](https://developers.cloudflare.com/r2/pricing/).

## 체크리스트

### 1. 계정과 R2 구독 (약 10분)

- [x] https://dash.cloudflare.com 에서 계정을 만든다(이메일 인증까지). 도메인을 연결할 필요는 없다.
- [x] 대시보드 **Storage & databases → R2 → Overview**로 가서 결제 흐름(checkout)을 끝내 R2 구독을 켠다. 무료 사용량 안에서는 청구되지 않지만 결제 수단을 넣는 단계가 나올 수 있다.
  - 무료 사용량(Standard 저장, 매달): 저장 10GB-month, 쓰기 계열(Class A) 100만 회, 읽기 계열(Class B) 1,000만 회, **egress 무료**. 에디션 15개(A4만 약 45MB)면 저장은 0.5%도 안 쓴다.
  - Infrequent Access 저장 등급은 무료 사용량이 없다. 버킷은 **Standard**로 만든다.
- [x] (권장) 결제 알림: 대시보드 **Billing → Billable usage / Notifications**에서 사용량 알림을 걸어 둔다. 무료 사용량을 넘을 일이 거의 없지만 악용 요청이 몰릴 때 바로 알 수 있다.

### 2. 버킷 (2분)

- [x] **R2 → Create bucket**. 이름: `seasonal-prints`(영문 소문자 · 숫자 · 하이픈). 이 이름은 코드에서 환경 변수로 읽으므로 다르게 지어도 된다.
- [x] Location은 Automatic(기본). 관할(EU 등)은 고르지 않는다. 고르면 주소가 달라진다.
- [x] Default storage class: **Standard**.
- [x] 만든 뒤 **Settings**에서 **Public access(r2.dev 주소, Custom Domains)가 꺼져 있는지** 확인한다. 켜면 PDF 주소가 영구 공개가 되어 ADR 0003이 깨진다. 서명 링크(presigned URL)는 커스텀 도메인에서 동작하지 않고 `r2.cloudflarestorage.com`에서만 동작하므로 도메인도 연결하지 않는다.
- [x] CORS는 설정하지 않는다. 사용자는 링크 이동(302)으로 받고, 어드민은 서버에서 올리므로 브라우저의 교차 출처 요청이 없다.

### 3. 계정 ID 적어 두기

- [x] R2 Overview 오른쪽 **Account Details**의 **Account ID**를 복사한다. S3 주소는 `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`이고 코드가 이 값으로 만든다.

### 4. API 토큰 두 벌 (5분)

같은 **Account Details → API Tokens → Manage**에서 만든다. **Create Account API token**을 고른다(사람이 아니라 계정에 묶여, 운영자가 바뀌어도 유지된다).

- [x] **쓰기 토큰**(어드민 게시용, 운영자 컴퓨터에만)
  - 이름: `seasonal-prints-write`
  - Permissions: **Object Read & Write**
  - Specify bucket(s): **`seasonal-prints`만**
  - TTL: Forever(또는 1년 뒤 갱신)
- [x] **읽기 토큰**(운영 서버가 서명 링크를 만드는 용도)
  - 이름: `seasonal-prints-read`
  - Permissions: **Object Read only**
  - Specify bucket(s): **`seasonal-prints`만**
- [x] 만들 때마다 화면에 **Access Key ID**와 **Secret Access Key**가 한 번만 나온다. 다시 볼 수 없으니 바로 아래 5에 넣는다. Admin 권한이나 "Cloudflare API token value"는 쓰지 않는다(S3 키 두 개만 쓴다).

### 5. 키 넣기 (값은 대화나 커밋에 붙이지 않는다)

키 이름(코드가 읽는 이름):

| 이름 | 값 | 어디에 |
|---|---|---|
| `R2_ACCOUNT_ID` | 3의 Account ID | 로컬 + 운영 |
| `R2_BUCKET` | `seasonal-prints` | 로컬 + 운영 |
| `R2_READ_ACCESS_KEY_ID`, `R2_READ_SECRET_ACCESS_KEY` | 읽기 토큰 | 운영 환경 변수(로컬은 R2로 실제 받아 볼 때만) |
| `R2_WRITE_ACCESS_KEY_ID`, `R2_WRITE_SECRET_ACCESS_KEY` | 쓰기 토큰 | **로컬만**. 운영에는 넣지 않는다 |

- [x] 값은 **루트 `.env`**에 넣었다(2026-10-30). 수집 스크립트와 같은 곳이고, pre-commit 비밀 검사가 이 파일을 보므로 R2 키도 그대로 막힌다. `apps/web/.env.local`은 만들지 않는다.
- [ ] Next 개발 서버는 루트 `.env`를 읽지 않는다(`apps/web/.env*`만 읽는다). R2를 부르는 코드가 들어갈 때(06·03) `next.config.ts`에서 루트 `.env`를 불러오게 하고, 실제 라우트에서 키가 읽히는지 확인한다.
- [ ] 운영 호스팅이 정해지면 그 환경 변수에 읽기 키 넣기(쓰기 키는 넣지 않는다).

### 6. 확인 (내일 06 · 03과 함께, 에이전트가 한다)

- [x] 쓰기 키로 테스트 파일 하나 올리기 → 성공.
- [x] 읽기 키로 서명 링크(60초) 만들어 받기 → 성공. 61초 뒤 같은 링크 → 거부.
- [x] 읽기 키로 올리기 → 거부(권한 확인).
- [x] 버킷 공개 주소로 직접 접근 → 거부.

## 미리 알아 둔 것(06에 영향)

- 리전 값은 `"auto"`(SDK가 요구하지만 R2는 쓰지 않는다). 서명 수명은 1초 ~ 7일.
- 서명은 서버에서만 계산하고 R2를 부르지 않는다. 그래서 다운로드 요청마다 R2 쓰기 계열 비용이 생기지 않고, 받을 때 읽기 1회만 센다.
- 서명 링크의 `response-content-disposition`(저장 파일 이름)은 **동작한다**(2026-10-30 실측, 아래 Comments). 객체 메타데이터는 필요 없다.

## 완료 조건

- 위 6의 확인이 모두 통과한다.

## Comments

2026-10-30 운영자가 1~5를 마쳤고, 에이전트가 6을 실측했다(`@aws-sdk/client-s3` + `s3-request-presigner`, 임시 스크립트, 저장소에는 넣지 않음). 모두 통과.

- 쓰기 키 업로드 → 성공. 정리 삭제도 성공.
- 읽기 키 서명 링크(60초) → 200, 본문 일치.
- `ResponseContentDisposition: attachment; filename="..."`를 서명에 넣으면 응답 `content-disposition`에 그대로 나온다.
- 만료 거부: 수명 2초 링크를 5초 뒤 요청 → 403. (61초를 기다리는 대신 짧은 수명으로 같은 동작을 봤다.)
- 읽기 키로 업로드 · 삭제 → 둘 다 `AccessDenied`.
- 서명 없는 직접 접근(`<endpoint>/<bucket>/<key>`) → 400.
- 두 키 모두 `ListBuckets`에 `seasonal-prints`만 보인다(버킷 범위 지정). 계정에 버킷이 하나뿐이라 다른 버킷 거부까지는 확인하지 못했다.
- 대시보드 버킷 화면: Standard, Public Access Disabled. 결제 알림(`seasonal-prints budget`, 이메일)을 걸었다.
