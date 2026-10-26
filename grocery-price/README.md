# 식자재 시세 판정 서비스 (가칭)

> "이 애호박 2,980원, 비싼 건가?"에 3초 안에 답하는 도구.
> 최저가 검색이 아니라 **적정가 판단**을 돕는다.

**현재 단계: ① 수집 기반** · 수집 코드는 스키마가 정해지는 대로 만들고, 화면 코드는 ④에서 `apps/web`에 쓴다. 전체 단계와 완료 기준은 [로드맵](docs/00-overview/roadmap.md)에 있다 (2026-10-19 P0~P11에서 4단계로 재편).

## 진행 현황

| 단계 | 상태 |
|---|---|
| P0 기획·조사 | ✅ 완료 |
| P1 도메인 모델링 | ✅ 완료 (2026-10-08) |
| ① 수집 기반 | 🔄 진행 중 (API 3종 실호출·응답 샘플 완료, 저장소 결정(ADR 0002) 완료. 다음: Supabase 설정, 스키마) |
| ② 판정 설계 | ⏳ |
| ③ 화면 콘텐츠 설계 | ⏳ (정부 화면 벤치마킹과 검색 결과 결정은 `.scratch/search-first-view`) |
| ④ 구현 | ⏳ |

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

**조사 (P0)**
- [data-sourcing-legal.md](docs/10-research/data-sourcing-legal.md): 크롤링 법적 리스크, 판례, 약관, 합법적 데이터 확보 전략
- [public-data-survey.md](docs/10-research/public-data-survey.md): 참가격·KAMIS·축평원·수산물 공공데이터 개요와 배치 초안
- [images.md](docs/10-research/images.md): 이미지 저작권, 무료 소스, AI 생성 비용
- [content-and-taxonomy.md](docs/10-research/content-and-taxonomy.md): 레시피·제철 데이터, 분류 체계, 단위가격 표시제, 해외 사례

**API 실측과 수집 설계** (①)
- [api-spec.md](docs/10-research/api-spec.md): 요청·응답 명세와 실측으로 확인한 명세 불일치. API를 호출하기 전에 읽는다
- [gov-price-sites.md](docs/10-research/gov-price-sites.md): 참가격 생필품 화면과 API 대조, 다른 정부·공공 가격 출처 판정
- [pipeline.md](docs/30-data/pipeline.md): 저장 구조, 테이블, 수집 일정, 장애 처리, 실행 환경
- [variety-list.md](docs/30-data/variety-list.md): 판정할 품종 133개와 출처 코드·규격·기준 단위·커버 상태
- `reference/public-data/samples/`: 실호출 응답 샘플(정상·빈 결과·오류), `fetch-samples.sh`로 다시 만든다
- `reference/public-data/samples/viewer/api-explorer.html`: 샘플을 브라우저에서 보는 탐색기 (`build.py`로 생성, `smoke.sh`로 검사)

**Supabase**
- [supabase-skills.md](docs/10-research/supabase-skills.md): Supabase 작업에 쓸 에이전트 스킬 비교와 추천 조합

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
6. **이미지는 AI 일러스트와 무료 아이콘으로 시작한다.** 3,000장 기준 약 $18~160.
7. **유입 콘텐츠도 공공데이터로 만든다.** 식약처 레시피, 농정원 제철 농식품, 참가격의 편의점 가격.
