# 카탈로그 제안 쓰기 (로컬 에이전트용)

catalog-scale/06. 아직 규격에 잇지 않은 원천 키(pending)와 참가격 상품마다 분류 제안을 쓰고 `price.catalog_proposal`에 `proposed`로 넣는 절차다. 로컬 Claude Code 세션이 `/catalog-propose`로 이 문서를 따른다(스킬 파일은 `.claude/skills/catalog-propose/SKILL.md`, gitignore라 로컬에만 있다). 사람은 어드민(07)이나 `catalog apply|reject --ids`(08)로 승인·반려하고, 승인 전에는 매핑·화면에 아무 영향이 없다. 적용한 제안은 `catalog revert --ids`로 되돌린다.

명령은 저장소 루트에서 `pnpm --filter @workspace/price-ingest catalog …`이다. 운영을 볼 때는 `node --env-file=../../.env src/catalog/cli.ts …`를 `packages/price-ingest`에서 부른다(`.env` 값은 출력하지 않는다).

## 단계

1. **내보내기.** `catalog pending --json --since 30 > <스크래치>/pending.json` (읽기만, `INGEST_DATABASE_URL`). 최근 30일 것을 먼저 하고, 다 끝나면 `--since` 없이 나머지를 한다. KAMIS 관측값은 90일 뒤 지워지니 최근 것이 급하다. `openProposal`이 있는 항목은 건너뛴다.
   완료: 다룰 항목 목록과 개수가 정해졌다.
2. **읽기.** [GLOSSARY](../../GLOSSARY.md)의 카테고리·품목·품종·규격·상품, [variety-list.md](variety-list.md)의 "정한 규칙" 1~7, 저장소 사본 `packages/price-ingest/src/catalog/snapshot.json`(기존 품종의 slug·기준 단위·규격 이름과 원천 키). 출처 분류 대응표(`category_source_map`, 05)가 생기면 그것도.
   완료: 항목마다 `similar`에 나온 품종의 규격과 원천 키를 사본에서 찾아 봤다.
3. **판단.** 항목마다 아래 "판단 규칙"으로 kind 하나를 고르고, 근거 한 줄과 확신을 쓴다.
   완료: 1단계 목록의 모든 항목에 제안이 하나씩 있다(모르면 `hold`).
4. **파일 쓰기.** 제안을 `<스크래치>/proposals.json`에 배열로 쓴다(모양은 아래). `catalog propose --file <스크래치>/proposals.json --dry-run`(`OWNER_DATABASE_URL`)으로 검사한다. 틀린 slug·없는 원천 키가 있으면 파일 전체가 거절되니 고쳐서 다시 돌린다.
   완료: `--dry-run`이 `inserted`에 모든 항목을 보이고 오류가 없다.
5. **넣기.** 운영 DB에 쓰는 일이라 사용자 승인을 받은 뒤 `--dry-run` 없이 돌린다. `skipped`(열린 제안이 이미 있던 키)는 그대로 둔다.
   완료: kind별 개수, `hold` 목록, 확신 `low` 목록을 사용자에게 보고했다.

## 판단 규칙

KAMIS 원천 키는 `품목-품종-등급`이고 `label`은 `품목/품종/등급` 원문이다. 대부분 기존 품종의 **변형**이다: 등급(`04` 상품, `05` 중품), 크기(大·中·小, L과·M과), 보관 상태(신선 냉장·냉동·염장).

- **원산지가 다르면 다른 품종, 보관 상태·크기·등급은 규격** (variety-list 규칙 3·4). `고등어/국산(냉동)/大`는 `mackerel-kr`의 규격이고, `오렌지/네이블 호주`가 기존 오렌지와 원산지가 다르면 새 품종이다.
- 그 변형에 맞는 규격이 이미 있으면 `map`, 없으면 `new_spec`. 새 규격 slug는 같은 품종의 형제 규격 이름을 따른다(`chilled-m`·`frozen-l`처럼). 기본 규격은 바꾸지 않는다.
- 사람이 다른 식재료로 인식하면 `new_variety` (규칙 2). 기준 단위는 규칙 5에서 고른다.
- **이름이 같다는 이유만으로 같은 규격에 넣지 않는다** (catalog-evolution/03). `similar.byName`은 후보일 뿐이고, 원산지·등급·크기·보관 상태를 원문에서 다시 확인한다.
- 단위가 기준 단위로 나눠지지 않으면(마리 ↔ 100g, 1손) 그 사실을 근거에 쓰고 확신을 낮춘다. 환산 기준이 정해질 때까지 기준 단위 가격은 비어 있다.
- 1년 넘게 오지 않은 키(`lastSeen`이 13개월보다 오래됐고 `observations` 0)는 `ignore`, 이유 "YYYY-MM부터 오지 않는다". 햇양파·시설감자처럼 철마다 돌아오는 키는 13개월 안이면 잇는다.
- 참가격 상품은 품목이 먼저다(GLOSSARY "상품": 언제나 품목에 속하고 품종은 선택). 신선식품으로 품종까지 확실하면 `product_item`에 `variety`·`spec`을 함께, 품목만 확실하면 `item`만.
- 이미 보류 규칙(`hold`)이 있는 항목은 그 이유를 풀 새 근거가 있을 때만 제안한다. 없으면 `hold`로 같은 이유를 다시 쓴다.
- **근거가 부족하면 `hold`.** 추측해서 붙이지 않는다.

확신: `high` 원문이 원산지·등급·크기·보관 상태를 다 말하고 맞는 규격이 하나뿐이다. `medium` 하나를 추론했다(예: 크기 이름). `low` 둘 이상을 추론했거나 단위가 맞지 않는다.

근거는 무엇을 보고 정했는지 한 줄: "원문 `국산(냉동)/大`: 원산지 국산, 냉동, 大 → mackerel-kr에 냉동 大 규격이 없다".

## 제안 파일 모양

`packages/price-ingest/src/catalog/proposal.ts`의 `parseProposalFile`이 검사한다. 항목마다 `source`, `key`(pending의 `key` 그대로), `kind`, `proposal`, `rationale`, `confidence`(`high`·`medium`·`low`, 생략 가능).

| kind | proposal |
|---|---|
| `map` | `{ "variety": "mackerel-kr", "spec": "frozen-l" }` |
| `new_spec` | `{ "variety": "mackerel-kr", "spec": { "slug": "frozen-l", "name": "냉동 대" } }` |
| `new_variety` | `{ "item": "orange", "variety": { "slug": "orange-au", "name": "오렌지(호주)", "unit": "1개" }, "spec": { "slug": "default", "name": "상품" } }`. 새 품목이면 `item`을 `{ "slug", "name", "category" }`로 |
| `product_item` | `{ "item": "sesame" }` 또는 `{ "item": "sesame", "variety": "sesame-kr", "spec": "default" }` (참가격만) |
| `ignore` · `hold` | `{ "reason": "2024-08부터 오지 않는다" }` |

```json
[
  { "source": "kamis", "key": "611-06-20", "kind": "new_spec",
    "proposal": { "variety": "mackerel-kr", "spec": { "slug": "frozen-l", "name": "냉동 대" } },
    "rationale": "원문 국산(냉동)/大: 국산·냉동·大, mackerel-kr에 냉동 규격이 없다", "confidence": "high" }
]
```
