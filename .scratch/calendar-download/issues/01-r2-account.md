# 01. Cloudflare 계정·R2 버킷·API 토큰 두 벌

Status: ready-for-human
Blocked by: —

## 목적

PDF를 둘 비공개 R2 버킷을 만든다(ADR 0003). 운영자가 직접 해야 하는 일이다(계정, 결제 수단 등록).

## 할 일

- [ ] Cloudflare 계정 만들기, R2 활성화(무료 범위도 결제 수단 등록이 필요하다).
- [ ] 비공개 버킷 하나(예: `seasonal-prints`). 공개 접근·커스텀 도메인은 켜지 않는다.
- [ ] R2 API 토큰 두 벌: **쓰기**(Object Read & Write, 이 버킷만) → 운영자 로컬 `.env`. **읽기**(Object Read only) → 운영 환경변수.
- [ ] 키 이름을 정해 `.env.example`류 문서에 이름만 적는다(값은 적지 않는다, pre-commit 훅이 막는다). 후보: `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_READ_ACCESS_KEY_ID`/`_SECRET`, `R2_WRITE_ACCESS_KEY_ID`/`_SECRET`.

## 완료 조건

- 쓰기 키로 파일 하나를 올리고, 읽기 키로 만든 presigned URL로 받을 수 있다. 읽기 키로는 올릴 수 없다.
