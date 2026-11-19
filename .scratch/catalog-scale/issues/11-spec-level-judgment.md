# 11. 식재료 규격별 판정

Status: needs-triage
Type: task
Blocked by: 04

[catalog-evolution/plans/01](../../catalog-evolution/plans/01-classification-and-search.md)을 이어 받는다. 내용은 그 문서를 따르고, 카탈로그를 코드가 아니라 DB에서 읽는 점만 다르다.

## 요약

- 판정이 품종마다 기본 규격 하나뿐이다(`judgment/cli.ts`의 `s.is_default` 조인, 평소가의 `variety_id` 단독 키, 웹 `get-variety.ts`의 `limit 1`). 이미 수집되는 규격(냉동 꽃게, 시금치 중품 등)이 화면에 없다
- 판정 단위를 품종 × 규격으로, 검색은 품종 아래 규격 행, URL은 규격 경로
- 판정 행이 136 → 최대 200(지금 기준), 카탈로그가 늘면 더 는다

## 완료 기준

- catalog-evolution/01의 완료 기준.

## Comments

- 2026-11-19. 한우 부위·육계·계란·미국산/호주산 척아이롤의 품종 상세에 규격별 전국 소매 시세를 추가했다. 규격별 마지막 조사일·출처와 기준 단위 가격을 같이 보여 준다. 검색·개별 규격 경로·규격별 판정은 이 티켓의 후속 범위다.
- 육계 9~12호의 금액은 원천 단위 확인 중이다. KAMIS의 11/17 전국 10~12호 원천은 534·516·551원에 단위 `1 kg`으로 오며, 같은 날 kg 단위 육계는 KAMIS·축평원 양쪽에서 5,292원이다. 호수별 값은 단위를 확인할 때까지 웹 표에서 조사일·출처만 보여 준다. [KAMIS 조사요령](https://www.kamis.or.kr/customer/price/knowhow/knowhow.do?action=standardList) · [축평원 육계 유통가격](https://www.ekapepia.com/v3/price/livestock/chicken/distrPrice.do)
