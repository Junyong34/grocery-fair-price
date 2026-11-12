# 11. 루트 README

Status: resolved
Type: task
Blocked by: 07 (resolved), 08 (resolved)

## 목적

루트 `README.md`를 장볼날을 처음 보는 사람을 위한 서비스 소개로 쓴다 (명세 결정 26).

## 할 일

- [x] 지금 제공하는 기능을 화면 기준으로 설명한다: 시세와 가격 판정, 제철달력과 먹음 기록, 이유식 궁합, 인쇄물 다운로드. 실제 라우트와 대조해 없는 기능을 쓰지 않는다.
- [x] 개발 구조와 명령은 쓰지 않고 `docs/project-structure.md`로 연결한다. 에이전트 규칙은 `AGENTS.md`로 연결한다.
- [x] 용어는 `grocery-price/GLOSSARY.md`를 따른다.

## 완료 기준

README에 적힌 기능마다 대응하는 화면 주소가 있다.

## Comments

2026-11-12: 루트 `README.md`를 서비스 소개로 다시 썼다. 기능 네 묶음(시세와 판정, 제철달력과 먹음 기록, 이유식 궁합, 인쇄물 다운로드)마다 화면 주소를 적고 `apps/web/app`의 라우트와 대조했다(모두 있음). 이전 README의 폴더 구조와 `pnpm ui:add` 안내는 `docs/project-structure.md`와 `AGENTS.md`에 이미 있어 옮기지 않고 뺐다. 운영 주소는 코드에서 확인하지 못해 적지 않았다.
