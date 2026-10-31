# 식자재 시세 판정 서비스 (가칭)

> "이 애호박 2,980원, 비싼 건가?"에 3초 안에 답하는 도구.
> 최저가 검색이 아니라 **적정가 판단**을 돕는다.

**현재 단계: ①~④가 겹쳐 진행 중** · 세 출처를 매일 수집해 판정을 내고, 가격 화면(`apps/web`의 `/`, `/search`, `/prices/[variety]`, `/basket`)이 운영 DB를 읽는다. 남은 것은 백필 · 장애 처리 마무리와 운영 배포다. 전체 단계와 완료 기준은 [로드맵](docs/00-overview/roadmap.md)에 있다 (2026-10-19 P0~P11에서 4단계로 재편).

## 진행 현황

| 단계 | 상태 |
|---|---|
| P0 기획·조사 | ✅ 완료 |
| P1 도메인 모델링 | ✅ 완료 (2026-10-08) |
| ① 수집 기반 | 🔄 거의 끝남 (스키마 · 정기 수집 · 알림 · 하트비트 완료. 남은 것: 축평원 백필(11-09 무렵), 빈 날 채우기, 재등록 감시, 장애 상황 테스트) |
| ② 판정 설계 | 🔄 거의 끝남 ([judgment.md](docs/30-data/judgment.md) 계산식 · 구간 · 신뢰도 확정. 남은 것: 축산 규격 다시 보기, 점포 데이터가 없는 품종 대응) |
| ③ 화면 콘텐츠 설계 | ✅ (`.scratch/price-screens/spec.md`, 정부 화면 벤치마킹은 `.scratch/search-first-view`) |
| ④ 구현 | 🔄 화면 · DB 읽기 경로 완료 (`.scratch/price-db-read`). 남은 것: 운영 배포, 운영계정 전환, sitemap 제출 |

## 문서 지도

**개요**
- [roadmap.md](docs/00-overview/roadmap.md): 4단계(수집 기반·판정 설계·화면 설계·구현), 산출물, 완료 기준, 확장 단계
- [product-concept.md](docs/00-overview/product-concept.md): 문제 정의, 차별점, 판정 UI, 표시 항목, 유입 콘텐츠, 도메인 개념 초안

**도메인 (P1)**
- [GLOSSARY.md](GLOSSARY.md): 용어집. 문서와 화면은 모두 이 용어를 쓴다
- [domain-model.md](docs/20-domain/domain-model.md): 분류 계층, 검색 흐름, 가격 개념, 단위 규칙, 시나리오, 결정 이력, 열린 질문

**결정 기록** (`docs/adr/`)
- [0001](docs/adr/0001-public-data-and-reports-over-crawling.md): 가격 데이터는 공공데이터와 제보로 확보하고, 쇼핑몰 크롤링은 하지 않는다
- [0002](docs/adr/0002-supabase-and-github-actions.md): 정제 데이터는 Supabase Postgres, 원본 응답은 Supabase Storage, 수집은 GitHub Actions
- [0003](docs/adr/0003-print-pdfs-on-r2-behind-route-handler.md): 인쇄물 PDF는 비공개 Cloudflare R2에 두고, 우리 주소의 짧은 서명 링크로만 내준다
- [0004](docs/adr/0004-judgment-payload-is-screen-shape.md): 판정 payload는 화면 모양(`VarietyDetail`) 그대로 저장한다

**조사 (P0)**
- [data-sourcing-legal.md](docs/10-research/data-sourcing-legal.md): 크롤링 법적 리스크, 판례, 약관, 합법적 데이터 확보 전략
- [public-data-survey.md](docs/10-research/public-data-survey.md): 참가격·KAMIS·축평원·수산물 공공데이터를 한 장에 비교한 개요
- [images.md](docs/10-research/images.md): 이미지 저작권, 무료 소스 (AI 생성 계획은 손그림 SVG로 대체됨)
- [content-and-taxonomy.md](docs/10-research/content-and-taxonomy.md): 레시피·제철 데이터, 분류 체계, 단위가격 표시제, 해외 사례

**API 실측과 수집 설계** (①)
- [api-spec.md](docs/10-research/api-spec.md): 요청·응답 명세와 실측으로 확인한 명세 불일치. API를 호출하기 전에 읽는다
- [gov-price-sites.md](docs/10-research/gov-price-sites.md): 참가격 생필품 화면과 API 대조, 다른 정부·공공 가격 출처 판정
- [pipeline.md](docs/30-data/pipeline.md): 저장 구조, 테이블, 수집 일정, 장애 처리, 실행 환경
- [sources/](docs/30-data/sources/): 출처별 실측 동작 (`kamis.md`, `ekape.md`, `chamgagyeok.md`)과 품목 전수 목록(`item-inventory.md`). 해당 API를 부르기 전에 읽는다
- [judgment.md](docs/30-data/judgment.md): 평소가 · 판정 계산식, 구간, 신뢰도, 데이터가 부족할 때의 동작
- [schema-map.html](docs/30-data/schema-map.html): 데이터 지도. ERD 블록은 `pnpm db:erd`가 생성
- [variety-list.md](docs/30-data/variety-list.md): 판정할 품종 133개와 출처 코드·규격·기준 단위·커버 상태
- `reference/public-data/samples/`: 실호출 응답 샘플(정상·빈 결과·오류), `fetch-samples.sh`로 다시 만든다
- `reference/public-data/samples/viewer/api-explorer.html`: 샘플을 브라우저에서 보는 탐색기 (`build.py`로 생성, `smoke.sh`로 검사)

**원본 자료** (`reference/public-data/`)
- `kamis/code-table.txt`: KAMIS 코드표 (구분·부류·품목·품종·등급·시군구·시장)
- `kamis/perDay-api-spec.txt`: 공공데이터포털 KAMIS 일별 도·소매 가격 API 명세
- `ekape/openapi-guide.txt`: 축산물품질평가원 축산유통정보 OpenAPI 활용가이드

## 조사 결과 한 장 요약

1. **데이터 기반은 공공데이터로 잡는다.** KAMIS(매일, 전통시장 실명), 축평원(매일), 참가격(격주, 점포 실명)으로 MVP 품목 대부분을 다룰 수 있고, 법적 리스크가 거의 없다.
2. **쇼핑몰 크롤링과 API 결과 저장은 주 데이터원으로 쓰지 않는다.** 네이버 쇼핑 API와 쿠팡 파트너스 API는 결과 저장을 약관으로 금지한다.
3. **공백이 있다.** 홈플러스·롯데마트 점포 가격과 온라인몰 가격은 공공데이터에 없다. 출시 뒤 사용자 제보(E2)와 제휴(E1)로 단계적으로 메운다.
4. **평년은 직접 계산한다.** 우리가 쓰는 KAMIS `perDay`에는 평년이 없어 5년 이력을 받아 계산한다. 축산은 축평원이 평년을 함께 준다.
5. **단위가격 기준은 가격표시제 실시요령을 따른다.** 신선식품 100g당, 가공식품은 품목별 10g/100g/10ml/100ml당.
6. **이미지는 쇼핑몰 사진을 쓰지 않고 직접 그린다.** (P0 당시 AI 일러스트 계획은 손그림 SVG 파이프라인으로 바뀌었다.)
7. **유입 콘텐츠도 공공데이터로 만든다.** 식약처 레시피, 농정원 제철 농식품, 참가격의 편의점 가격.
