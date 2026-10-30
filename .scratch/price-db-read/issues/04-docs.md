# 04. 문서 정리

Status: resolved
Type: task (AFK)
Blocked by: -

## 목적

이번 결정을 기존 문서에 반영한다. ADR 0004(`grocery-price/docs/adr/0004-judgment-payload-is-screen-shape.md`)는 스펙과 함께 썼다.

## 할 일

- [x] `.scratch/ingest-foundation/issues/06-web-read-path.md`: "아직 열림"의 캐시 항목에 이 스펙의 결정(목록 hours · 검색 days · 상세 캐시 없음)을 적고, 갱신 신호와 `freshness` · `notices`는 범위 밖으로 남았다고 적는다
- [x] `grocery-price/docs/00-overview/roadmap.md` ④ "웹앱이 DB를 읽는 경로"에 이 스펙 링크
- [x] `grocery-price/docs/30-data/pipeline.md` 4-1 · 4-3: payload 검사 스키마가 `packages/price/src/schema.ts`라고 적는다(01이 끝난 뒤)

## 완료 기준

- 링크가 모두 실제 파일을 가리킨다.

## Comments

2026-10-30 1·2항 완료, 3항은 01 뒤. (06의 "아직 열림" 캐시 항목에 스펙 결정과 링크를 적고 갱신 신호 · `freshness` · `notices`는 범위 밖으로 남겼다고 적었다. roadmap ④에 스펙 경로를 더했다.)

2026-10-30 3항 완료(02와 함께). pipeline.md 4-1에 읽을 때 검사 스키마가 `packages/price/src/schema.ts`(상세 `varietyDetailSchema`, 목록 `varietySummarySchema`)라고 적고, 4-3에 어긋난 행 처리(목록은 빼고 상세는 오류 화면)와 캐시 정책(목록 hours · 검색 days · 상세 없음, 갱신 신호는 아직 열림)을 적었다.
