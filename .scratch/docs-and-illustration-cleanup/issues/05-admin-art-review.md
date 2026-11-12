# 05. 그림 어드민: 목록과 그림 검수

Status: ready-for-agent
Type: task (prototypes/가 있는 기기에서)
Blocked by: 03 (resolved)

## 목적

사용자가 그림을 보고 그림 검수를 판정하는 화면을 만든다 (명세 결정 13~15).

## 할 일

- [ ] `features/admin-print`, `features/admin-catalog`의 구조(서버 파일 쓰기, `adminEnabled` 가드, `admin-shell` 메뉴)를 읽고 같은 틀로 `features/admin-foods/`를 만든다. 라우트는 `routes`에 더하고 `shared/seo/pages.ts`에 noindex로 등록한다.
- [ ] 그림 목록: `prototypes/`의 그림 폴더와 `art.json`을 읽어 검수 상태별로 보여 준다. 미검수가 먼저.
- [ ] 그림은 `prototypes/`의 kit으로 렌더해 보여 준다(웹 SVG가 아직 없는 그림이 있다). 정지 그림과 움직임을 함께 본다.
- [ ] 그림 상세: `NOTES.md` 내용, 참고 출처, 지금 가리키는 화면(제철 품종, 이유식)을 보여 준다.
- [ ] 검수 완료 / 미검수로 되돌리기 저장. `art.json`만 쓴다.
- [ ] `prototypes/`가 없으면 안내 문구만 보여 준다.

## 완료 기준

- 1280 폭에서 미검수 그림을 검수 완료로 바꾸면 `art.json`이 바뀌고 목록에 반영된다. 콘솔 오류가 없다.
- 운영 빌드에서 이 경로는 404다.
