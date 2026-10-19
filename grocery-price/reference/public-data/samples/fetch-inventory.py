#!/usr/bin/env python3
"""출처별 제공 품목 전수 목록(p2/13)을 만든다.

사용법 (저장소 루트에서):
    set -a; . ./.env; set +a
    python3 -I grocery-price/reference/public-data/samples/fetch-inventory.py <단계>

단계:
    kamis-day      KAMIS 부류 전체를 하루치로 받는다 (품목코드 범위 조건, 날짜 2개)
    kamis-item     하루치에 없던 품목만 최근 30일을 품목별로 받는다
    kamis-eco      구분 03·07을 부류별 최근 30일로 받는다
    kamis-history  품목별·구분별(01, 02) 가장 오래된 조사일 (시작일 없이 numOfRows=1)
    ekape          축평원 7개 축종 전 품목 (itemCd 없이), 날짜 여러 개
    cham           참가격 판매점 표본의 최근 조사일 가격, 삼겹살 상품의 조사일별 가격
    build          /tmp 원본으로 samples/inventory/*.csv 를 만든다 (호출 없음)

- 인증키는 환경변수 DATA_GO_KR_SERVICE_KEY 로만 읽고, 출력·파일에 남기지 않는다.
- 원본 응답은 RAW 디렉터리(/tmp/p2-13-raw)에 저장한다. 같은 이름의 파일이 있으면 다시 호출하지 않는다.
- 호출 기록은 RAW/calls.tsv (키 제외).
"""
import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import html
import re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.dirname(HERE)
RAW = os.environ.get("P2_13_RAW", "/tmp/p2-13-raw")
OUT = os.path.join(HERE, "inventory")
CODE_TABLE = os.path.join(PUB, "kamis", "code-table.txt")

KAMIS_URL = "https://apis.data.go.kr/B552845/perDay/price"
EKAPE_URL = "http://data.ekape.or.kr/openapi-data/service/user/grade/consumerPriceDaily"
CHAM_URL = "https://apis.data.go.kr/B551919/ProductPriceInfoService"

# 하루치 전수에 쓰는 날짜 (2026-10-16 금, 10-15 목)
KAMIS_DAYS = ["20261016", "20261015"]
RECENT_FROM, RECENT_TO = "20260917", "20261016"  # 최근 30일
SEL = "exmn_ymd,se_cd,ctgry_cd,item_cd,item_nm,vrty_cd,vrty_nm,grd_cd,grd_nm,sgg_cd,mrkt_cd,mrkt_nm,unit,unit_sz"

LIMITS = {"kamis": 300, "ekape": 100, "cham": 30}


def xml_items(b, tag):
    """평평한 XML 에서 <tag> 요소들의 자식 텍스트를 dict 로 꺼낸다 (expat 없이 동작하도록 정규식 사용)."""
    s = b.decode("utf-8") if isinstance(b, bytes) else b
    out = []
    # 참가격은 태그 이름에 패키지 접두어가 붙는다 (iros.openapi.service.vo.goodPriceVO)
    for _, body in re.findall(rf"<((?:[\w.]+\.)?{tag})>(.*?)</\1>", s, re.S):
        d = {k: html.unescape(v.strip()) for k, v in re.findall(r"<(\w+)>([^<]*)</\1>", body)}
        for k in re.findall(r"<(\w+)\s*/>", body):
            d.setdefault(k, "")
        out.append(d)
    return out


def xml_text(b, tag):
    s = b.decode("utf-8") if isinstance(b, bytes) else b
    m = re.search(rf"<{tag}>([^<]*)</{tag}>", s)
    return m.group(1).strip() if m else None


def key():
    k = os.environ.get("DATA_GO_KR_SERVICE_KEY")
    if not k:
        sys.exit("DATA_GO_KR_SERVICE_KEY 가 없다")
    return k


def calls_used():
    c = Counter()
    p = os.path.join(RAW, "calls.tsv")
    if os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            c[line.split("\t")[0]] += 1
    return c


def get(source, url, params, name, keyname="serviceKey"):
    """원본을 RAW/name 에 저장하고 bytes 를 돌려준다. 이미 있으면 재사용."""
    os.makedirs(RAW, exist_ok=True)
    path = os.path.join(RAW, name)
    if os.path.exists(path):
        return open(path, "rb").read()
    used = calls_used()[source]
    if used >= LIMITS[source]:
        raise SystemExit(f"{source} 호출 한도({LIMITS[source]}) 도달")
    q = urllib.parse.urlencode({keyname: key(), **params})
    shown = urllib.parse.urlencode(params)
    try:
        body = urllib.request.urlopen(f"{url}?{q}", timeout=180).read()
    except Exception as e:  # 실패한 호출도 한도를 쓴 것으로 센다. 다시 시도하지 않는다
        with open(os.path.join(RAW, "calls.tsv"), "a", encoding="utf-8") as f:
            f.write(f"{source}\tFAILED:{name}\t0\t{type(e).__name__} {e}\n")
        raise
    with open(path, "wb") as f:
        f.write(body)
    with open(os.path.join(RAW, "calls.tsv"), "a", encoding="utf-8") as f:
        f.write(f"{source}\t{name}\t{len(body)}\t{url}?{shown}\n")
    time.sleep(0.15)
    return body


# ── KAMIS 코드표 ─────────────────────────────────────────────

def code_table():
    sheets, cur = {}, None
    for line in open(CODE_TABLE, encoding="utf-8"):
        line = line.rstrip("\n")
        if line.startswith("== "):
            cur = line.split("sheet")[-1].split(".")[0]
            sheets[cur] = []
            continue
        if cur and " | " in line:
            sheets[cur].append([c.strip() for c in line.split(" | ")])
    names = {"1": "se", "2": "ctgry", "3": "item", "4": "vrty", "5": "grd", "6": "sgg", "7": "mrkt"}
    return {names[k]: v[1:] for k, v in sheets.items()}  # 머리행 제외


def kamis(params, name):
    p = {"returnType": "JSON", "pageNo": "1", "numOfRows": "1000", **params}
    b = get("kamis", KAMIS_URL, p, name)
    d = json.loads(b)
    h = d["response"]["header"]
    if h.get("resultCode") != "0":
        raise SystemExit(f"KAMIS 오류 {name}: {h}")
    body = d["response"]["body"]
    items = (body.get("items") or {}).get("item") or []
    if isinstance(items, dict):
        items = [items]
    return int(body.get("totalCount") or 0), items


def kamis_day_rows():
    """하루치 부류 전수 행 (날짜 2개)."""
    rows = []
    for day in KAMIS_DAYS:
        for ctgry in ["100", "200", "300", "400", "500", "600"]:
            ranges = [("0", "9999")]  # 품목코드 조건이 없으면 0건이라 범위로 전체를 받는다
            for lo, hi in ranges:
                page, total = 1, None
                while True:
                    base = {
                        "cond[exmn_ymd::GTE]": day, "cond[exmn_ymd::LTE]": day,
                        "cond[ctgry_cd::EQ]": ctgry, "cond[item_cd::GTE]": lo, "cond[item_cd::LTE]": hi,
                        "selectable": SEL, "pageNo": str(page),
                    }
                    total, items = kamis(base, f"kamis-day-{day}-{ctgry}-{lo}-{hi}-p{page}.json")
                    rows += items
                    if page * 1000 >= total:
                        break
                    page += 1
    return rows


def kamis_item_rows(ct):
    seen = {r["item_cd"] for r in kamis_day_rows()}
    rows, totals = [], {}
    for ctgry, item, _ in ct["item"]:
        if item in seen:
            continue
        total, items = kamis({
            "cond[exmn_ymd::GTE]": RECENT_FROM, "cond[exmn_ymd::LTE]": RECENT_TO,
            "cond[ctgry_cd::EQ]": ctgry, "cond[item_cd::EQ]": item, "selectable": SEL,
        }, f"kamis-item30-{ctgry}-{item}.json")
        totals[item] = total
        rows += items
    return rows, totals


def kamis_eco():
    out = {}
    for se in ["03", "07"]:
        for ctgry in ["100", "200", "300", "400", "500", "600"]:
            lo, hi = ("0", "9999")
            page, allitems = 1, []
            while True:
                suffix = "" if page == 1 else f"-p{page}"
                total, items = kamis({
                    "cond[exmn_ymd::GTE]": RECENT_FROM, "cond[exmn_ymd::LTE]": RECENT_TO,
                    "cond[ctgry_cd::EQ]": ctgry, "cond[item_cd::GTE]": lo, "cond[item_cd::LTE]": hi,
                    "cond[se_cd::EQ]": se, "selectable": SEL, "pageNo": str(page),
                }, f"kamis-eco30-{se}-{ctgry}{suffix}.json")
                allitems += items
                if page * 1000 >= total:
                    break
                page += 1
            out[(se, ctgry)] = (total, allitems)
    return out


def kamis_absent_2y(ct):
    """최근 30일에 0건인 품목이 최근 2년 안에는 있었는지 (제철 품목과 폐지 품목 구분)."""
    rows, totals = kamis_item_rows(ct)
    out = {}
    for c, item, _ in ct["item"]:
        if totals.get(item, -1) != 0:
            continue
        total, items = kamis({
            "numOfRows": "1", "cond[exmn_ymd::GTE]": "20241001", "cond[exmn_ymd::LTE]": RECENT_TO,
            "cond[ctgry_cd::EQ]": c, "cond[item_cd::EQ]": item, "selectable": "exmn_ymd,se_cd,vrty_nm",
        }, f"kamis-2y-{c}-{item}.json")
        out[item] = (total, items[0] if items else {})
    # 구분 03: 채소·식량 부류 2년치
    for c in ["100", "200"]:
        total, items = kamis({
            "numOfRows": "1", "cond[exmn_ymd::GTE]": "20241001", "cond[exmn_ymd::LTE]": RECENT_TO,
            "cond[ctgry_cd::EQ]": c, "cond[item_cd::GTE]": "0", "cond[item_cd::LTE]": "9999",
            "cond[se_cd::EQ]": "03", "selectable": "exmn_ymd,item_nm",
        }, f"kamis-2y-se03-{c}.json")
        out["se03-" + c] = (total, items[0] if items else {})
    return out


# 시작일 없는 이력 조회가 504로 실패한 품목: 범위를 1996-01-01 ~ (예상 시작 연도 말)로 좁혀 받는다.
# 예상 시작 연도는 같은 품목의 중도매(02) 시작 연도나 비슷한 품목의 소매 시작 연도다.
# 결과가 있으면 첫 행이 정확한 시작일이고, 0건이면 그 연도보다 늦게 시작한 것이다.
HIST_PROBE = {
    "256": "2009", "422": "1998", "312": "1996", "315": "2002", "316": "2004", "319": "2013",
    "412": "1996", "413": "1996", "416": "1996", "418": "1996", "421": "1998", "430": "2015",
    "613": "1996", "614": "1996", "619": "1996", "638": "1996", "641": "1996", "642": "1996",
    "651": "2015", "652": "2015", "656": "2016", "658": "2024", "661": "2016", "662": "2020",
}


def kamis_hist_probe(ct):
    ctg = {i: c for c, i, _ in ct["item"]}
    out = {}
    for item, year in HIST_PROBE.items():
        name = f"kamis-hist-01-{item}.json"
        if os.path.exists(os.path.join(RAW, name)):
            continue
        total, items = kamis({
            "numOfRows": "1", "cond[exmn_ymd::GTE]": "19960101", "cond[exmn_ymd::LTE]": f"{year}1231",
            "cond[ctgry_cd::EQ]": ctg[item], "cond[item_cd::EQ]": item, "cond[se_cd::EQ]": "01",
            "selectable": "exmn_ymd,vrty_nm,mrkt_nm,unit,unit_sz",
        }, f"kamis-histprobe-01-{item}-{year}.json")
        out[item] = (year, total, items[0] if items else {})
        print(item, out[item], flush=True)
    return out


SNAP_DAY = "20211015"  # 5년 전 같은 시기 (금)


def kamis_snap():
    """5년 전 하루치(소매)에 어떤 품목이 있었는지. 평년 5년 백필이 가능한지 보는 표본."""
    rows = []
    for ctgry in ["100", "200", "300", "400", "500", "600"]:
        page = 1
        while True:
            total, items = kamis({
                "cond[exmn_ymd::GTE]": SNAP_DAY, "cond[exmn_ymd::LTE]": SNAP_DAY,
                "cond[ctgry_cd::EQ]": ctgry, "cond[item_cd::GTE]": "0", "cond[item_cd::LTE]": "9999",
                "cond[se_cd::EQ]": "01", "selectable": "item_cd,vrty_cd,grd_cd", "pageNo": str(page),
            }, f"kamis-snap-{SNAP_DAY}-{ctgry}-p{page}.json")
            rows += items
            if page * 1000 >= total:
                break
            page += 1
    return rows


def recent_rows(ct):
    rows = kamis_day_rows()
    r2, totals = kamis_item_rows(ct)
    return rows + r2, totals


def kamis_history(ct, ses=("01", "02"), shard=None):
    rows, _ = recent_rows(ct)
    present = {(r["item_cd"], r["se_cd"]) for r in rows}
    ctg = {i: c for c, i, _ in ct["item"]}
    # 코드표에 없지만 응답에 나오는 품목 (예: 115 현미, 437 키위, 664 낙지, 665 꼬막)
    extra = sorted({(r["ctgry_cd"], r["item_cd"]) for r in rows if r["item_cd"] not in ctg})
    for c, i in extra:
        ctg[i] = c
    item_list = [(c, i, "") for c, i, _ in ct["item"]] + [(c, i, "") for c, i in extra]
    hist = {}
    for se in ses:
        order = list(enumerate(item_list))
        if os.environ.get("P2_13_REVERSE"):
            order.reverse()  # 같은 샤드를 반대쪽 끝에서 받는 보조 프로세스용
        for n, (c, item, _) in order:
            if (item, se) not in present:
                continue
            if shard and n % shard[1] != shard[0]:
                continue  # 느린 호출(1~2분)을 여러 프로세스로 나눠 받는다
            total, items = kamis({
                "numOfRows": "1", "cond[exmn_ymd::LTE]": RECENT_TO,
                "cond[ctgry_cd::EQ]": ctg[item], "cond[item_cd::EQ]": item, "cond[se_cd::EQ]": se,
                "selectable": "exmn_ymd,vrty_nm,mrkt_nm,unit,unit_sz",
            }, f"kamis-hist-{se}-{item}.json")
            hist[(item, se)] = (items[0] if items else {}, total)
    return hist


# ── 축평원 ────────────────────────────────────────────────

EKAPE_KINDS = ["4301", "4304", "4401", "4402", "9901", "9903", "9908"]
EKAPE_DATES = ["20261016", "20261015", "20260917"]


def ekape_rows():
    rows = []
    for day in EKAPE_DATES:
        for kind in EKAPE_KINDS:
            b = get("ekape", EKAPE_URL, {"standYmd": day, "judgeKind": kind}, f"ekape-{day}-{kind}.xml")
            code = xml_text(b, "resultCode")
            if code != "00":
                print("축평원 오류", day, kind, code, file=sys.stderr)
                continue
            for it in xml_items(b, "item"):
                rows.append({**it, "_day": day})
    return rows


# ── 참가격 ────────────────────────────────────────────────

SAMPLES = os.path.join(HERE, "chamgagyeok")


def cham_xml_items(b, tag):
    return xml_items(b, tag)


def cham_master():
    products = cham_xml_items(open(os.path.join(SAMPLES, "product-all.xml"), "rb").read(), "item")
    al = {r["code"]: r for r in cham_xml_items(open(os.path.join(SAMPLES, "standard-AL.xml"), "rb").read(), "stdInfoVO")}
    ut = {r["code"]: r["codeName"] for r in cham_xml_items(open(os.path.join(SAMPLES, "standard-UT.xml"), "rb").read(), "stdInfoVO")}
    ar = {r["code"]: r for r in cham_xml_items(open(os.path.join(SAMPLES, "standard-AR.xml"), "rb").read(), "stdInfoVO")}
    stores = cham_xml_items(open(os.path.join(SAMPLES, "store-all.xml"), "rb").read(), "entpInfoVO")
    return products, al, ut, ar, stores


CHAM_DAY = "20261009"
# 업태·지역이 고루 섞이도록 고른 판매점 표본 (build 에서 판매점 목록으로 자동 선택)
CHAM_TREND_DAYS = ["20260612", "20260724", "20260828", "20260925", "20261009"]


# 업태·체인·지역이 섞이도록 고른 판매점 표본 19곳 (판매점 630곳의 체인: 이마트 150, 농협 13, GS더프레시 168,
# 롯데슈퍼 273, 현대백화점 15, 신세계백화점 7, 편의점 본사 4). 9/25에 0건이던 신세계 광주점·롯데슈퍼 포항점은 뺐다.
CHAM_STORES = [
    "156", "15", "117", "103", "83",            # LM 이마트 영등포·해운대·춘천, 농협 양재·부산
    "37", "89", "409", "75", "16", "126",       # SM GS더프레시 목동7·울산구영·청주용담, 롯데슈퍼 잠원·부산연산·수성
    "100", "20", "78", "682",                   # DP 현대 미아·부산, 신세계 강남·센텀시티
    "62", "115", "150", "2160",                 # CS 편의점 본사 4곳
]
# 정육 상품: 업태별 추이 확인용 (돼지고기 삼겹살, 목살, 쇠고기 등심 1등급)
CHAM_MEAT = {"246": CHAM_TREND_DAYS, "1120": [CHAM_DAY], "50": [CHAM_DAY],
             # 표본 19곳에서 0건이던 신선식품: 전 판매점으로 다시 확인 (쇠고기 등심 1+, 갈치 생물, 흰다리새우)
             "248": [CHAM_DAY], "921": [CHAM_DAY], "1790": [CHAM_DAY]}


def cham_prices(entp=None, good=None, day=CHAM_DAY):
    p = {"goodInspectDay": day}
    if entp:
        p["entpId"] = entp
        name = f"cham-{day}-entp-{entp}.xml"
    else:
        p["goodId"] = good
        name = f"cham-{day}-good-{good}.xml"
    b = get("cham", f"{CHAM_URL}/getProductPriceInfoSvc", p, name)
    return cham_xml_items(b, "goodPriceVO")


# ── 실행 ────────────────────────────────────────────────

def main():
    step = sys.argv[1] if len(sys.argv) > 1 else "build"
    ct = code_table()
    if step == "kamis-day":
        print(len(kamis_day_rows()), "rows")
    elif step == "kamis-item":
        rows, totals = kamis_item_rows(ct)
        print(len(rows), "rows", sum(1 for v in totals.values() if v), "/", len(totals), "items have data")
    elif step == "kamis-eco":
        for k, (t, _) in kamis_eco().items():
            print(k, t)
    elif step == "kamis-history":
        ses = tuple(sys.argv[2].split(",")) if len(sys.argv) > 2 else ("01", "02")
        shard = tuple(int(x) for x in sys.argv[3].split("/")) if len(sys.argv) > 3 else None
        h = kamis_history(ct, ses, shard)
        print(len(h), "histories")
    elif step == "kamis-hist-probe":
        kamis_hist_probe(ct)
    elif step == "kamis-2y":
        for k, v in kamis_absent_2y(ct).items():
            print(k, v)
    elif step == "kamis-snap":
        print(len(kamis_snap()), "rows")
    elif step == "ekape":
        print(len(ekape_rows()), "rows")
    elif step == "cham":
        products, al, ut, ar, stores = cham_master()
        cham_prices(entp="100", day="20261016")  # 10/16이 조사일인지 확인
        for e in CHAM_STORES:
            cham_prices(entp=e)
        for g, days in CHAM_MEAT.items():
            for day in days:
                cham_prices(good=g, day=day)
        print("ok")
    elif step == "cham-good":
        for day in sys.argv[3].split(","):
            cham_prices(good=sys.argv[2], day=day)
        print("ok")
    elif step == "build":
        import importlib.util
        spec = importlib.util.spec_from_file_location("build_inv", os.path.join(HERE, "build-inventory.py"))
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        m.build(sys.modules[__name__])
    print("calls:", dict(calls_used()))


if __name__ == "__main__":
    main()
