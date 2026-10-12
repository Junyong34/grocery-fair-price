#!/usr/bin/env python3
"""samples/ 의 실호출 응답으로 api-explorer.html 을 만든다.

    python3 -I build.py

- 입력: ../manifest.tsv 와 ../{kamis,ekape,chamgagyeok}/ 의 응답 파일, template.html
- 출력: api-explorer.html (외부 의존성 없는 단일 파일, 브라우저로 바로 연다)
- 설명 문구(파라미터, 필드 의미)는 이 파일의 META 에 있다. 근거는
  grocery-price/docs/10-research/api-spec.md 와 샘플 실측이다.
"""
import csv
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
SAMPLES = HERE.parent
RAW_LIMIT = 16000  # 이 크기 이하 응답은 원문을 같이 넣는다

# ───────────────────────── 엔드포인트 설명 ─────────────────────────

REGIONS = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기",
           "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"]


def P(name, req, desc, example="", observed=""):
    """req: 'required' | 'optional' | 'either'"""
    return {"name": name, "req": req, "desc": desc, "example": example, "observed": observed}


def F(name, meaning, type_="문자열", note="", fmt=""):
    return {"name": name, "meaning": meaning, "type": type_, "note": note, "fmt": fmt}


KAMIS = {
    "id": "kamis-daily",
    "group": "kamis",
    "tab": "일별 도·소매 가격",
    "title": "KAMIS 일별 도·소매 가격",
    "org": "aT 한국농수산식품유통공사 (공공데이터포털)",
    "role": "채소·과일·수산물의 소매·도매 시세. 부류 → 품목 → 품종 → 등급 순으로 코드가 있다.",
    "url": "https://apis.data.go.kr/B552845/perDay/price",
    "facts": [
        ("형식", "JSON / XML (returnType)"),
        ("개발계정 한도", "10,000건/일"),
        ("갱신", "휴일 제외 매일. 등록은 조사일 다음 날 00시(KST) 전후"),
        ("과거 조회", "호출당 최대 1년"),
        ("성공 코드", 'resultCode "0"'),
    ],
    "params": [
        P("serviceKey", "required", "공공데이터포털 인증키", "(64자 인증키)",
          "잘못된 키는 HTTP 403 + 코드 30 (error-invalid-key 샘플)"),
        P("returnType", "required", "응답 형식. 기본 JSON", "JSON"),
        P("pageNo", "required", "페이지 번호. 기본 1", "1"),
        P("numOfRows", "required", "페이지당 건수. 기본 10, 최대 1000", "5",
          "결과는 조사일 오름차순이라 건수로 자르면 오래된 날짜부터 온다"),
        P("cond[exmn_ymd::GTE]", "required", "조사일 시작 (YYYYMMDD)", "20260928",
          "빼면 오류 없이 1996년부터 이력이 온다 (missing-date-from 샘플)"),
        P("cond[exmn_ymd::LTE]", "required", "조사일 끝 (YYYYMMDD)", "20261012",
          "빼면 오류 없이 0건 (resultCode는 정상)"),
        P("cond[ctgry_cd::EQ]", "required", "부류코드. 100 식량작물, 200 채소류, 300 특용작물, 400 과일류, 500 축산물, 600 수산물", "200",
          "빼면 오류 없이 0건"),
        P("cond[item_cd::EQ]", "required", "품목코드. 예: 211 배추, 224 애호박(채소류), 411 사과, 611 고등어", "211",
          "빼면 오류 없이 0건 (empty-missing-item 샘플)"),
        P("cond[se_cd::EQ]", "optional", "구분코드. 01 소매, 02 중도매, 03 친환경, 07 친환경(신규). 같은 품목도 구분에 따라 조사 대상·지역·단위가 다르다 (아래 표). MVP는 01 소매만 수집한다", "01",
          "빼면 구분이 섞여서 온다: 배추 30일 914건 = 소매 753 + 중도매 156 + 친환경(신규) 5. 구분마다 단위가 달라 합치면 안 된다"),
        P("cond[vrty_cd::EQ]", "optional", "품종코드", ""),
        P("cond[grd_cd::EQ]", "optional", "등급코드", ""),
        P("cond[sgg_cd::EQ]", "optional", "시군구코드", ""),
        P("cond[mrkt_cd::EQ]", "optional", "시장코드", ""),
        P("selectable", "optional", "받을 컬럼만 지정 (쉼표 구분)", "item_cd,vrty_cd"),
    ],
    "tables": [{
        "title": "구분 코드(se_cd)별 실측 — 배추, 최근 30일 (2026-10-12)",
        "heads": ["구분", "의미", "건수", "조사 지역", "가격 단위", "배추 가격대", "MVP"],
        "rows": [
            ["01", "소매", "753", "22개 도시, 시장 24곳", "1포기", "2,740 ~ 9,330원", "수집"],
            ["02", "중도매", "156", "5개 도시, 시장 5곳", "10kg(그물망 3포기)", "8,360 ~ 26,100원", "제외 (이후)"],
            ["03", "친환경", "0", "—", "—", "—", "제외 (데이터 없음)"],
            ["07", "친환경(신규)", "5", "서울 5곳", "100g", "880 ~ 2,000원", "제외"],
        ],
        "note": "02는 소매와 단위가 달라 평소가에 섞을 수 없다. 03은 6개 품목에서 모두 0건이고, 07은 배추만 확인했다 (전수 확인은 p2/13). 이력은 나중에 백필할 수 있다 (시작일을 빼면 1996년 배추 중도매가 온다). 결정 근거: .scratch/p2-data-source-spec/spec.md",
    }],
    "param_note": "대괄호와 ::는 URL 인코딩한다 (cond%5Bexmn_ymd%3A%3AGTE%5D). 명세상 '필수'인 조건을 빼도 오류가 나지 않고 조용히 빈 결과가 오므로, 요청을 만드는 쪽에서 검증해야 한다.",
    "tree": """response
├─ header
│   ├─ resultCode      "0" = 정상
│   └─ resultMsg       "정상"
└─ body
    ├─ dataType        "JSON"
    ├─ pageNo / numOfRows
    ├─ totalCount      조건에 맞는 전체 건수 (페이지 계산용)
    └─ items.item[]    조사 1건 = 시장 1곳 × 품종 × 등급  (조사일 오름차순)""",
    "codes": [
        ("0", "정상 (HTTP 200). 결과가 0건이어도 정상이다"),
        ("HTTP 403 / 30", "SERVICE_KEY_IS_NOT_REGISTERED_ERROR — 등록되지 않은 서비스키. returnType=JSON이면 JSON 본문"),
        ("HTTP 400 / 12", "NO_OPENAPI_SERVICE_ERROR — 없는 주소 (api-spec.md 기록)"),
    ],
    "fields": [
        F("exmn_ymd", "조사일", "문자열 (YYYYMMDD)"),
        F("se_cd", "구분 코드 (01 소매, 02 중도매, 03·07 친환경)", note="MVP는 01만 수집. 구분마다 단위가 다르다"),
        F("se_nm", "구분 이름"),
        F("ctgry_cd", "부류 코드"),
        F("ctgry_nm", "부류 이름 (채소류 등)"),
        F("item_cd", "품목 코드"),
        F("item_nm", "품목 이름 (배추, 사과 등)"),
        F("vrty_cd", "품종 코드 (품목 안에서만 유일)", note="KAMIS의 '품종'은 우리 용어집의 품종과 다른 개념이다"),
        F("vrty_nm", "품종 이름 (예: 여름(고랭지))"),
        F("grd_cd", "등급 코드"),
        F("grd_nm", "등급 이름 (상품, 중품 등)"),
        F("sgg_cd", "시군구 코드 (소매 22개 도시, 도매 5개 도시)"),
        F("sgg_nm", "시군구 이름"),
        F("mrkt_cd", "시장 코드"),
        F("mrkt_nm", "시장 이름", note="대형마트 등은 'A-대형마트'처럼 익명, 전통시장만 실명"),
        F("unit", "가격 단위 (포기, kg, 개 등)", note="품목마다 다르다. 같은 배추도 포기와 kg(그물망)이 있다"),
        F("unit_sz", "단위 크기. 가격은 이 크기당 가격", "문자열 (숫자)"),
        F("exmn_dd_prc", "조사일 가격", "문자열 (숫자)", fmt="won"),
        F("exmn_dd_cnvs_prc", "조사일 kg 환산가격 (이름상)", "문자열 (숫자)", note="구분마다 다르다. 소매(01)·중도매(02)는 저장한 샘플 모든 행에서 exmn_dd_prc와 같은 값이다 (10kg 단위 행도 kg당으로 환산되어 있지 않다). 친환경(07)은 100g 880원에 8,800원으로 kg 환산(×10)되어 있다. 믿지 말고 unit/unit_sz로 직접 환산할 것", fmt="won"),
        F("orgnl_reg_dt", "원본 등록일시 (UTC)", "문자열 (ISO 8601)", note="KST로는 +9시간. 사후 등록·정정이 있다 (9/18 조사분이 9/30 등록)"),
    ],
    "samples": [
        ("kamis/vegetable-baechu-retail", "배추 · 소매 (최근 14일, 5건)", "채소류 200 / 품목 211 / 소매 01"),
        ("kamis/vegetable-baechu-retail-14d", "배추 · 소매 14일 전체 (시각화용)", "numOfRows=1000으로 14일치를 모두 받은 것. 아래 추이·시장 비교 차트가 이 샘플에서 나온다"),
        ("kamis/vegetable-baechu-wholesale", "배추 · 중도매 (5건) [MVP 제외]", "구분 02 — 소매와 시장·단위(10kg)·가격대가 다르다. MVP는 소매(01)만 수집하고 도매는 이후에 도입한다"),
        ("kamis/vegetable-aehobak-retail", "애호박 · 소매 (5건)", "품목 224"),
        ("kamis/fruit-sagwa-retail", "사과 · 소매 (5건)", "과일류 400 / 품목 411"),
        ("kamis/fish-godeungeo-retail", "고등어 · 소매 (5건)", "수산물 600 / 품목 611"),
        ("kamis/empty-future-dates", "결과 없음 (미래 날짜)", "totalCount 0, resultCode는 정상 \"0\""),
        ("kamis/empty-missing-item", "품목코드 누락", "필수 조건을 빼도 오류가 아니라 0건이 온다"),
        ("kamis/missing-date-from", "조사 시작일 누락", "1996년부터의 이력이 그대로 온다"),
        ("kamis/error-invalid-key", "잘못된 인증키", "HTTP 403, errMsg와 returnReasonCode"),
    ],
    "viz": "kamis",
}

EKAPE = {
    "id": "ekape-daily",
    "group": "ekape",
    "tab": "일자별 소비자가격",
    "title": "축평원 일자별 소비자가격",
    "org": "축산물품질평가원 축산유통정보 OpenAPI (공공데이터포털)",
    "role": "소·돼지·닭·계란·우유의 부위별 소비자가격. 전국 평균·최고·최저와 17개 시도별 가격, 그리고 평년 가격.",
    "url": "http://data.ekape.or.kr/openapi-data/service/user/grade/consumerPriceDaily",
    "facts": [
        ("형식", "XML만 제공"),
        ("주소", "https가 아니라 http"),
        ("개발계정 한도", "1,000건/일"),
        ("갱신", "매일 (호출 시 어제 기준일분까지 확인, 당일분 시각은 미확인)"),
        ("성공 코드", 'resultCode "00" (NORMAL SERVICE.)'),
    ],
    "params": [
        P("serviceKey", "required", "공공데이터포털 인증키", "(64자 인증키)"),
        P("standYmd", "required", "기준일 (YYYYMMDD)", "20261011",
          "형식이 틀리면 resultCode 99 + Oracle 내부 오류 문구가 본문에 온다 (HTTP 200)"),
        P("judgeKind", "required", "축종 코드. 4301 소, 4304 돼지, 4401 수입 소고기, 4402 수입 돼지고기, 9901 닭, 9903 계란, 9908 우유", "4304"),
        P("itemCd", "optional", "품목(부위) 코드. 소: 21 안심 22 등심 36 설도 40 양지 50 갈비 / 돼지: 25 앞다리 27 삼겹살 28 갈비 68 목살 / 우유 01 흰우유 등", "27",
          "명세상 필수지만 빼면 해당 축종 전 품목이 온다 (pork-all-items 샘플)"),
    ],
    "param_note": "한도가 가장 작다(1,000건/일). itemCd를 생략하면 한 번에 축종 전체가 와서 호출 수를 아낄 수 있다.",
    "tree": """response
├─ header
│   ├─ resultCode      "00" = 정상, "99" = 기타 오류
│   └─ resultMsg       "NORMAL SERVICE."
└─ body.items.item[]   품목 × 등급(원산지) × [기준일 행 + 평년 행]
        standYmd = "20261011"  → 그날의 값
        standYmd = "평년"       → 같은 품목·등급의 평년 값 (쌍으로 온다)""",
    "codes": [
        ("00", "정상 (NORMAL SERVICE.)"),
        ("99", "기준일 형식 오류 등 — HTTP 200. resultMsg에 DB 내부 오류 문구(ORA-…, 패키지명)가 섞여 온다. 그대로 로그·화면에 내보내지 않는다"),
    ],
    "fields": [
        F("standYmd", "기준일. 날짜 또는 '평년'", "문자열 (YYYYMMDD | 평년)", note="'평년' 행은 같은 품목·등급의 평년 값. 몇 년 평균인지는 미확인"),
        F("judgeKind", "축종 코드"),
        F("judgeKindNm", "축종 이름"),
        F("itemCd", "품목(부위) 코드"),
        F("itemNm", "품목(부위) 이름", note="닭은 '육계(kg)', 계란은 'XL30구'처럼 단위가 이름에 섞인다"),
        F("grdNm", "등급 또는 원산지", note="'1+등급', '호주산', '구분없음' 등. 등급과 원산지가 한 필드에 섞여 있다"),
        F("ntslPrc", "전국 평균가격", "문자열 (숫자)", fmt="won"),
        F("maxPrc", "최고가격", "문자열 (숫자)", fmt="won"),
        F("minPrc", "최저가격", "문자열 (숫자)", fmt="won"),
    ] + [F(f"regionPrc{i}", f"{REGIONS[i-1]} 가격", "문자열 (숫자)", fmt="won") for i in range(1, 18)] + [
        F("unit", "가격 단위", note="품목마다 다르다: 원/100g(소·돼지), 원/Kg(닭), 원/30구(계란), 원/1L(우유)"),
    ],
    "samples": [
        ("ekape/pork-samgyeopsal", "돼지 삼겹살 (itemCd=27)", "기준일 행과 평년 행 2건"),
        ("ekape/pork-all-items", "돼지 · 전 품목 (itemCd 생략)", "앞다리·삼겹살·갈비·목살 × (기준일, 평년)"),
        ("ekape/beef-deungsim", "소 등심 (itemCd=22)", "1+등급, 1등급 × (기준일, 평년) = 4건"),
        ("ekape/beef-all-items", "소 · 전 품목", "부위 × 등급 × (기준일, 평년)"),
        ("ekape/beef-import-all-items", "수입 소고기 · 전 품목", "등급 대신 원산지(호주산, 미국산)가 grdNm에 들어간다"),
        ("ekape/pork-import-samgyeopsal", "수입 돼지 삼겹살", ""),
        ("ekape/chicken-all-items", "닭 (육계)", "단위가 원/Kg"),
        ("ekape/egg-all-items", "계란", "단위가 원/30구"),
        ("ekape/milk-all-items", "우유", "단위가 원/1L"),
        ("ekape/error-bad-date", "기준일 형식 오류", "HTTP 200 + resultCode 99, 오류 문구에 DB 내부 정보가 섞여 있다"),
    ],
    "viz": "ekape",
}

CH_BASE = "https://apis.data.go.kr/B551919/ProductPriceInfoService"

CH_PRICE = {
    "id": "cham-price",
    "group": "cham",
    "tab": "가격 조회",
    "title": "참가격 생필품 가격 조회",
    "org": "한국소비자원 참가격 (공공데이터포털)",
    "role": "조사일·판매점·상품별 판매가. 할인 여부, 할인 기간, 1+1 여부를 함께 준다.",
    "url": CH_BASE + "/getProductPriceInfoSvc",
    "facts": [
        ("형식", "XML만 제공"),
        ("개발계정 한도", "2,000건/일"),
        ("조사 주기", "격주 금요일 (실측). 명세는 매주 금요일"),
        ("과거 조회", "2026-06-12 조사분부터"),
        ("페이지 나누기", "없음. 한 번에 전부 온다 (업체 1곳 약 369건 / 상품 1개 약 419건)"),
        ("성공 코드", 'resultCode "00" (resultMsg ok)'),
    ],
    "params": [
        P("serviceKey", "required", "공공데이터포털 인증키 (소문자 s)", "(64자 인증키)",
          "나머지 3개 기능은 대문자 ServiceKey다"),
        P("goodInspectDay", "required", "조사일 (YYYYMMDD)", "20260925",
          "조사일이 아니면 오류가 아니라 빈 <result/>가 온다. 날짜 형식이 틀리면 코드 01"),
        P("entpId", "either", "업체(판매점) 아이디. entpId와 goodId 중 하나는 있어야 한다", "100",
          "둘 다 없으면 코드 05"),
        P("goodId", "either", "상품 아이디", "1000"),
    ],
    "param_note": "pageNo, numOfRows를 보내도 무시한다. 업체로 조회하면 그 업체의 전 상품, 상품으로 조회하면 그 상품의 전 업체가 온다.",
    "tree": """response
├─ result
│   └─ iros.openapi.service.vo.goodPriceVO[]   가격 1건 = 조사일 × 업체 × 상품
├─ resultCode      "00" = 정상
└─ resultMsg       "ok"
(조사일이 아니면 result가 비어 있다: <result/>)""",
    "codes": [
        ("00", "정상 (ok). 조사일이 아니면 이 코드에 빈 결과"),
        ("01", "올바른 조사일자가 아님 (날짜 누락·형식 오류)"),
        ("05", "entpId, goodId 값이 모두 없음"),
    ],
    "fields": [
        F("goodInspectDay", "조사일", "문자열 (YYYYMMDD)"),
        F("entpId", "업체(판매점) 아이디 → 판매점 정보의 entpId"),
        F("goodId", "상품 아이디 → 상품 정보의 goodId"),
        F("goodPrice", "판매 가격", "문자열 (숫자)", fmt="won"),
        F("goodDcYn", "할인 여부 (Y/N)", note="업체 100의 8/28~9/25 조회에서는 Y가 한 건도 없었다"),
        F("goodDcStartDay", "할인 시작일", note="goodDcYn=Y일 때만 값이 있다"),
        F("goodDcEndDay", "할인 종료일", note="goodDcYn=Y일 때만 값이 있다"),
        F("plusoneYn", "1+1 여부 (Y/N)"),
        F("inputDttm", "입력일시 (KST)", "문자열 (YYYY-MM-DD hh:mm:ss)", note="조사일보다 0~2일 이르다"),
    ],
    "samples": [
        ("chamgagyeok/price-by-entp-100", "업체 100 · 전 상품", "현대백화점 미아점의 그날 가격 전부. 상품명은 상품 정보와 연결해 보여준다"),
        ("chamgagyeok/price-by-good-1000", "상품 1000 · 전 업체", "한 상품(팔도 왕뚜껑)의 업체별 가격 비교"),
        ("chamgagyeok/price-non-survey-day", "조사일이 아닌 날", "resultCode는 00이고 <result/>만 온다"),
        ("chamgagyeok/error-no-entp-no-good", "업체·상품 모두 없음", "resultCode 05"),
        ("chamgagyeok/error-bad-date", "날짜 형식 오류", "resultCode 01"),
    ],
    "viz": "cham-price",
}

CH_STORE = {
    "id": "cham-store",
    "group": "cham",
    "tab": "판매점 정보",
    "title": "참가격 판매점 정보",
    "org": "한국소비자원 참가격 (공공데이터포털)",
    "role": "가격을 조사하는 판매점(업체)의 이름·업태·지역·주소·좌표.",
    "url": CH_BASE + "/getStoreInfoSvc.do",
    "facts": [
        ("형식", "XML만 제공"),
        ("개발계정 한도", "2,000건/일 (4개 기능 합산 여부는 미확인)"),
        ("전체 건수", "630곳 (전체 조회 시 약 350KB)"),
        ("주소 끝", ".do가 붙는다 (가격 조회만 없음)"),
    ],
    "params": [
        P("ServiceKey", "required", "공공데이터포털 인증키 (대문자 S)", "(64자 인증키)"),
        P("entpId", "optional", "업체 아이디. 빼면 전체 판매점", "100"),
    ],
    "param_note": "업태 코드(entpTypeCode)는 기준정보 BU, 지역 코드는 기준정보 AR로 이름을 찾는다.",
    "tree": """response
├─ result
│   └─ iros.openapi.service.vo.entpInfoVO[]   판매점 1곳
├─ resultCode      "00"
└─ resultMsg       "ok" """,
    "codes": [("00", "정상 (ok)")],
    "fields": [
        F("entpId", "업체(판매점) 아이디"),
        F("entpName", "업체 이름 (실명)", note="이마트 가양점처럼 점포까지 실명이다. 참가격의 가장 큰 특징"),
        F("entpTypeCode", "업태 코드 (기준정보 BU)", note="DP 백화점, LM 대형마트, SM 슈퍼마켓, CS 편의점, MF 제조사(실제 판매점에는 없음)"),
        F("entpAreaCode", "지역 코드 (기준정보 AR) — 시도 단위"),
        F("areaDetailCode", "지역 상세 코드 (기준정보 AR) — 시군구 단위"),
        F("entpTelno", "전화번호"),
        F("postNo", "우편번호"),
        F("plmkAddrBasic", "지번 주소 (기본)"),
        F("plmkAddrDetail", "지번 주소 (상세)"),
        F("roadAddrBasic", "도로명 주소 (기본)"),
        F("roadAddrDetail", "도로명 주소 (상세)"),
        F("xMapCoord", "좌표 X", "문자열 (실수)", note="이름과 달리 위도다 (37.6… = 서울)"),
        F("yMapCoord", "좌표 Y", "문자열 (실수)", note="이름과 달리 경도다 (127.0… = 서울)"),
    ],
    "samples": [
        ("chamgagyeok/store-100", "판매점 100 (1곳)", "현대백화점 미아점"),
        ("chamgagyeok/store-all", "전체 판매점 (630곳)", "업태·지역 분포 차트가 이 샘플에서 나온다"),
    ],
    "viz": "cham-store",
}

CH_PRODUCT = {
    "id": "cham-product",
    "group": "cham",
    "tab": "상품 정보",
    "title": "참가격 상품 정보",
    "org": "한국소비자원 참가격 (공공데이터포털)",
    "role": "가격을 조사하는 상품의 이름·분류·용량·단위·제조사 코드.",
    "url": CH_BASE + "/getProductInfoSvc.do",
    "facts": [
        ("형식", "XML만 제공"),
        ("전체 건수", "604개 (전체 조회 시 약 230KB)"),
        ("응답 태그", "다른 기능과 달리 result 아래 item[]"),
    ],
    "params": [
        P("ServiceKey", "required", "공공데이터포털 인증키 (대문자 S)", "(64자 인증키)"),
        P("goodId", "optional", "상품 아이디. 빼면 전체 상품", "1000"),
    ],
    "param_note": "Swagger 명세에는 datailMean으로 적혀 있지만 실제 태그는 detailMean이다.",
    "tree": """response
├─ result
│   └─ item[]          상품 1개
├─ resultCode      "00"
└─ resultMsg       "ok" """,
    "codes": [("00", "정상 (ok)")],
    "fields": [
        F("goodId", "상품 아이디"),
        F("goodName", "상품 이름", note="브랜드·용량이 이름에 들어 있다 (예: 팔도 왕뚜껑(110g))"),
        F("productEntpCode", "제조사 코드", note="이름으로 바꿀 방법이 API에 없다. 브랜드가 아니라 공급 회사 단위 (469 = 신선식품 29개)"),
        F("goodSmlclsCode", "상품 소분류 코드 (기준정보 AL)", note="앞 4자리가 대분류 (0301 신선식품, 0302 가공식품)"),
        F("goodTotalCnt", "용량", "문자열 (숫자)"),
        F("goodTotalDivCode", "용량 단위 코드 (기준정보 UT)", note="G 그램, BE 병, BO 봉 …"),
        F("goodBaseCnt", "단위량 (100g당 가격 표시용으로 보임)", "문자열 (숫자)"),
        F("goodUnitDivCode", "단위량 단위 코드 (기준정보 UT)"),
        F("detailMean", "상세 내용 (포장 형태 등)", note="604개 중 203개만 값이 있다 (예: 120g*5개, 캔, PET)"),
    ],
    "samples": [
        ("chamgagyeok/product-1000", "상품 1000 (1개)", "팔도 왕뚜껑(110g)"),
        ("chamgagyeok/product-all", "전체 상품 (604개)", "대분류별 상품 수 차트가 이 샘플에서 나온다"),
    ],
    "viz": "cham-product",
}

CH_STANDARD = {
    "id": "cham-standard",
    "group": "cham",
    "tab": "기준정보 (코드표)",
    "title": "참가격 기준정보",
    "org": "한국소비자원 참가격 (공공데이터포털)",
    "role": "다른 응답의 코드를 이름으로 바꾸는 코드표. 분류(AL), 단위(UT), 지역(AR), 업태(BU).",
    "url": CH_BASE + "/getStandardInfoSvc.do",
    "facts": [
        ("형식", "XML만 제공"),
        ("classCode 값", "명세에 목록이 없어 실측으로 찾았다: AL 188건, UT 29건, AR 311건, BU 5건"),
    ],
    "params": [
        P("ServiceKey", "required", "공공데이터포털 인증키 (대문자 S)", "(64자 인증키)"),
        P("classCode", "required", "코드 종류: AL 상품 분류, UT 단위, AR 지역, BU 업태", "BU",
          "그 밖의 값은 코드 02. 제조사용 코드(MF, PE, MK 등)는 없다"),
    ],
    "param_note": "코드표는 거의 바뀌지 않으므로 한 번 받아 보관하고 계약 테스트에서 변경을 감시한다.",
    "tree": """response
├─ result
│   └─ iros.openapi.service.vo.stdInfoVO[]   코드 1개
├─ resultCode      "00"
└─ resultMsg       "ok" """,
    "codes": [
        ("00", "정상 (ok)"),
        ("02", "classCode 값이 정확하지 않음"),
    ],
    "fields": [
        F("code", "코드"),
        F("codeName", "코드 이름"),
        F("highCode", "상위 코드 (계층 구조)", note="AL, AR은 상위 코드로 대·중·소분류, 시도·시군구 계층을 이룬다"),
    ],
    "samples": [
        ("chamgagyeok/standard-BU", "업태 (BU)", "5건"),
        ("chamgagyeok/standard-UT", "단위 (UT)", "29건"),
        ("chamgagyeok/standard-AL", "상품 분류 (AL)", "188건"),
        ("chamgagyeok/standard-AR", "지역 (AR)", "311건"),
        ("chamgagyeok/error-bad-classcode", "잘못된 classCode", "resultCode 02"),
    ],
    "viz": "none",
}

GROUPS = [
    {"id": "kamis", "name": "KAMIS", "sub": "농·수산물 시세", "eps": [KAMIS]},
    {"id": "ekape", "name": "축평원", "sub": "정육·계란·우유", "eps": [EKAPE]},
    {"id": "cham", "name": "참가격", "sub": "매장별 생필품 가격", "eps": [CH_PRICE, CH_STORE, CH_PRODUCT, CH_STANDARD]},
]

# ───────────────────────── 샘플 파싱 ─────────────────────────

RECORD_TAGS = {"item", "goodPriceVO", "entpInfoVO", "stdInfoVO"}
OK_CODES = {"0", "00"}


def parse_json(text):
    d = json.loads(text)
    header, total, rows = {}, None, []
    if "response" in d:
        r = d["response"]
        header = r.get("header", {})
        body = r.get("body", {})
        total = body.get("totalCount")
        items = (body.get("items") or {}).get("item", [])
        rows = items if isinstance(items, list) else [items]
    elif "OpenAPI_ServiceResponse" in d:
        h = d["OpenAPI_ServiceResponse"].get("cmmMsgHeader", {})
        header = {"resultCode": h.get("returnReasonCode"), "resultMsg": h.get("errMsg") or h.get("returnAuthMsg")}
    return header, total, rows


def parse_xml(text):
    root = ET.fromstring(text)
    header = {
        "resultCode": (root.findtext(".//resultCode") or "").strip(),
        "resultMsg": (root.findtext(".//resultMsg") or "").strip(),
    }
    rows = []
    for el in root.iter():
        if el.tag.split(".")[-1] in RECORD_TAGS and len(el) > 0:
            rows.append({c.tag: (c.text or "").strip() for c in el})
    return header, None, rows


def load_samples():
    out = []
    with open(SAMPLES / "manifest.tsv", encoding="utf-8") as f:
        for m in csv.DictReader(f, delimiter="\t"):
            rel = m["file"]
            path = SAMPLES / rel
            text = path.read_text(encoding="utf-8")
            header, total, rows = (parse_json if rel.endswith(".json") else parse_xml)(text)
            cols = []
            for r in rows:
                for k in r:
                    if k not in cols:
                        cols.append(k)
            code = str(header.get("resultCode", ""))
            http = int(m["http"])
            if http != 200 or code not in OK_CODES:
                kind = "error"
            elif not rows:
                kind = "empty"
            else:
                kind = "ok"
            out.append({
                "id": rel.rsplit(".", 1)[0],
                "file": "samples/" + rel,
                "http": http,
                "bytes": int(m["bytes"]),
                "fetchedAt": m["fetched_at"],
                "request": m["request"],
                "kind": kind,
                "resultCode": code,
                "resultMsg": str(header.get("resultMsg", "")),
                "total": total if total is None else int(total),
                "cols": cols,
                "rows": [[r.get(c, "") for c in cols] for r in rows],
                "raw": text if len(text) <= RAW_LIMIT else None,
            })
    return out


# ───────────────────────── 요청 조립기용 코드 목록 ─────────────────────────

def kamis_code_sheets():
    """code-table.txt 를 시트 7개(구분·부류·품목·품종·등급·시군구·시장)로 나눠 행 목록으로 돌려준다."""
    text = (SAMPLES.parent / "kamis" / "code-table.txt").read_text(encoding="utf-8")
    sheets, cur = [], None
    for line in text.splitlines():
        if line.startswith("== xl/worksheets/sheet"):
            cur = []
            sheets.append(cur)
        elif cur is not None and "|" in line:
            cur.append([c.strip() for c in line.split("|")])
    return [sh[1:] for sh in sheets]  # 각 시트의 머리글 행 제외


SE_MVP = {"01": "  [MVP 수집]", "02": "  [MVP 제외 · 이후]", "03": "  [MVP 제외 · 데이터 없음]", "07": "  [MVP 제외]"}


def kamis_builder():
    se, ct, it, vr, gr, sg, mk = kamis_code_sheets()
    seen = set()
    grd = []
    for c, i, _v, g, n in gr:
        if (c, i, g) not in seen:
            seen.add((c, i, g))
            grd.append([g, f"{g} · {n}", f"{c}|{i}"])
    vrt = {}
    for c, i, v, n in vr:
        vrt.setdefault((c, i, v), n)
    CT, IT, SG = "cond[ctgry_cd::EQ]", "cond[item_cd::EQ]", "cond[sgg_cd::EQ]"
    return {
        "returnType": {"kind": "select", "options": [["JSON", "JSON", ""], ["XML", "XML", ""]]},
        "cond[se_cd::EQ]": {"kind": "select", "options": [[c, f"{c} · {n}" + SE_MVP.get(c, ""), ""] for c, n in se]},
        CT: {"kind": "select", "options": [[c, f"{c} · {n}", ""] for c, n in ct]},
        IT: {"kind": "select", "parents": [CT], "options": [[i, f"{i} · {n}", c] for c, i, n in it]},
        "cond[vrty_cd::EQ]": {"kind": "select", "parents": [CT, IT],
                              "options": [[v, f"{v} · {n}", f"{c}|{i}"] for (c, i, v), n in vrt.items()]},
        "cond[grd_cd::EQ]": {"kind": "select", "parents": [CT, IT], "options": grd},
        SG: {"kind": "select", "options": [[c, f"{c} · {n}", ""] for c, n in sg]},
        "cond[mrkt_cd::EQ]": {"kind": "combo", "parents": [SG], "options": [[m, f"{m} · {n}", c] for c, m, n in mk]},
    }


def ekape_builder(samples):
    kinds = [("4301", "소"), ("4304", "돼지"), ("4401", "수입 소고기"), ("4402", "수입 돼지고기"),
             ("9901", "닭"), ("9903", "계란"), ("9908", "우유")]
    items, seen = [], set()
    for s in samples:
        if s["id"].startswith("ekape/") and s["kind"] == "ok":
            ix = {c: i for i, c in enumerate(s["cols"])}
            for r in s["rows"]:
                k = (r[ix["judgeKind"]], r[ix["itemCd"]])
                if k not in seen:
                    seen.add(k)
                    items.append([k[1], f"{k[1]} · {r[ix['itemNm']]}", k[0]])
    return {
        "judgeKind": {"kind": "select", "options": [[c, f"{c} · {n}", ""] for c, n in kinds]},
        "itemCd": {"kind": "combo", "parents": ["judgeKind"], "options": items,
                   "note": "목록은 저장한 샘플에서 확인된 부위만이다. 전체 코드는 ekape/openapi-guide.txt"},
    }


def sample_options(samples, sid, id_col, name_col):
    s = next(x for x in samples if x["id"] == sid)
    ix = {c: i for i, c in enumerate(s["cols"])}
    return [[r[ix[id_col]], f"{r[ix[id_col]]} · {r[ix[name_col]]}", ""] for r in s["rows"]]


def attach_builders(samples):
    kb = kamis_builder()
    eb = ekape_builder(samples)
    entp = sample_options(samples, "chamgagyeok/store-all", "entpId", "entpName")
    good = sample_options(samples, "chamgagyeok/product-all", "goodId", "goodName")
    cls = {"kind": "select", "options": [["AL", "AL · 상품 분류", ""], ["UT", "UT · 단위", ""], ["AR", "AR · 지역", ""], ["BU", "BU · 업태", ""]]}
    by_id = {
        KAMIS["id"]: kb,
        EKAPE["id"]: eb,
        CH_PRICE["id"]: {"entpId": {"kind": "combo", "options": entp}, "goodId": {"kind": "combo", "options": good}},
        CH_STORE["id"]: {"entpId": {"kind": "combo", "options": entp}},
        CH_PRODUCT["id"]: {"goodId": {"kind": "combo", "options": good}},
        CH_STANDARD["id"]: {"classCode": cls},
    }
    for g in GROUPS:
        for ep in g["eps"]:
            ep["build"] = by_id[ep["id"]]


def main():
    samples = load_samples()
    attach_builders(samples)
    by_id = {s["id"]: s for s in samples}
    missing = [sid for g in GROUPS for ep in g["eps"] for sid, *_ in ep["samples"] if sid not in by_id]
    if missing:
        sys.exit(f"manifest에 없는 샘플: {missing}")
    used = {sid for g in GROUPS for ep in g["eps"] for sid, *_ in ep["samples"]}
    unused = sorted(set(by_id) - used)
    if unused:
        print("화면에 연결되지 않은 샘플:", unused)

    data = {
        "groups": GROUPS,
        "samples": samples,
        "regions": REGIONS,
        "builtAt": max(s["fetchedAt"] for s in samples),
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = (HERE / "template.html").read_text(encoding="utf-8").replace("/*__DATA__*/null", payload)
    out = HERE / "api-explorer.html"
    out.write_text(html, encoding="utf-8")
    print(f"{out}  ({out.stat().st_size / 1024:.0f} KB, 샘플 {len(samples)}개)")


if __name__ == "__main__":
    main()
