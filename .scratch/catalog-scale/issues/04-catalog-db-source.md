# 04. 카탈로그 DB 원본 전환

Status: needs-triage
Type: task
Blocked by: 01, 02

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
- [ ] 로컬 개발 DB를 운영 카탈로그로 채우는 길 (`seed.sql`이나 `catalog export|import`)
- [ ] pipeline.md 카탈로그 절, variety-list.md 머리말을 고친다

## 결정할 것 (needs-triage)

- slug 규칙은 그대로 둔다: 한 번 정한 slug는 바꾸지 않는다(catalog-evolution/02)
- 가공식품 상품을 `product` 표 그대로 쓸지, 화면 공개 여부·카테고리 열을 더할지

## 완료 기준

- `varieties.ts`를 고치지 않고 DB만 바꿔도 다음 수집·판정에 반영된다. `pnpm db:test` 통과.
