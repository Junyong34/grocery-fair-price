# 04. 카탈로그 DB 원본 전환

Status: claimed
Type: task
Blocked by: 01

## 목적

카테고리·품목·품종·규격·매핑의 원본을 `varieties.ts`·`match.ts`에서 DB 표로 옮긴다. 이후 변경은 어드민(07)과 승인 적용(08)으로만 한다.

## 지금 구조

- `catalog --classes`(소유자 접속)가 `varieties.ts`대로 분류 표를 맞추고 코드에 없는 품종을 `hidden`으로 바꾼다. `--mappings`(`ingest_writer`)가 매핑을 넣고 관측값을 다시 매핑한다.
- 적재(`loadRawFile`)는 `match.ts` 색인으로 처음 본 키를 잇고, 없으면 pending으로 둔다.
- `KAMIS_EXCLUDED`·`CHAMGA_UNDECIDED`가 제외·보류 사유를 코드에 둔다.

## 할 일

- [ ] 새 마이그레이션: 제안 표(`catalog_proposal`: 대상 원천 키, 제안 종류 연결·새 규격·새 품종·새 상품·제외·보류·묶기, 제안 내용 jsonb, 근거, 만든 주체, 상태 proposed·approved·rejected·applied)와 변경 기록 표(`catalog_change`: 누가·언제·무엇을·전후 값). `comment on`, RLS, ERD 그룹, `helpers.ts` 목록
- [ ] 제외·보류 사유를 코드 상수에서 `source_code_map.note`(또는 새 열)로 옮긴다
- [ ] 적재가 처음 본 키를 이을 때 코드 색인 대신 DB의 `source_code_map`을 읽는다 (실행 시작에 한 번 읽어 메모리 색인)
- [ ] `varieties.ts` → DB 한 번 옮기기. 그 뒤 `catalog --classes`가 DB를 덮어쓰지 않게 끄거나 지운다. `variety-list.md`와 코드가 같은지 보는 테스트는 DB 보고서로 바꾼다
- [ ] **카탈로그 내보내기 = 백업** (ADR 0005): `catalog export`가 카탈로그 표(카테고리·품목·품종·규격·별칭·상품 분류·원천 매핑·제외 사유·변경 기록)를 저장소의 JSON으로 쓴다. 승인 적용(08)이 끝날 때마다 돌려 커밋한다. `catalog import`가 그 파일로 로컬 DB를 채운다. 운영에서 되살리는 절차도 한 번 연습한다
- [ ] pipeline.md 카탈로그 절, variety-list.md 머리말을 고친다

## 결정할 것 (needs-triage)

- slug 규칙은 그대로 둔다: 한 번 정한 slug는 바꾸지 않는다(catalog-evolution/02)
- 상품은 언제나 품목에 속하고 품종은 선택이다 (GLOSSARY, 01). `product`에 품목 열과 화면 공개 여부를 더한다. 지금 `product_variety_map`(상품 → 품종)은 그대로 쓴다

## 완료 기준

- `varieties.ts`를 고치지 않고 DB만 바꿔도 다음 수집·판정에 반영된다. `pnpm db:test` 통과.

## 진행 기록

**2026-11-10 (코드, 운영 적용 전)**
- **코드에만 있던 것은 "아직 들어온 적 없는 원천 키의 규칙"이었다.** 매핑 결과(`source_code_map`, `product_variety_map`)와 분류 표는 이미 DB에 있었다. 철마다 코드가 바뀌는 배추·무(`211-*-04`), 철이 와야 처음 오는 품목, 제외(쌀 20kg)·보류(볶음참깨)가 `match.ts`에만 있었다. 이것을 새 표 `price.catalog_key_rule`(map·ignore·hold, 사유)로 옮겼다.
- 마이그레이션 `20261110000100_price_catalog_db_source.sql`: `catalog_key_rule`, `catalog_proposal`(06·07이 쓸 제안), `catalog_change`(변경 기록), `item.sort`, `variety.sort`, `variety.price_spread`(쌀 안내, 판정이 읽는다), `product.item_id`(상품은 언제나 품목에, GLOSSARY). 운영자 표라 `ingest_writer`는 읽기만.
- `varieties.ts`·`match.ts`를 지우고 `src/catalog/snapshot.json`(품종 136, 규격 200, 규칙 288, 예외 7)으로 바꿨다. `types.ts`(모양), `snapshot.ts`(zod 검사), `rules.ts`(규칙 행 → 원천 키 찾기, 사본 차이), `db.ts`(내보내기·가져오기·규칙 읽기).
- 명령: `catalog --export`(DB → 사본, ingest_writer 읽기 전용), `--import`(사본 → DB, 소유자, 바뀐 품종·예외를 `catalog_change`에), `--mappings`(규칙대로 매핑). `--classes`는 없앴다.
- 적재(`applyMappings`)·백필(대표 품목)·판정(`price_spread`)이 DB를 읽는다. 규칙 없는 키는 pending, `ignore` 규칙인 pending 키는 ignored로 바뀐다(새 동작).
- 테스트: 규칙 함수 5개(`catalog-rules.test.ts`), 사본 왕복·변경 기록·지움·권한 DB 테스트 4개(`catalog-snapshot.db.test.ts`). 기존 카탈로그·백필 테스트는 사본을 읽게 고쳤다. 커밋하는 백필 테스트는 대표 품목을 `deps.kamisPrimary`로 받는다.
- 잃은 것: `varieties.ts`의 품종별 설명 주석(쌀 20kg를 뺀 이유 등). 제외 사유는 규칙의 `reason`으로 옮겼고, 나머지는 git 기록과 variety-list.md의 메모 열에 있다.

**운영 적용 순서** (push 전에): ① 마이그레이션 → ② `catalog --import --dry-run`으로 바뀔 것 확인(숨겨질 품종이 없어야 한다) → ③ 실제 가져오기 → ④ `catalog --mappings --dry-run`이 아무것도 바꾸지 않는지 → ⑤ `catalog --export`로 운영 사본을 다시 써서 커밋 → push.

**2026-11-09 운영 적용** (사용자 승인)
1. 마이그레이션 `20261110000100` 적용 (`supabase db push`, 소유자, 주소 가림).
2. `catalog --import --dry-run`: 숨길 품종 0, 바뀌는 것은 품종 136개(원천 키·`price_spread`가 처음 채워짐)와 예외 7개 추가뿐. 가져오기 전 운영 카탈로그를 내보내 사본과 원천 키 빼고 비교: 카테고리 같음, 품목은 순서만 다름(운영에 정렬 값이 없었다), 품종 136개 이름·규격·제철 모두 같음.
3. 실제 가져오기: 규칙 288개, 변경 기록 143건. 같은 사본을 다시 가져오면 변경 0.
4. `catalog --mappings --dry-run`: 새 매핑 0, 바뀐 매핑 0, 충돌 0, 다시 매핑한 관측값 0, 다시 계산한 시세 0. pending 63건은 그대로.
5. 운영에서 다시 내보낸 사본이 저장소 `snapshot.json`과 같다(diff 없음).

**남은 것**: 다음 KAMIS 정기 실행(11-10)에서 적재·판정(`price_spread`)이 DB 규칙으로 돌고 쌀 안내가 판정 묶음에 남는지 보고 닫는다.
