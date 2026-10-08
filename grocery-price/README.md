# 식자재 시세 판정 서비스 (가칭)

> "이 애호박 2,980원, 비싼 건가?"에 3초 안에 답하는 도구.
> 최저가 검색이 아니라 **적정가 판단**을 돕는다.

**현재 단계: P2 데이터 소스 명세** · 코드 개발은 P11에서 시작한다. 전체 단계와 완료 기준은 [로드맵](docs/00-overview/roadmap.md)에 있다.

## 진행 현황

| 단계 | 상태 |
|---|---|
| P0 기획·조사 | ✅ 완료 |
| P1 도메인 모델링 | ✅ 완료 (2026-10-08) |
| P2 데이터 소스 명세 | 🔄 다음 (API 키 발급 필요) |
| P3 표현 가능 값 카탈로그 | ⏳ |
| P4 어댑터 · 통합 데이터 모델 | ⏳ |
| P5 표현 설계 | ⏳ |
| P6 기술 아키텍처 | ⏳ |
| P7 디자인 시스템 | ⏳ |
| P8 정보구조 · 페이지 설계 | ⏳ |
| P9 SEO · 분석 설계 | ⏳ |
| P10 디자인 시안 | ⏳ |
| P11 구현 · 배포 · 등록 | ⏳ |

## 문서 지도

**개요**
- [roadmap.md](docs/00-overview/roadmap.md): 단계, 산출물, 완료 기준, 문서 구조
- [product-concept.md](docs/00-overview/product-concept.md): 문제 정의, 차별점, 판정 UI, 표시 항목, 유입 콘텐츠, 도메인 개념 초안

**도메인 (P1)**
- [GLOSSARY.md](GLOSSARY.md): 용어집. 문서와 화면은 모두 이 용어를 쓴다
- [domain-model.md](docs/20-domain/domain-model.md): 분류 계층, 검색 흐름, 가격 개념, 단위 규칙, 시나리오, 결정 이력, 열린 질문

**결정 기록** (`docs/adr/`)
- [0001](docs/adr/0001-public-data-and-reports-over-crawling.md): 가격 데이터는 공공데이터와 제보로 확보하고, 쇼핑몰 크롤링은 하지 않는다

**조사 (P0)**
- [data-sourcing-legal.md](docs/10-research/data-sourcing-legal.md): 크롤링 법적 리스크, 판례, 약관, 합법적 데이터 확보 전략
- [public-data-survey.md](docs/10-research/public-data-survey.md): 참가격·KAMIS·축평원·수산물 공공데이터 개요와 배치 초안
- [images.md](docs/10-research/images.md): 이미지 저작권, 무료 소스, AI 생성 비용
- [content-and-taxonomy.md](docs/10-research/content-and-taxonomy.md): 레시피·제철 데이터, 분류 체계, 단위가격 표시제, 해외 사례

**원본 자료** (`reference/public-data/`)
- `kamis/code-table.txt`: KAMIS 코드표 (구분·부류·품목·품종·등급·시군구·시장)
- `kamis/perDay-api-spec.txt`: 공공데이터포털 KAMIS 일별 도·소매 가격 API 명세
- `ekape/openapi-guide.txt`: 축산물품질평가원 축산유통정보 OpenAPI 활용가이드

## 조사 결과 한 장 요약

1. **데이터 기반은 공공데이터로 잡는다.** KAMIS(매일), 축평원(매일), 참가격(주/격주, 판매점 실명)으로 MVP 품목 대부분을 다룰 수 있고, 법적 리스크가 거의 없다.
2. **쇼핑몰 크롤링과 API 결과 저장은 주 데이터원으로 쓰지 않는다.** 네이버 쇼핑 API와 쿠팡 파트너스 API는 결과 저장을 약관으로 금지한다.
3. **공백이 있다.** 홈플러스·롯데마트 매장 가격과 온라인몰 가격은 공공데이터에 없다. 사용자 제보와 제휴로 단계적으로 메운다.
4. **판정 기준은 이미 데이터에 있다.** KAMIS가 평년·1년 전·1개월 전 가격을 함께 준다.
5. **단위가격 기준은 가격표시제 실시요령을 따른다.** 신선식품 100g당, 가공식품은 품목별 10g/100g/10ml/100ml당.
6. **이미지는 AI 일러스트와 무료 아이콘으로 시작한다.** 3,000장 기준 약 $18~160.
7. **유입 콘텐츠도 공공데이터로 만든다.** 식약처 레시피, 농정원 제철 농식품, 참가격의 편의점 가격.
