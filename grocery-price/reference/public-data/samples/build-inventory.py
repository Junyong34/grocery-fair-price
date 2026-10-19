"""fetch-inventory.py 가 /tmp 에 받은 원본으로 samples/inventory/*.csv 를 만든다.

직접 실행하지 않고 `fetch-inventory.py build` 로 부른다 (호출 없음).
"""
import csv
import glob
import json
import os
import re
from collections import Counter, defaultdict

CTGRY_NM = {"100": "식량작물", "200": "채소류", "300": "특용작물", "400": "과일류", "500": "축산물", "600": "수산물"}
SE_NM = {"01": "소매", "02": "중도매", "03": "친환경농산물", "07": "친환경농산물(신규)"}


def write(path, header, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(header)
        w.writerows(rows)
    print("  wrote", os.path.relpath(path), len(rows), "rows")


def load_kamis(raw, pattern):
    rows = []
    for f in sorted(glob.glob(os.path.join(raw, pattern))):
        d = json.load(open(f, encoding="utf-8"))
        items = (d["response"]["body"].get("items") or {}).get("item") or []
        if isinstance(items, dict):
            items = [items]
        rows += items
    return rows


def market_type(code, name, ses):
    """KAMIS 시장을 유형으로 나눈다. 이름 규칙 + 관측된 구분."""
    if code in (None, "", "None"):
        return "시장 없음(축산, 시군구 단위)"
    n = name or ""
    if re.search(r"온라인|옥션|몰", n):
        return "온라인"
    if re.search(r"-(백화점|대형마트|전문점|생협|SSM|직매장)$", n):
        return "익명 친환경 조사처(업태명)"
    if re.search(r"-(유통|마트)$", n):
        return "익명 대형유통"
    if re.search(r"도매|공동어|공판|어시장", n):
        return "도매시장"
    return "실명 시장"


def build_kamis(m, out):
    ct = m.code_table()
    raw = m.RAW
    day = load_kamis(raw, "kamis-day-*.json")
    item30 = load_kamis(raw, "kamis-item30-*.json")
    eco = load_kamis(raw, "kamis-eco30-*.json")
    snap = load_kamis(raw, "kamis-snap-*.json")
    for r in day:
        r["_src"] = "day"
    for r in item30:
        r["_src"] = "item30"
    for r in eco:
        r["_src"] = "eco30"
    allrows = day + item30 + eco

    item_nm = {i: n for _, i, n in ct["item"]}
    item_ct = {i: c for c, i, _ in ct["item"]}
    # 코드표에 없는데 응답에 나오는 품목은 응답의 이름을 쓴다
    extra_items = sorted({(r["ctgry_cd"], r["item_cd"], r.get("item_nm") or "") for r in allrows if r["item_cd"] not in item_nm})
    for c, i, n in extra_items:
        item_nm[i] = n
        item_ct[i] = c
    vrty_code = defaultdict(list)
    for c, i, v, n in ct["vrty"]:
        vrty_code[i].append((v, n))
    grd_code = defaultdict(set)
    for c, i, v, g, n in ct["grd"]:
        grd_code[i].add((v, g, n))
    mrkt_code = {r[1]: (r[0], r[2]) for r in ct["mrkt"]}
    sgg_nm = {r[0]: r[1] for r in ct["sgg"]}

    # 이력 시작일
    hist = {}
    for f in glob.glob(os.path.join(raw, "kamis-hist-*.json")):
        se, item = os.path.basename(f)[len("kamis-hist-"):-5].split("-")
        d = json.load(open(f, encoding="utf-8"))["response"]["body"]
        it = (d.get("items") or {}).get("item") or []
        it = it[0] if it else {}
        hist[(item, se)] = (it.get("exmn_ymd", ""), d.get("totalCount", 0), it.get("vrty_nm", ""), it.get("unit", ""), it.get("unit_sz", ""))
    # 504로 실패해 범위를 좁혀 다시 받은 품목: 1996-01-01 ~ 예상 연도 말. 0건이면 "예상 연도 이후"
    for f in glob.glob(os.path.join(raw, "kamis-histprobe-*.json")):
        se, item, year = os.path.basename(f)[len("kamis-histprobe-"):-5].split("-")
        if (item, se) in hist:
            continue
        d = json.load(open(f, encoding="utf-8"))["response"]["body"]
        it = (d.get("items") or {}).get("item") or []
        it = it[0] if it else {}
        hist[(item, se)] = (it.get("exmn_ymd") or f">{year}", f"({year}년까지 {d.get('totalCount', 0)})",
                            it.get("vrty_nm", ""), it.get("unit", ""), it.get("unit_sz", ""))
    snap_items = {(r["item_cd"]) for r in snap}

    # ── 시장 표 ──
    mk = defaultdict(lambda: {"se": Counter(), "items": set(), "sgg": None, "nm": None})
    for r in allrows:
        k = (str(r.get("sgg_cd")), str(r.get("mrkt_cd")))
        mk[k]["se"][r["se_cd"]] += 1
        mk[k]["items"].add(r["item_cd"])
        mk[k]["nm"] = r.get("mrkt_nm")
    mrows = []
    seen_codes = set()
    for (sgg, code), v in sorted(mk.items()):
        seen_codes.add(code)
        in_ct = "Y" if code in mrkt_code else ("-" if code == "None" else "N")
        mrows.append([sgg, sgg_nm.get(sgg, ""), "" if code == "None" else code, v["nm"] or "",
                      market_type(code, v["nm"], v["se"]), in_ct,
                      v["se"].get("01", 0), v["se"].get("02", 0), v["se"].get("07", 0), len(v["items"])])
    for code, (sgg, nm) in sorted(mrkt_code.items()):
        if code not in seen_codes:
            mrows.append([sgg, sgg_nm.get(sgg, ""), code, nm, market_type(code, nm, Counter()), "Y", 0, 0, 0, 0])
    write(os.path.join(out, "kamis-markets.csv"),
          ["sgg_cd", "sgg_nm", "mrkt_cd", "mrkt_nm", "유형", "코드표에_있음", "행수_01소매", "행수_02중도매", "행수_07친환경", "품목수"],
          mrows)

    # ── 품종·등급 조합 표 (관측 + 코드표) ──
    combo = defaultdict(lambda: {"rows": 0, "mk": set(), "sgg": set(), "units": Counter(), "mtypes": Counter(), "src": set(), "days": set()})
    for r in allrows:
        k = (r["item_cd"], r["se_cd"], r.get("vrty_cd") or "", r.get("grd_cd") or "")
        c = combo[k]
        c["rows"] += 1
        c["mk"].add(str(r.get("mrkt_cd")))
        c["sgg"].add(str(r.get("sgg_cd")))
        c["units"][f'{r.get("unit_sz", "")}{r.get("unit", "")}'] += 1
        c["mtypes"][market_type(r.get("mrkt_cd"), r.get("mrkt_nm"), None)] += 1
        c["src"].add(r["_src"])
        c["days"].add(r["exmn_ymd"])
        c["names"] = (r.get("vrty_nm") or "", r.get("grd_nm") or "")
    vrty_nm = {(i, v): n for c, i, v, n in ct["vrty"]}
    grd_nm = {(i, v, g): n for c, i, v, g, n in ct["grd"]}
    crow = []
    obs_keys = set()
    for (item, se, v, g), c in sorted(combo.items()):
        obs_keys.add((item, v, g))
        crow.append([item_ct.get(item, ""), item, item_nm.get(item, ""), se, SE_NM.get(se, ""), v, c["names"][0], g, c["names"][1],
                     "Y" if (item, v, g) in grd_nm else ("Y(품종만)" if (item, v) in vrty_nm else "N"),
                     "|".join(u for u, _ in c["units"].most_common()), c["rows"], len(c["mk"] - {"None"}), len(c["sgg"]),
                     "|".join(f"{t}:{n}" for t, n in c["mtypes"].most_common()), "|".join(sorted(c["src"])),
                     "실제 데이터 있음"])
    for c_, i, v, g, n in ct["grd"]:
        if (i, v, g) not in obs_keys:
            crow.append([c_, i, item_nm.get(i, ""), "", "", v, vrty_nm.get((i, v), ""), g, n, "Y", "", 0, 0, 0, "", "", "코드표에만 있음"])
    write(os.path.join(out, "kamis-varieties.csv"),
          ["ctgry_cd", "item_cd", "item_nm", "se_cd", "se_nm", "vrty_cd", "vrty_nm", "grd_cd", "grd_nm", "코드표에_있음",
           "단위(크기+단위)", "행수", "시장수", "시군구수", "시장유형별_행수", "근거", "상태"],
          crow)

    # ── 품목 표 ──
    by_item = defaultdict(lambda: defaultdict(lambda: {"rows": 0, "vrty": set(), "grd": set(), "units": Counter(), "mtypes": Counter(), "mk": set()}))
    for r in allrows:
        b = by_item[r["item_cd"]][r["se_cd"]]
        b["rows"] += 1
        b["vrty"].add(r.get("vrty_cd"))
        b["grd"].add((r.get("vrty_cd"), r.get("grd_cd")))
        b["units"][f'{r.get("unit_sz", "")}{r.get("unit", "")}'] += 1
        b["mtypes"][market_type(r.get("mrkt_cd"), r.get("mrkt_nm"), None)] += 1
        b["mk"].add(str(r.get("mrkt_cd")))
    irow = []
    for c_, i, n, in_ct in [(c, i, n, "Y") for c, i, n in ct["item"]] + [(c, i, n, "N") for c, i, n in extra_items]:
        se = by_item.get(i, {})
        s01, s02, s07 = se.get("01"), se.get("02"), se.get("07")
        status = "실제 데이터 있음(소매)" if s01 else ("실제 데이터 있음(소매 외)" if se else "코드표에만 있음")
        h01 = hist.get((i, "01"), ("", "", "", "", ""))
        h02 = hist.get((i, "02"), ("", "", "", "", ""))

        def mt(b, t):
            return b["mtypes"].get(t, 0) if b else 0
        irow.append([
            c_, CTGRY_NM.get(c_, ""), i, n, in_ct, len(vrty_code.get(i, [])), len(grd_code.get(i, set())), status,
            len(s01["vrty"]) if s01 else 0, len(s01["grd"]) if s01 else 0,
            "|".join(u for u, _ in s01["units"].most_common()) if s01 else "",
            len(s01["mk"] - {"None"}) if s01 else 0,
            "Y" if mt(s01, "실명 시장") else "N", "Y" if mt(s01, "익명 대형유통") else "N",
            "Y" if s02 else "N", "|".join(u for u, _ in s02["units"].most_common()) if s02 else "",
            "Y" if s07 else "N",
            h01[0], h01[1], h02[0], h02[1],
            ("Y" if i in snap_items else "N") if snap else "",
        ])
    write(os.path.join(out, "kamis-items.csv"),
          ["ctgry_cd", "ctgry_nm", "item_cd", "item_nm", "코드표에_있음", "코드표_품종수", "코드표_품종등급수", "상태",
           "소매_품종수", "소매_품종등급수", "소매_단위", "소매_시장수", "소매_실명시장", "소매_익명대형유통",
           "중도매_있음", "중도매_단위", "친환경07_있음",
           "소매_이력시작일", "소매_이력행수", "중도매_이력시작일", "중도매_이력행수", "소매_2021-10-15_있음"],
          irow)
    return irow


def build_ekape(m, out):
    rows = []
    for f in sorted(glob.glob(os.path.join(m.RAW, "ekape-*.xml"))):
        day, kind = os.path.basename(f)[6:-4].split("-")
        b = open(f, "rb").read()
        for it in m.xml_items(b, "item"):
            rows.append({**it, "_day": day, "_kind": kind})
    kind_nm = {"4301": "소", "4304": "돼지", "4401": "수입 소고기", "4402": "수입 돼지고기", "9901": "닭", "9903": "계란", "9908": "우유"}
    combo = defaultdict(lambda: {"days": set(), "avg": set(), "unit": "", "nm": ""})
    for r in rows:
        k = (r["_kind"], r.get("itemCd", ""), r.get("grdNm", ""))
        c = combo[k]
        c["nm"] = r.get("itemNm", "")
        c["unit"] = r.get("unit", "")
        if r.get("standYmd") == "평년":
            c["avg"].add(r["_day"])
        else:
            c["days"].add(r["_day"])
    days = sorted({r["_day"] for r in rows})
    out_rows = []
    for (kind, item, grd), c in sorted(combo.items()):
        regions = ""
        out_rows.append([kind, kind_nm.get(kind, ""), item, c["nm"], grd, c["unit"]] +
                        ["Y" if d in c["days"] else "" for d in days] + ["Y" if c["avg"] else "N"])
    write(os.path.join(out, "ekape-items.csv"),
          ["judgeKind", "축종", "itemCd", "itemNm", "grdNm(등급·원산지)", "unit"] + [f"기준일_{d}" for d in days] + ["평년행_있음"],
          out_rows)
    return out_rows


def build_cham(m, out):
    products, al, ut, ar, stores = m.cham_master()
    st = {s["entpId"]: s for s in stores}
    # 표본 판매점 가격 (조사일 m.CHAM_DAY)
    seen = defaultdict(set)  # goodId -> 업태 set
    nstore = Counter()
    store_counts = []
    for e in m.CHAM_STORES:
        f = os.path.join(m.RAW, f"cham-{m.CHAM_DAY}-entp-{e}.xml")
        items = m.xml_items(open(f, "rb").read(), "goodPriceVO") if os.path.exists(f) else []
        t = st.get(e, {}).get("entpTypeCode", "")
        store_counts.append((e, st.get(e, {}).get("entpName", ""), t, len(items)))
        for it in items:
            seen[it["goodId"]].add(t)
            nstore[it["goodId"]] += 1
    # 정육 상품별 전 판매점 가격
    meat = {}
    for g, days in m.CHAM_MEAT.items():
        for d in days:
            f = os.path.join(m.RAW, f"cham-{d}-good-{g}.xml")
            if os.path.exists(f):
                meat[(g, d)] = m.xml_items(open(f, "rb").read(), "goodPriceVO")
    good_all_stores = {g: {it["entpId"] for it in meat.get((g, m.CHAM_DAY), [])} for g in m.CHAM_MEAT}

    def cls(code):
        lo = al.get(code, {})
        mid = al.get(lo.get("highCode", ""), {})
        top = al.get(mid.get("highCode", ""), {})
        return top, mid, lo
    prow = []
    for p in sorted(products, key=lambda p: (p.get("goodSmlclsCode", ""), int(p["goodId"]))):
        top, mid, lo = cls(p.get("goodSmlclsCode", ""))
        food = "식품" if top.get("code", "").startswith(("0301", "0302")) else "생활용품(제외)"
        prow.append([p["goodId"], p.get("goodName", ""), top.get("code", ""), top.get("codeName", ""), mid.get("code", ""), mid.get("codeName", ""),
                     lo.get("code", ""), lo.get("codeName", ""), p.get("goodTotalCnt", ""), ut.get(p.get("goodTotalDivCode", ""), p.get("goodTotalDivCode", "")),
                     p.get("goodBaseCnt", ""), ut.get(p.get("goodUnitDivCode", ""), p.get("goodUnitDivCode", "")), p.get("detailMean", ""),
                     p.get("productEntpCode", ""), food, nstore.get(p["goodId"], 0), "|".join(sorted(seen.get(p["goodId"], set())))])
    write(os.path.join(out, "cham-products.csv"),
          ["goodId", "goodName", "대분류_code", "대분류", "중분류_code", "중분류", "소분류_code", "소분류", "용량", "용량단위",
           "단위량", "단위", "detailMean", "productEntpCode", "식품여부", f"표본19곳_가격있는_판매점수({m.CHAM_DAY})", "표본_가격있는_업태"],
          prow)
    write(os.path.join(out, "cham-sample-stores.csv"), ["entpId", "entpName", "entpTypeCode", f"상품수({m.CHAM_DAY})"], store_counts)

    # 판매점 분포 (업태 × 시도)
    dist = Counter()
    for s in stores:
        sido = ar.get(s.get("entpAreaCode", ""), {}).get("codeName", s.get("entpAreaCode", ""))
        dist[(s.get("entpTypeCode", ""), sido)] += 1
    write(os.path.join(out, "cham-stores-by-type-area.csv"), ["entpTypeCode", "시도", "판매점수"],
          [[t, a, n] for (t, a), n in sorted(dist.items())])

    # 정육 상품 업태별 가격
    trow = []
    for (g, d), items in sorted(meat.items()):
        by = defaultdict(list)
        for it in items:
            s = st.get(it["entpId"], {})
            by[s.get("entpTypeCode", "?")].append((int(it["goodPrice"]), s.get("entpName", it["entpId"])))
        for t, v in sorted(by.items()):
            prices = [x for x, _ in v]
            trow.append([g, d, t, len(v), round(sum(prices) / len(prices)), min(prices), max(prices), "|".join(f"{n}:{x}" for x, n in sorted(v, key=lambda z: z[1]))])
    write(os.path.join(out, "cham-meat-by-type.csv"), ["goodId", "goodInspectDay", "entpTypeCode", "판매점수", "평균", "최저", "최고", "판매점별_가격"], trow)
    return prow, store_counts, dist, trow


def build(m):
    out = os.path.join(m.HERE, "inventory")
    print("build →", out)
    build_kamis(m, out)
    build_ekape(m, out)
    build_cham(m, out)
