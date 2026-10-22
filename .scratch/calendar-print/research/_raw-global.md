# 해외 제철 농산물 달력·포스터 구조 조사 (원자료)

- 조사 날짜: 2026-10-22
- 목적: 제철달력 인쇄물 4종(monthly, year-sheet, season-poster, month-poster) 디자인 고도화용. 해외에서 실제로 팔리는 상품의 구조만 기록한다. 이미지는 내려받거나 복제하지 않았고 링크와 구조 설명만 남겼다.
- 환율 가정(조사 시점 정확한 환율은 확인 못 함, 추정): USD 1 ≈ 1,400원, JPY 100 ≈ 930원.

## 쓴 검색어

- Etsy(Bing 경유, `include_domains: etsy.com`): seasonal produce calendar print etsy, seasonal fruit and vegetable chart print, what's in season poster print, seasonal eating calendar 2027 etsy, seasonal produce guide printable PDF, seasonal produce wheel, seasonal fruit vegetable wheel print, seasonal eating wheel
- 일반: seasonal produce wheel print, 2027 wall calendar fruit vegetable illustration A3, 2027 seasonal produce wall calendar illustrated, illustrated kitchen calendar 2027 seasonal food, UK seasonal fruit and veg chart print
- 일본: 旬の野菜 カレンダー ポスター, 旬の野菜と果物 ポスター A3, 旬 食材 カレンダー 2027 イラスト, Tomoko Hayashi 旬果 カレンダー 2027 A3
- 사이트 내 검색: Creema `旬の野菜 ポスター`, 楽天市場 `旬 野菜 カレンダー 2027`, Amazon.co.jp `Tomoko Hayashi 旬果 カレンダー 2027`·`クローズピン 2027 壁掛け 旬果`
- Etsy 카테고리 페이지(Wayback 스냅샷): `/market/seasonal_produce_calendar`(2022-11-01), `/market/seasonal_food_calendar`(2025-08-18)

## 막힌 사이트와 우회 방법

| 사이트 | 증상 | 우회 |
|---|---|---|
| Etsy 실시간 상품 페이지 | wigolo fetch `blocked_by_challenge`, 실제 Chrome에서도 DataDome CAPTCHA("차단되었습니다", IP 의심) | **Wayback Machine 스냅샷**으로 상품 설명·JSON-LD 가격·이미지 대체텍스트(alt, "May include: …")를 읽음. 그래서 Etsy 가격은 **스냅샷 시점 가격**이고 현재가는 확인 못 함. CAPTCHA는 풀지 않았다. |
| Pinterest | 검색 페이지가 빈 껍데기(로그인 벽) | 우회 안 함. 유행 구조는 Etsy 카테고리 페이지 상위 노출로 대신 판단 |
| Google 검색 | `/sorry` 봇 차단 페이지 | 사용 안 함 |
| Bing 검색(wigolo) | 엔진 풀 저하, 다중 질의 시 무관한 결과 | `include_domains`를 붙인 질의만 쓸 만했음 |
| 내장 WebSearch | 이 모델에서 도구 미지원 오류 | 사용 안 함 |
| insane-search 엔진 | 샌드박스 네트워크가 PyPI를 막아 `curl_cffi` 설치 불가, 엔진 14회 시도 실패 | Wayback + Chrome DevTools로 대체 |
| 楽天 상품 페이지 | Akamai 차단("Reference #…")·타임아웃 | 楽天 검색 결과 목록(제목·가격)과 Amazon.co.jp 상품 페이지로 대체 |
| Yahoo!ショッピング | 해외 IP 차단 | 사용 안 함 |
| localfoodswheel.com | fetch 헤더 오류 | Etsy 상품 페이지 Wayback으로 대체 |
| Wayback CDX API | 타임아웃·429 간헐 | 개별 URL 스냅샷을 순차로 요청 |

## 사례 (본 사례 10개)

### 1. 월별 12장 포스터 PDF (달력 없음) — IYIArtStudio

- 링크: https://www.etsy.com/listing/699385244/seasonal-produce-calendar-fruits-and (읽은 스냅샷: https://web.archive.org/web/20260209001247/https://www.etsy.com/listing/699385244/seasonal-produce-calendar-fruits-and)
- 판매자/상품명: IYIArtStudio / "Seasonal Produce Calendar: Fruits and Vegetables Print, Growing Seasons"
- 출처: Etsy (평점 4.9, 리뷰 626개, 스냅샷 기준)
- 판매 형태: **디지털 다운로드(인쇄용 PDF)** — 우리와 판매 방식이 같다
- 용지·크기: PDF 12쪽을 5가지 크기로 각각 제공 — 8×10in, 11×14in, 18×24in, A4, Letter
- 가격: USD 7.50 (정가 USD 10.00에서 25% 할인, 2026-02 스냅샷) ≈ 10,500원
- 그림:달력 비율: 달력 없음. 위쪽 약 10%가 달 이름 띠, 나머지 약 90%가 그림 (상품 이미지 관찰)
- 그리드: 한 장에 1달, 12장
- 표지: 없음 (추정. 설명에 "12 PDF PAGES"만 있음)
- 제철 표기: 그림 + 이름. 수채 품종 그림을 흩어 놓고 그림마다 아래에 품종명 라벨
- 메모·체크 칸: 없음 (관찰)
- 타이포: 달 이름을 대문자 손글씨풍 세리프(MARCH, JUNE)로, 품종명은 작은 타자기풍 세리프 (관찰). 표지형 대표 이미지 제목도 대문자 세리프
- 구조 메모: "월별 낱장 포스터: 달 이름 띠 + 흩뿌린 수채 그림 + 그림별 이름표, 날짜 격자 없음(만년형)"

### 2. 한 장 12칸 그리드 포스터 — LiveOakPrint

- 링크: https://www.etsy.com/listing/1652800216/seasonal-produce-wall-hanging-whats-in (스냅샷: https://web.archive.org/web/20260202233419/https://www.etsy.com/listing/1652800216/seasonal-produce-wall-hanging-whats-in)
- 판매자/상품명: LiveOakPrint / "Seasonal Produce Wall Hanging - What's In Season Print - Seasonal Produce Poster"
- 출처: Etsy (샵 리뷰 3,291개)
- 판매 형태: 포스터(실물 인쇄·배송), 나무 자석 행거 선택 옵션
- 용지·크기: 12×18in, 16×24in, 24×36in. 170gsm 무광, FSC 인증 용지
- 가격: USD 31.85부터 (2026-02 스냅샷) ≈ 44,600원부터
- 그림:달력 비율: 달력 없음
- 그리드: 한 장에 12달 (12칸), 1장
- 표지: 해당 없음 (포스터)
- 제철 표기: 그림. 칸마다 그 달 과일·채소 그림과 달 이름 (alt 텍스트)
- 메모·체크 칸: 없음. 설명에 "장보기 목록을 쉽게 만든다"는 용도만 있음
- 타이포: 제목 "What's in Season?" 상단. 연분홍·연파랑·연노랑·연두 파스텔 칸 배경 (alt 텍스트)
- 구조 메모: "12칸 격자 포스터: 칸=달, 칸 안에 그 달 품종 그림, 칸마다 파스텔 배경색"

### 3. 그림 위·달력 아래 A3 벽걸이 2027 — クローズピン Tomoko Hayashi「旬果」(일본)

- 링크: https://www.amazon.co.jp/dp/B0H5VWS9MN (A3, CL95704) / 판매처 목록: https://item.rakuten.co.jp/clothes-pin/cl_tomoko_syunka_a3/ (楽天 상품 페이지는 차단, 검색 결과 목록에서 제목·가격 확인)
- 판매자/상품명: クローズピン(메이커 공식) / "2027年度版 A3 壁掛けカレンダー Tomoko Hayashi Syun-ka 旬果"
- 출처: Amazon.co.jp, 楽天市場
- 판매 형태: 벽걸이 (같은 디자인으로 B6 벽걸이, 卓上, PCスリム 변형도 판매)
- 용지·크기: A3 (297×420mm), 12장, 링 제본
- 가격: 楽天 クローズピン 공식 1,980円 (送料無料) ≈ 18,400원. Amazon.co.jp에서는 한국 배송 기준 KRW 16,619로 표시
- 그림:달력 비율: 그림 약 55% : 달력 약 45% (상품 이미지 관찰)
- 그리드: 한 장에 1달, 12장
- 표지: 확인 못 함 ("12枚綴り"로 보아 없음, 추정)
- 제철 표기: 그림. 그 달 제철 과일을 콜라주풍(판화·패턴 질감) 큰 그림으로. 품종명 표기는 그림에 없음 (관찰)
- 메모·체크 칸: 있음. 설명에 "큰 쓰기 칸". 달력 왼쪽 세로 단에 전달·다음달 미니 달력 2개 + "くだもののおはなし" 짧은 해설 상자 (관찰)
- 타이포: 오른쪽 위에 큰 달 숫자 "1" + 세리프 영문 달 이름 "January" + 작은 연도 "2027". 요일은 영문(Sun/Mon…), 날짜마다 작은 六曜 표기, 일요일 시작 (관찰·상품 설명)
- 구조 메모: "위 그림·아래 날짜 격자, 왼쪽 단에 앞뒤 달 미니 달력 + 품종 이야기 상자"

### 4. 그림+날짜 격자 A4 인쇄용 PDF 2025 — Katariina Purru

- 링크: https://www.etsy.com/listing/1729165286/printable-2025-seasonal-fruit-and (스냅샷 2025-08-21)
- 판매자/상품명: katariinapurru (에스토니아 음식 일러스트레이터) / "Printable 2025 Seasonal Fruit and Vegetables Calendar | PDF Digital Download | A4 Size"
- 출처: Etsy
- 판매 형태: **디지털 다운로드(인쇄용 PDF)** — 우리와 같다
- 용지·크기: A4 세로 21×29.7cm, 12장. 파일: PDF 1개 + JPG 1개
- 가격: USD 4.26 (2025-08 스냅샷) ≈ 6,000원
- 그림:달력 비율: 확인 못 함 (스냅샷에 이미지가 보관되지 않음). alt 텍스트상 수채 그림 + 요일·날짜 격자. 그림 약 50~60% (추정)
- 그리드: 한 장에 1달, 12장
- 표지: 없음 (추정. 설명에 "12 A4 sized printable sheets"만 있음)
- 제철 표기: 그림 (달마다 그 달 품종 수채 그림. 1월: 순무·레몬·자몽·오렌지·파스닙·콜리플라워·브로콜리·방울양배추·쪽파)
- 메모·체크 칸: 확인 못 함
- 타이포: 흰 배경 검정 글자, 달 이름 "January". 하단에 작가명·웹사이트·Etsy 샵 주소 크레딧 (alt 텍스트)
- 구조 메모: "월별 낱장: 위 수채 그림 + 아래 날짜 격자, 흰 바탕 최소 장식, 쪽 하단 작가 크레딧"

### 5. 표지·품목 키 포함 14쪽 인쇄용 PDF — KitchenSinkPrintShop

- 링크: https://www.etsy.com/listing/546766745/printable-wall-calendar-2025-seasonal (스냅샷 2025-08-21)
- 판매자/상품명: KitchenSinkPrintShop / "Printable Wall Calendar 2025, Seasonal Produce Food Art"
- 출처: Etsy
- 판매 형태: **디지털 다운로드(인쇄용 PDF)** — 우리와 같다. 매년 같은 상품을 새 연도로 갱신해 파는 것으로 보임(대표 이미지는 2023년판, 제목은 2025)
- 용지·크기: Letter(8.5×11in), A4, A5 세 크기를 각각 14쪽 PDF로
- 가격: USD 6.00 (2025-08 스냅샷) ≈ 8,400원
- 그림:달력 비율: 확인 못 함. alt 텍스트상 날짜 격자 + 다채로운 품종 그림. 같은 쪽에 그림과 격자가 함께 있음
- 그리드: 한 장에 1달, 12장 + 표지 1장 + 품목 키(vegetable key) 1장 = 14쪽
- 표지: **있음**
- 제철 표기: 그림. 품목 키 쪽에서 그림이 무엇인지 이름을 따로 풀어 줌 (그림과 이름을 분리한 범례 방식)
- 메모·체크 칸: 날짜 칸에 직접 쓰는 용도. 대표 이미지 문구 "Perfect for meal planning!" + 펜을 올린 연출 (alt 텍스트)
- 타이포: 확인 못 함 (월 제목 "August" 상단, 검정 격자)
- 구조 메모: "표지 + 품목 범례 1쪽 + 12달(그림+날짜 격자), 3가지 용지 크기 동봉"

### 6. 이중 회전판 원형 휠 — The Local Foods Wheel

- 링크: https://www.etsy.com/listing/180488877/northeast-local-foods-wheel (스냅샷 2025-05-05). 지역별 판: San Francisco Bay Area https://www.etsy.com/listing/166035528/san-francisco-bay-area-local-foods-wheel, Northwest https://www.etsy.com/listing/461633234
- 판매자/상품명: localfoodswheel / "Northeast Local Foods Wheel"
- 출처: Etsy (평점 5.0, 리뷰 398개). 2022·2025 카테고리 스냅샷 모두 상위 노출
- 판매 형태: 기타 — 회전하는 종이 휠(카드스톡), 슬리브 포장
- 용지·크기: 지름 12in(약 30cm)
- 가격: USD 20.00 ≈ 28,000원
- 그림:달력 비율: 달력 없음
- 그리드: 원 12조각(1조각=1달), 1장(앞뒤)
- 표지: 해당 없음
- 제철 표기: **원형 휠** + 그림. 위 원판에는 사철 나는 품목, 위 원판 창으로 아래 원판의 제철 품목이 보임(돌리면 달이 바뀜). 과일·채소·해산물 포함. 뒷면은 품목 가나다(알파벳)순 표: 품목별 h.(수확)/a.(유통) 기호
- 메모·체크 칸: 없음
- 타이포: 흰 바탕에 갈색 글자. 판매자 스스로 "정보가 꽉 차 글자가 매우 작다"고 경고 (상품 설명)
- 구조 메모: "원형 휠 12조각 + 회전 창(사철 품목과 제철 품목을 두 겹으로 분리), 뒷면은 품목별 시기 표"

### 7. 동심원 색띠 휠 (원형 매트릭스) — DovetailInk

- 링크: https://www.etsy.com/listing/1053668389/seasonal-fruit-and-vegetable-chart-for (스냅샷 2026-02-09)
- 판매자/상품명: DovetailInk / "Seasonal Fruit and Vegetable Chart, For everything there is a season"
- 출처: Etsy
- 판매 형태: 포스터(원화의 아트 프린트 배송)
- 용지·크기: 8×10, 11×14, 12×16in (원화는 22×30in. 글자가 작아 8×10 미만은 팔지 않음)
- 가격: USD 18.00부터 ≈ 25,200원부터
- 그림:달력 비율: 달력 없음
- 그리드: 원 1개에 12달, 1장
- 표지: 해당 없음
- 제철 표기: **색띠(달에 걸친 막대)를 원으로 감은 것**. 품목마다 그 과일 색의 원호 선이 나는 달들을 가로질러 이어짐. 둘레에 토마토·오렌지·배·레몬 그림 몇 개 (상품 설명·alt 텍스트)
- 메모·체크 칸: 없음
- 타이포: 잉크 펜 손글씨, 하단에 성경 구절 "For every thing there is a season… Ecclesiastes 3:1"
- 구조 메모: "극좌표 매트릭스: 각도=달, 동심원 고리=품목, 품목 색 원호가 제철 기간만큼 이어짐"

### 8. 계절 4구획 포스터 2장 세트 PDF — MiaAndMadisonStudios

- 링크: https://www.etsy.com/listing/1807032562/seasonal-fruits-and-vegetables-guide (스냅샷 2026-02-10). 남반구판: https://www.etsy.com/listing/4332819209/seasonal-fruit-and-vegetables-poster-set
- 판매자/상품명: MiaAndMadisonStudios / "Seasonal Fruits and Vegetables Guide Poster Set"
- 출처: Etsy
- 판매 형태: **디지털 다운로드** (용량 때문에 TXT 파일 안의 링크로 원본 배포) — 우리와 같다
- 용지·크기: 확인 못 함 ("여러 액자 크기에 맞게 조정 가능"이라고만 함)
- 가격: USD 6.38 (2장 세트, 2026-02 스냅샷) ≈ 8,900원. 과일판·채소판 단품도 따로 판매
- 그림:달력 비율: 달력 없음
- 그리드: 한 장에 4계절(4구획), 2장(채소 1장 + 과일 1장)
- 표지: 해당 없음
- 제철 표기: 그림 (수채 품종 그림 격자). 계절 구획마다 해당 달을 함께 표기 (alt 텍스트)
- 메모·체크 칸: 없음
- 타이포: 베이지 바탕, 제목 "Seasonal Vegetables Guide" / "Seasonal Fruits Guide", 계절 이름 + 달 표기
- 구조 메모: "계절 4띠 포스터를 과일·채소 두 장으로 나눔, 띠 제목에 계절명과 해당 달"

### 9. X자 대각선 4계절 분할 포스터 — nammy「くいしんぼうさんの『旬』」(일본)

- 링크: A3 https://www.creema.jp/item/4671070/detail / A2 https://www.creema.jp/item/7623729/detail
- 판매자/상품명: nammy (こどもの「たべもの雑貨」, 평점 리뷰 2,347개) / 「［再販］くいしんぼうさんの『旬』」
- 출처: Creema (일본 핸드메이드 마켓)
- 판매 형태: 포스터(실물 배송, 액자 별도). 같은 디자인의 욕실 방수 포스터판도 있음 (https://www.creema.jp/item/15320206/detail)
- 용지·크기: A3 (297×420mm), A2 (420×594mm) 가로형
- 가격: A3 ¥750 ≈ 7,000원 / A2 ¥1,200 ≈ 11,200원 (10명 이상 구매, 즐겨찾기 215)
- 그림:달력 비율: 달력 없음
- 그리드: 한 장에 4계절, 1장
- 표지: 해당 없음
- 제철 표기: 그림 + 이름. 가로 화면을 X자 대각선으로 네 삼각형으로 나누고, 중앙에 春·夏·秋·冬 네 글자. 각 삼각형에 그 계절 식재료(생선·채소·과일) 작은 그림과 아주 작은 이름 (상품 이미지 관찰)
- 메모·체크 칸: 없음
- 타이포: 흰 바탕, 장식 없는 단순 디자인("飽きにくいシンプルなデザイン"). 중앙 계절 한자만 강조
- 구조 메모: "X자 대각선 4분할(중앙=계절 글자), 분할마다 그 계절 품종 소형 그림 수십 개 + 이름"

### 10. 가로 띠 타임라인 차트 — Liz Cook Charts (영국)

- 링크: https://www.etsy.com/listing/599780522/seasonal-uk-fruit-and-vegetable-chart-by (스냅샷 2025-12-14)
- 판매자/상품명: LizCookCharts / "Seasonal UK Fruit and Vegetable Chart by Liz Cook"
- 출처: Etsy (영국 판매자, 자체 사이트 lizcookchart.com 표기)
- 판매 형태: 포스터(코팅 차트, 지관통 배송). ISBN·EAN이 붙은 출판물 형태
- 용지·크기: 가로 88cm × 세로 18cm (약 5:1 가로 띠), 코팅(laminated)
- 가격: USD 11.10 (현지 GBP 가격은 확인 못 함) ≈ 15,500원
- 그림:달력 비율: 달력 없음
- 그리드: 한 장에 12달을 가로로 나열, 1장
- 표지: 해당 없음
- 제철 표기: 그림 + 이름 목록. 달 구획마다 품목 수채 그림과 이름. 사철 품목, 일부 달만 나는 품목, 저장품(stores)인지 신선품인지를 구분 (상품 설명·alt 텍스트)
- 메모·체크 칸: 없음
- 타이포: 달 이름 사이사이에 계절 라벨(Spring·Summer·Autumn·Winter)이 끼어 있음 (alt 텍스트: "March, Spring, April, May, June, Summer, July…")
- 구조 메모: "가로로 긴 타임라인 띠: 12달 구획을 왼쪽→오른쪽으로, 계절 이름이 구획 경계에 표시"

## 참고 사례 (간략)

본 사례와 구조가 겹치거나 정보가 부족한 것. 유형 판단의 근거로만 쓴다.

| # | 링크 | 판매자 | 형태·크기·가격 | 구조 메모 |
|---|---|---|---|---|
| R1 | https://www.etsy.com/listing/1811905439 | kbirdartco | 벽걸이 2025, 약 8.26×11.69in(A4급), 271gsm, 와이어 제본, USD 25.99 | 표지("2025" 크게) + 월별 낱장: 손그림(과일·채소·꽃) + **품종 이름 목록** + 날짜 격자 |
| R2 | https://www.etsy.com/listing/1666006370 | TinyeaselCreations | 벽걸이 10.8×8.4in(가로형) / 탁상 10×5in, 270gsm, USD 18.99 | 월별 낱장: 그 달 품종 그림 + S M T W T F S 날짜 격자, 같은 디자인으로 벽걸이·탁상 두 판형 |
| R3 | https://www.etsy.com/listing/4350971267 | Lori Rice | 벽걸이 2026, 11×16.5in(A3에 가까움), USD 28.00 | 사진 달력: 달마다 대표 품목 1개(1월 콜리플라워, 2월 래디시…) 클로즈업 + 메모용 작은 날짜 칸 |
| R4 | https://www.etsy.com/listing/1272508386 | HannahTurpinDesigns (영국) | A4 벽걸이, 13쪽 + 받침판, 링 제본, 만년형(날짜 없음), USD 32.53 | 표지 + 12달. 빈티지 동판화풍 그림, 바랜 베이지 바탕, 달 이름 상단. "What's Best to Eat When" |
| R5 | https://www.etsy.com/listing/1083531367 | 확인 못 함 | A5 세로 만년 달력, 재생지, 스프링, USD 12.25 | 달마다 리노판화 그림 1개 + 1~31일 목록(생일·기념일 메모용) + "Plant / In Season" 두 단 표 |
| R6 | https://www.etsy.com/listing/1369707503 | UrbEmSketches (시애틀) | 아트 프린트 8×10 / 11×14in, USD 45.00 | 한 장 12칸: 달마다 수채 그림 1개 + 품목 4개 이름 목록. 제목 "What is in season… in the coastal Pacific Northwest?" |
| R7 | https://www.etsy.com/listing/1884627327 | TheasWallArtGallery | 포스터 11×17~24×36in, USD 15.40부터 | 한 장 월별 격자에 품목 **글자 목록**만, 베이지 빈티지풍, 굵은 검정 글꼴 |
| R8 | https://www.etsy.com/listing/521231974 | PaperMundi | 아트 프린트, 192gsm, USD 29.00 | 수채 원형 휠: 가운데 "all year", 바깥 12조각(1월부터 시계방향), 사분면=계절. 별도 이미지로 품목별 시기 목록(예: 사과 8~11월) |
| R9 | https://www.etsy.com/listing/564642158 | NativeCirclesArt (아일랜드) | 지름 30cm 자작나무 합판 원판 + 거치대, USD 72.59 | 동심원 고리 휠, 바깥 고리에 달, 가운데 문구. 거치대에서 돌려 쓰는 인테리어 소품 |
| R10 | https://www.etsy.com/listing/1028265691 | FeedandDwell | 아트 프린트, 면 100% 판화지, USD 26.00(1장) | 계절 하나에 한 장(봄·여름·가을·겨울 4장 세트 따로 판매). 한 장에 수채 품목 10개, 상단 "in season… SUMMER" |
| R11 | https://www.etsy.com/listing/724779937 | GoodmeadProductions | 디지털 PDF Letter·A4, 컬러판+흑백판 2개, USD 4.00 | 4계절 블록에 품목 **글자 목록**, 계절마다 아이콘(눈송이·꽃·해·잎) |
| R12 | https://www.etsy.com/listing/1828223227 | MealPrints | 디지털 PDF, USD 2.50 | 4계절 색 블록 + 그림 + 목록, 덤으로 "제철 식생활 팁 10가지" 쪽 |
| R13 | https://www.etsy.com/listing/1459887384 | DramaticGranola (덴버) | 포스터 17×11in 가로, 100lb 무광, USD 30.00 | 주(州)와 색을 골라 주문. 데이터 출처를 seasonalfoodguide.org로 명시. 배치는 확인 못 함(표 형식, 추정) |
| R14 | https://www.creema.jp/item/5987350/detail | SONORITE (일본) | A2 가로 포스터, 135g 코트지 + 무광 PP, ¥1,000 | 원 중심 배치: 안쪽 고리=계절 꽃, 바깥=채소·과일, 歳時記 행사도 함께. 모든 이름에 히라가나 읽기 |

## 반복되는 구조 유형

1. **월별 낱장 + 날짜 격자 (그림 위, 달력 아래)**: 3, 4, 5, R1, R2, R3. 우리 monthly에 해당. 공통점은 그림이 위쪽 절반 이상(약 50~60%)을 차지하는 것. 차이는 품종 이름을 그림 안에 붙이느냐(R1 목록), 따로 범례 쪽으로 빼느냐(5), 아예 쓰지 않느냐(3). 메모 장치로는 큰 날짜 칸, 앞뒤 달 미니 달력, 품종 이야기 상자(3)가 있다. 표지는 디지털판 일부(5)와 벽걸이 일부(R1, R4)에만 있다.
2. **월별 낱장, 날짜 없는 만년형**: 1, R4, R5. 우리 month-poster를 12장으로 나눈 형태. "매년 쓸 수 있다(never go out of date)"를 판매 포인트로 내세운다. R5는 날짜 대신 1~31일 목록을 둬서 생일 메모장을 겸한다.
3. **한 장 12칸 격자 (달마다 칸)**: 2, R6, R7. 우리 month-poster와 같다. 칸마다 그림 여러 개(2), 그림 1개 + 글자 목록(R6), 글자만(R7)으로 정보 밀도가 갈린다.
4. **계절 구획 (4띠·4블록·대각선·4장 세트)**: 8, 9, R10, R11, R12, (R14 일부). 우리 season-poster와 같다. 구획 방식이 다양하다: 블록 4개(8, R11), X자 대각선(9), 계절마다 한 장(R10). 띠 제목에 계절과 해당 달을 함께 적는 경우가 많다(8).
5. **원형 휠 (12조각·사분면·동심원·회전판)**: 6, 7, R8, R9, R14. 가장 "차트답게" 팔리는 유형이고 실물 가격대가 높다(USD 18~73). 변형은 12조각에 그림(6, R8), 동심원 색띠(7), 돌리는 회전판(6, R9) 등이다. 우리 4종에는 없는 유형이다.
6. **기간 표시형 (가로 타임라인 띠·품목별 시기 목록)**: 10, 7(원형 버전), R8 보조 이미지, 6 뒷면. "어느 품목이 몇 월부터 몇 월까지"를 길이(막대·원호)나 범위 텍스트(Aug–Nov)로 보여 준다. 행=품종, 열=월, 칸을 칠하는 전형적인 매트릭스 표는 이번 조사에서 1차 출처로 확인하지 못했다(R13이 그런 형식일 가능성, 추정).

### 판매 방식 메모

- 우리와 같은 **디지털 다운로드(인쇄용 PDF)**: 1, 4, 5, 8, R11, R12. 가격대는 USD 2.5~7.5(약 3,500~10,500원)로 실물(USD 18~73)보다 훨씬 싸다. 한 구매에 여러 용지 크기를 함께 넣는 것이 관례다: 1은 5종, 5는 3종(Letter/A4/A5), R11은 Letter/A4에 컬러판+흑백판. 연도형 PDF는 매년 연도만 바꿔 다시 판다(5).
- A3 판형은 일본 실물 달력(3)과 포스터(9)에서 확인했다. 미국 상품은 in 단위(8×10, 11×14, 12×18, 18×24, 24×36)가 표준이고, A4는 디지털판의 추가 크기로 붙는다.
