# 03. 어드민 게시: R2 업로드·manifest 갱신

Status: ready-for-agent
Blocked by: 01, 02

## 목적

어드민의 게시가 실제로 사용자에게 닿게 한다. 지금은 `published`로 저장하면 로컬 manifest만 바뀌고 PDF는 gitignore라 운영에 가지 않는다.

## 할 일

- [ ] 게시 동작: 사양이 바뀌지 않은 생성 기록(`isBuildCurrent`)이 있는지 확인 → 공개 용지 PDF를 R2에 올린다(쓰기 키, `features/admin-print/server/`만) → manifest 갱신.
- [x] 객체 키는 `objectKey(id, paper)` = `downloads/<id>/<paper>.pdf`, 사양 해시 없이 덮어쓴다(06 Comments, 2026-10-30).
- [ ] 쓰기 키 클라이언트는 `features/admin-print/server/`에 둔다. 읽기 쪽(`features/seasonal/downloads/server/download-url.ts`)과 엔드포인트 규칙(`https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`, region `auto`)을 맞춘다.
- [ ] 설명이 비었거나 생성 기록이 낡았으면 게시 버튼을 막고 이유를 보인다.
- [ ] 내리기: 상태 변경 → R2 객체 삭제 → manifest의 `withdrawn`으로.
- [ ] S3 클라이언트: `@aws-sdk/client-s3`(06에서 `apps/web`에 추가함). 쓰기 키가 없으면 게시 버튼이 이유를 보이고 꺼진다.
- [ ] `.scratch/calendar-print/spec.md` 운영 흐름(283줄 부근)을 새 흐름으로 고친다.

## 완료 조건

- 루트 검사 통과. 에디션 하나를 게시해 R2에 A4 PDF가 있고 manifest에 들어간다. 내리면 R2에서 사라지고 `withdrawn`에 남는다.
