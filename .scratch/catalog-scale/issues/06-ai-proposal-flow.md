# 06. AI 제안 흐름 (로컬 에이전트)

Status: in-progress (명령·절차 완료, 첫 실행은 pending 63개만. 가공식품은 05 뒤)
Type: task
Blocked by: 04 (05는 가공식품 첫 실행만 막는다. 2026-11-09 사용자 결정으로 앞당김)

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

- [x] `pending --json`, `propose --file` 명령과 테스트 (`src/catalog/pending.ts`·`proposal.ts`, 제안은 소유자 접속으로만 넣는다)
- [x] 제안 절차 작성: `grocery-price/docs/30-data/catalog-propose.md` (`.claude/`가 gitignore라 로컬 스킬 `/catalog-propose`는 이 문서를 가리키기만 한다)
- [ ] 첫 실행: pending 63개(KAMIS 55·축평원 3·참가격 보류 5)는 2026-11-09 운영에 제안 #64~126으로 넣었다(new_spec 29·ignore 20·hold 6·product_item 5·new_variety 3). 참가격 가공식품 386개는 05 뒤에. 승인율·틀린 유형은 승인(07) 뒤 `## Answer`에

## 완료 기준

- 한 번의 세션으로 pending 전체에 제안이 생기고, 사람이 어드민에서 볼 수 있다.
