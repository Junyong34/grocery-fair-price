# 02. manifest 모양 바꾸기

Status: resolved
Blocked by: —

## 목적

사용자 화면이 썸네일 미리보기·내려간 에디션 안내를 그릴 수 있고, 공개 용지가 A4뿐인 manifest를 만든다. 스펙 "데이터 모양" 절.

## 할 일

- [ ] 순수 함수 테스트 먼저(`edition.test.ts`): `buildManifest`가 공개 용지만 담는다, 미리보기 값(썸네일 경로·크기, 연도, 방향, 쪽 수)을 담는다, 내려간 에디션을 `withdrawn`에 담는다, 설명이 빈 게시 에디션을 거부한다.
- [ ] `PUBLISHED_PAPERS = ["A4"]` 상수(`print/spec.ts` 또는 `edition.ts`). 생성기는 계속 `PAPER_SIZES` 전부를 만든다.
- [ ] 에디션 상태에 "내림"을 더할지(`withdrawn`), 별도 목록으로 둘지 정한다. 상태 하나로 두는 쪽이 어드민이 단순하다.
- [ ] 파일 경로는 R2 키가 아니라 우리 다운로드 주소(`routes.seasonal.downloadFile(id, paper)` 등).
- [ ] 생성기(`features/admin-print/server/generate.ts`)가 A4 페이지에서 1쪽(월간 달력은 표지 + 1월 쪽)을 WebP로 찍어 `public/downloads/<id>/thumb-<n>.webp`에 쓴다. 폭은 목록·시트에 맞춰 2배 밀도(예: 480px). 생성 기록에 경로·크기를 남긴다. `.gitignore`는 PDF만 막으므로 썸네일은 커밋된다.
- [ ] 기존 `/seasonal/downloads` 화면이 새 모양으로 타입 검사를 통과하게 최소 수정(용지 세그먼트 제거). 화면 재설계는 05.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.

## Answer

2026-10-29 완료.

- 내린 에디션은 상태 하나로 둔다: `EDITION_STATUSES = draft | published | withdrawn`. 어드민 "내려받기 화면" 칸의 스위치를 세그먼트(초안 · 공개 · 내림)로 바꿨다. 공개면 설명이 있어야 한다(`parseEdition`의 refine, 저장 때 오류).
- `PUBLISHED_PAPERS = ["A4"]`(`print/spec.ts`). 생성기는 `PAPER_SIZES`(A4 · A3)를 그대로 만든다.
- 매니페스트 항목: `files: { A4: { bytes } }`(경로 없음, 화면이 `routes.seasonal.downloadFile(id, paper)`로 만든다), `year?`, `orientation`, `pages`, `thumbnails`. 최상위에 `withdrawn: { id, kind, title, year? }[]`.
- 썸네일: 생성기가 A4 페이지에서 `thumbnailPages`(월간 달력 + 표지면 `[0, 1]`, 나머지 `[0]`)의 `.print-sheet`를 2배 밀도로 찍고 sharp로 폭 480 WebP(품질 80)로 줄여 `public/downloads/<id>/thumb-<n>.webp`에 쓴다. 쓰지 않게 된 PDF · WebP는 지운다. `apps/web` devDependency에 `sharp@0.35.5`(루트와 같은 판).
- 사용자 화면 최소 수정: 용지 세그먼트를 빼고 A4 링크 하나. `seasonal:settings`의 `paper` 필드는 뺐다(키는 그대로, 남은 값은 읽지 않는다). 문구에서 A3를 뺐다. 링크 주소(`/seasonal/downloads/<id>/a4`)는 06에서 생긴다.
- 확인: 루트 typecheck · lint(오류 0) · test 통과. 어드민에서 `monthly-1`을 실제로 생성해 썸네일 2장(표지 · 1월, 각 약 8KB, 480×679)이 제대로 찍힌 것을 눈으로 확인한 뒤 결과물을 지웠다. `/seasonal/downloads`, `/admin/edit` 375 · 1280 콘솔 오류 · 가로 넘침 없음.
