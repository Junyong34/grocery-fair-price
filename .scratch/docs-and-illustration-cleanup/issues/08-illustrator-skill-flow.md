# 08. 스킬: 새 그림 한 장 절차

Status: ready-for-agent
Type: task (prototypes/와 .claude/skills/가 있는 기기에서)
Blocked by: 06 (resolved)

## 목적

프롬프트 한 줄로 새 그림이 미리보기까지 만들어지고 어드민으로 넘어가게 한다 (명세 결정 19~21).

대상 프롬프트: "새로운 품종 그림을 그리려고 해. XX 품종의 체크리스트와 특징을 문서에 적고 일러스트 스킬로 그림을 만들고 웹 동기화까지 진행해 줘."

## 할 일

- [ ] `writing-for-agents` 스킬로 `.claude/skills/seasonal-food-illustrator/SKILL.md`에 "새 그림 한 장 끝까지" 절을 쓴다.
  - 시작할 때 확인할 곳: 기존 그림(`foods/<id>/`), 진행 중인 작업(미검수 `art.json`), 출처와 검수 기록(`NOTES.md`, `art.json`, `PROVENANCE.md`), 품종 원본.
  - 차례: 그림 ID 발번(기존 ID·옛 ID와 겹치지 않게) → `NOTES.md`에 특징과 체크리스트 → 작도 → `art.json` 미검수 → 미리보기 렌더 → 어드민 주소 안내.
  - 중간에 멈추지 않는다. 그림 검수, 용도 지정, 웹 반영은 사용자가 어드민에서 한다.
  - 제철은 조사하거나 등록하지 않는다. 끝에 남은 절차를 제안한다.
- [ ] "웹 동기화까지"라는 요청을 받아도 미검수 그림은 웹에 나가지 않는다는 점과 그 이유를 적는다.
- [ ] `references/`의 기록 위치 설명(`provenance.md`, `request-template.md`)을 `art.json` 기준으로 맞춘다.
- [ ] 실제로 품종 하나를 골라 프롬프트를 그대로 넣어 끝까지 돌려 본다.

## 완료 기준

새 세션에서 대상 프롬프트만으로 미리보기와 미검수 `art.json`이 생기고, 어드민에서 검수와 용도 지정을 마치면 웹에 나온다.
