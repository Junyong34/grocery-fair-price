# 03. 어드민 게시: R2 업로드·manifest 갱신

Status: resolved
Blocked by: 01, 02

## 목적

어드민의 게시가 실제로 사용자에게 닿게 한다. 지금은 `published`로 저장하면 로컬 manifest만 바뀌고 PDF는 gitignore라 운영에 가지 않는다.

## 할 일

- [x] 게시 동작: 사양이 바뀌지 않은 생성 기록(`isBuildCurrent`)이 있는지 확인 → 공개 용지 PDF를 R2에 올린다(쓰기 키, `features/admin-print/server/`만) → manifest 갱신.
- [x] 객체 키는 `objectKey(id, paper)` = `downloads/<id>/<paper>.pdf`, 사양 해시 없이 덮어쓴다(06 Comments, 2026-10-30).
- [x] 쓰기 키 클라이언트는 `features/admin-print/server/`에 둔다. 읽기 쪽(`features/seasonal/downloads/server/download-url.ts`)과 엔드포인트 규칙(`https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`, region `auto`)을 맞춘다.
- [x] 설명이 비었거나 생성 기록이 낡았으면 게시 버튼을 막고 이유를 보인다.
- [x] 내리기: 상태 변경 → R2 객체 삭제 → manifest의 `withdrawn`으로.
- [x] S3 클라이언트: `@aws-sdk/client-s3`(06에서 `apps/web`에 추가함). 쓰기 키가 없으면 게시 버튼이 이유를 보이고 꺼진다.
- [x] `.scratch/calendar-print/spec.md` 운영 흐름(283줄 부근)을 새 흐름으로 고친다.

## 완료 조건

- 루트 검사 통과. 에디션 하나를 게시해 R2에 A4 PDF가 있고 manifest에 들어간다. 내리면 R2에서 사라지고 `withdrawn`에 남는다.

## Comments

2026-10-30 완료.

- 따로 "게시" 버튼을 두지 않고, 상태 세그먼트 + 저장이 게시다. 무엇을 할지는 순수 함수 `savePlan`(`features/admin-print/lib/publish.ts`, 테스트)이 정한다: 공개로 바뀔 때 올림, 공개에서 빠질 때 지움, 그 밖에는 R2를 건드리지 않음. 처음 공개할 때 지금 사양으로 만든 PDF가 없으면, 또는 R2를 건드려야 하는데 쓰기 키가 없으면 막는다. 편집기가 같은 함수로 이유를 상태 아래에 미리 보이고, 서버가 저장 때 다시 막는다. 설명이 빈 공개는 원래대로 `parseEdition`이 막는다.
- 공개 중인 에디션의 옵션을 바꾸면 저장만 한다(R2에는 옛 PDF가 남아 매니페스트의 옛 생성 기록과 맞는다). PDF를 다시 만들면 `generateEdition`이 같은 키에 덮어쓴다. 처음 공개 때만 생성 기록을 검사하는 것은, 공개 중인 에디션을 고치려면 먼저 저장해야 생성할 수 있어서다.
- 순서: 올린 뒤 매니페스트에 넣고, 매니페스트에서 뺀 뒤 지운다. 그래서 목록에 있는 에디션은 늘 받을 수 있다. 공개 중인 에디션을 삭제하면 R2 객체도 지운다.
- 쓰기 클라이언트: `features/admin-print/server/storage.ts`(`uploadEdition`, `removeEditionObjects`, `storageReady`). 지울 때는 공개하지 않는 A3 키도 지운다.
- 문구: 어드민 첫 화면의 "저장 위치를 정하기 전까지 공개하지 마세요"를 R2 흐름으로, 삭제 확인에 "공개 중이면 R2의 PDF도 지워요", 상태 안내를 고쳤다. 375 폭에서 상태 세그먼트가 긴 안내에 밀려 "초안"만 보이던 것을 줄바꿈 + `shrink-0`으로 고쳤다.
- 확인(개발 서버, 시험 에디션 `month-poster-2`를 만들고 끝에 삭제): PDF 없이 공개 → "PDF를 만든 뒤 공개하세요." / 생성 후 공개 저장 → R2 `downloads/month-poster-2/a4.pdf`(로컬과 같은 1,369,555B), 매니페스트에 들어감, 우리 주소로 받으면 200 `application/pdf` / 공개 중 옵션 변경 · 저장 → R2 그대로, 다시 생성 → R2가 새 파일(418,403B)로 바뀜 / 내림 저장 → R2 비고 `withdrawn`에 남음, 옛 주소는 상세로 302 / 다시 공개 → 올라감 / 삭제 → R2 · 로컬 · 매니페스트 모두 비움. 막힘 안내를 375 · 1280에서 확인, 콘솔 오류 없음. 루트 typecheck · lint(오류 0) · test 통과.
