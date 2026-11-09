# 06. AI 제안 흐름 (로컬 에이전트)

Status: needs-triage
Type: task
Blocked by: 04, 05

## 목적

pending 원천 키와 새 상품을 사람이 하나씩 보지 않게, 로컬 Claude Code 세션이 분류 제안을 쓰고 사람은 어드민(07)에서 승인만 한다.

## 흐름

1. `catalog pending --json [--source …] [--since 30]`: 원천 키·원문 이름·단위·출처 분류·최근 관측일·남은 관측값 수·비슷한 기존 품종(이름 일치)을 내보낸다. 읽기 전용 트랜잭션
2. 프로젝트 스킬(예: `/catalog-propose`)이 그 JSON과 GLOSSARY·variety-list 규칙 1~5·카테고리 대응표를 읽고 제안을 만든다. 제안마다 근거 한 줄과 확신 정도
3. `catalog propose --file proposals.json`이 제안 표(`catalog_proposal`)에 `proposed`로 넣는다. 같은 원천 키에 열린 제안이 있으면 덮지 않고 알린다
4. 승인 전에는 화면·매핑에 아무 영향이 없다

## 규칙

- 이름이 같다는 이유만으로 같은 규격에 넣지 않는다 (catalog-evolution/03 그룹핑 규칙)
- 원산지·등급·크기·보관 상태가 다르면 다른 규격, 원산지가 다르면 다른 품종 (variety-list 규칙)
- 근거가 부족하면 "보류"를 제안한다. 추측해서 붙이지 않는다
- 처리 순서: 최근 30일 안에 관측된 것부터 (KAMIS 관측값은 90일 뒤 지워진다)

## 할 일

- [ ] `pending --json`, `propose --file` 명령과 테스트
- [ ] 제안 스킬 작성 (`mattpocock-skills:writing-for-agents` 기준)
- [ ] 첫 실행: 지금 pending 전부와 참가격 가공식품 386개에 제안을 만들어 본다. 승인율·틀린 유형을 `## Answer`에

## 완료 기준

- 한 번의 세션으로 pending 전체에 제안이 생기고, 사람이 어드민에서 볼 수 있다.
