# 05. 그림 어드민: 목록과 그림 검수

Status: resolved
Type: task (prototypes/가 있는 기기에서)
Blocked by: 03 (resolved)

## 목적

사용자가 그림을 보고 그림 검수를 판정하는 화면을 만든다 (명세 결정 13~15).

## 할 일

- [x] `features/admin-print`, `features/admin-catalog`의 구조(서버 파일 쓰기, `adminEnabled` 가드, `admin-shell` 메뉴)를 읽고 같은 틀로 `features/admin-foods/`를 만든다. 라우트는 `routes`에 더하고 `shared/seo/pages.ts`에 noindex로 등록한다.
- [x] 그림 목록: `prototypes/`의 그림 폴더와 `art.json`을 읽어 검수 상태별로 보여 준다. 미검수가 먼저.
- [x] 그림은 `prototypes/`의 kit으로 렌더해 보여 준다(웹 SVG가 아직 없는 그림이 있다). 정지 그림과 움직임을 함께 본다.
- [x] 그림 상세: `NOTES.md` 내용, 참고 출처, 지금 가리키는 화면(제철 품종, 이유식)을 보여 준다.
- [x] 검수 완료 / 미검수로 되돌리기 저장. `art.json`만 쓴다.
- [x] `prototypes/`가 없으면 안내 문구만 보여 준다.

## 완료 기준

- 1280 폭에서 미검수 그림을 검수 완료로 바꾸면 `art.json`이 바뀌고 목록에 반영된다. 콘솔 오류가 없다.
- 운영 빌드에서 이 경로는 404다.

## Comments

2026-11-12: 마쳤다. 주소는 `/admin/foods`, 메뉴는 "제철 그림 › 그림 검수".

- 미리보기는 `scripts/render-art-previews.mjs`가 그림 원본에서 그려 `node_modules/.cache/art-preview/<그림 ID>/{color,motion}.svg`에 둔다(321개 1.3초, 바뀐 그림만 다시 그린다). 그림체와 바닥 그림자를 `foods:sync`와 같게 해서 검수한 그림과 웹에 나가는 그림이 같다(`abalone/color.svg`가 웹 파일과 바이트까지 같다). 어드민 서버는 kit을 import하지 않고 이 스크립트를 실행한다.
- 목록은 미검수가 먼저이고 상태 · 이름 · 그림 ID로 거른다. 상세에 정지 그림과 움직임, 가리키는 화면(제철달력 / 제철 미검증 / 이유식), 참고 자료, `NOTES.md`가 나온다.
- 판정은 `art.json`만 쓴다. 검수 완료에는 오늘(서울) 날짜를 `reviewedAt`에 적고, 되돌리면 지운다.
- 1280 폭에서 확인: 미검수 25 · 검수 완료 296 · 전체 321, 깨진 그림 0, 가로 넘침 없음, 콘솔 오류 없음. 강황을 검수 완료로 바꾸면 `art.json`과 목록 숫자가 바뀌고, 되돌리면 원래대로 돌아온다(확인 뒤 되돌려 두었다. 사용자의 판정은 하나도 하지 않았다).
- 카탈로그의 `season`은 보여 주지 않는다(03의 Comments).

**빌드에서 배운 것**: `path.join(ART_DIR, id, file)`처럼 저장소 루트 아래 경로를 만들면 Turbopack이 그 패턴에 맞는 `prototypes/`의 파일 수십만 개를 추적한다고 경고한다. 경로를 만드는 곳(`path.join(/*turbopackIgnore: true*/ …)`)과 읽는 곳 모두에 `turbopackIgnore`를 달아 경고를 없앴다. 06·07에서 이 폴더에 파일 접근을 더할 때 같은 규칙을 따른다.

**확인하지 못한 것**: 운영 404는 기존 어드민과 같은 가드(`app/admin/layout.tsx`의 `adminEnabled`, 라우트 핸들러의 `adminEnabled`)를 쓰는 것으로만 확인했다. 로컬 `next build`는 컴파일까지 통과하고 `/products/[product]` 프리렌더(`"use cache"` 시간 초과)에서 멈춘다. 이 화면은 이번 변경과 무관하고, 이 변경 전에도 멈추는지는 확인하지 않았다.
