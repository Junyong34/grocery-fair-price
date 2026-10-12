#!/usr/bin/env bash
# 공공 가격 API 3종의 실호출 응답을 samples/ 아래에 저장한다.
#
# 사용법:  DATA_GO_KR_SERVICE_KEY=... ./fetch-samples.sh
#          (환경변수가 없으면 저장소 루트의 .env를 읽는다)
#
# - 인증키는 환경변수로만 읽고, 저장 파일과 manifest.tsv에는 남기지 않는다.
# - 호출 수: KAMIS 8, 축평원 약 10, 참가격 약 20 (개발계정 한도의 1% 안쪽)
# - 같은 파일을 덮어쓴다. 응답 내용은 호출한 날에 따라 달라진다.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../../.." && pwd)"

if [[ -z "${DATA_GO_KR_SERVICE_KEY:-}" && -f "$ROOT/.env" ]]; then
  set -a; . "$ROOT/.env"; set +a
fi
: "${DATA_GO_KR_SERVICE_KEY:?DATA_GO_KR_SERVICE_KEY 가 없다}"
KEY="$DATA_GO_KR_SERVICE_KEY"

# 날짜 계산 (macOS / GNU 겸용): days_ago N -> YYYYMMDD
days_ago() {
  date -v-"$1"d +%Y%m%d 2>/dev/null || date -d "$1 days ago" +%Y%m%d
}
# 요일(1=월 … 5=금) of YYYYMMDD
weekday() {
  date -j -f %Y%m%d "$1" +%u 2>/dev/null || date -d "$1" +%u
}

KAMIS_URL="https://apis.data.go.kr/B552845/perDay/price"
EKAPE_URL="http://data.ekape.or.kr/openapi-data/service/user/grade/consumerPriceDaily"
CHAM_URL="https://apis.data.go.kr/B551919/ProductPriceInfoService"

MANIFEST="$HERE/manifest.tsv"
printf 'file\thttp\tbytes\tfetched_at\trequest\n' > "$MANIFEST"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# fetch <상대경로> <url> [curl --data-urlencode 인자...]
# 키는 호출 시에만 붙이고, manifest 에는 REDACTED 로 적는다.
fetch() {
  local out="$1" url="$2"; shift 2
  mkdir -p "$(dirname "$HERE/$out")"
  local tmp; tmp="$(mktemp)"
  local args=() shown=() a
  for a in "$@"; do
    args+=(--data-urlencode "$a")
    shown+=("${a//$KEY/<REDACTED>}")
  done
  local code
  code="$(curl -sS -G "$url" "${args[@]}" -o "$tmp" -w '%{http_code}')"
  mv "$tmp" "$HERE/$out"
  local bytes; bytes="$(wc -c < "$HERE/$out" | tr -d ' ')"
  local q; q="$(IFS='&'; echo "${shown[*]}")"
  printf '%s\t%s\t%s\t%s\t%s?%s\n' "$out" "$code" "$bytes" "$NOW" "$url" "$q" >> "$MANIFEST"
  echo "  $out  HTTP $code  ${bytes}B"
}

# ── KAMIS (JSON) ───────────────────────────────────────────────
echo "== KAMIS"
FROM="$(days_ago 14)"; TO="$(days_ago 0)"
kamis() { # <파일> <부류> <품목> <구분> [건수]
  fetch "kamis/$1" "$KAMIS_URL" \
    "serviceKey=$KEY" "returnType=JSON" "pageNo=1" "numOfRows=${5:-5}" \
    "cond[exmn_ymd::GTE]=$FROM" "cond[exmn_ymd::LTE]=$TO" \
    "cond[ctgry_cd::EQ]=$2" "cond[item_cd::EQ]=$3" "cond[se_cd::EQ]=$4"
}
kamis vegetable-baechu-retail.json     200 211 01
kamis vegetable-baechu-wholesale.json  200 211 02
kamis vegetable-aehobak-retail.json    200 224 01
kamis fruit-sagwa-retail.json          400 411 01
kamis fish-godeungeo-retail.json       600 611 01
# 시각화용: 배추 소매 14일치 전체 (페이지당 최대 1000건)
kamis vegetable-baechu-retail-14d.json 200 211 01 1000
# 결과 없음 (미래 날짜): totalCount 0 일 때의 모양
fetch kamis/empty-future-dates.json "$KAMIS_URL" \
  "serviceKey=$KEY" "returnType=JSON" "pageNo=1" "numOfRows=5" \
  "cond[exmn_ymd::GTE]=20990101" "cond[exmn_ymd::LTE]=20990102" \
  "cond[ctgry_cd::EQ]=200" "cond[item_cd::EQ]=211"
# 품목코드 누락: 오류가 아니라 resultCode "0" + 0건으로 온다 (조용히 비는 경우)
fetch kamis/empty-missing-item.json "$KAMIS_URL" \
  "serviceKey=$KEY" "returnType=JSON" "pageNo=1" "numOfRows=5" \
  "cond[exmn_ymd::GTE]=$FROM" "cond[exmn_ymd::LTE]=$TO" "cond[ctgry_cd::EQ]=200"
# 조사 시작일 누락: 1996년부터의 이력이 그대로 온다 (조용히 많아지는 경우)
fetch kamis/missing-date-from.json "$KAMIS_URL" \
  "serviceKey=$KEY" "returnType=JSON" "pageNo=1" "numOfRows=3" \
  "cond[exmn_ymd::LTE]=$TO" "cond[ctgry_cd::EQ]=200" "cond[item_cd::EQ]=211"
# 잘못된 인증키: 인증 오류의 모양 (HTTP 403, returnType=JSON이면 JSON). 실제 키는 쓰지 않는다
fetch kamis/error-invalid-key.json "$KAMIS_URL" \
  "serviceKey=INVALID_KEY_FOR_SAMPLE" "returnType=JSON" "pageNo=1" "numOfRows=1" \
  "cond[exmn_ymd::GTE]=$FROM" "cond[exmn_ymd::LTE]=$TO" \
  "cond[ctgry_cd::EQ]=200" "cond[item_cd::EQ]=211"

# ── 축평원 (XML) ───────────────────────────────────────────────
echo "== 축평원"
# 데이터가 있는 가장 최근 날짜 찾기 (어제부터 최대 7일 전까지)
EK_DATE=""
for n in 1 2 3 4 5 6 7; do
  d="$(days_ago "$n")"
  body="$(curl -sS -G "$EKAPE_URL" --data-urlencode "serviceKey=$KEY" \
    --data-urlencode "standYmd=$d" --data-urlencode "judgeKind=4304" --data-urlencode "itemCd=27")"
  if grep -q '<item>' <<<"$body"; then EK_DATE="$d"; break; fi
done
: "${EK_DATE:?축평원에서 최근 7일 안에 데이터가 있는 날을 못 찾았다}"
echo "  기준일 $EK_DATE"
ekape() { # <파일> <축종> [품목코드]
  local extra=(); [[ -n "${3:-}" ]] && extra=("itemCd=$3")
  fetch "ekape/$1" "$EKAPE_URL" "serviceKey=$KEY" "standYmd=$EK_DATE" "judgeKind=$2" "${extra[@]}"
}
ekape pork-samgyeopsal.xml        4304 27
ekape pork-all-items.xml          4304          # itemCd 생략: 해당 축종 전 품목
ekape beef-all-items.xml          4301          # 등급이 여러 개 오는 축종
ekape beef-deungsim.xml           4301 22
ekape beef-import-all-items.xml   4401
ekape pork-import-samgyeopsal.xml 4402 27
ekape chicken-all-items.xml       9901
ekape egg-all-items.xml           9903
ekape milk-all-items.xml          9908
# 기준일 형식 오류
fetch ekape/error-bad-date.xml "$EKAPE_URL" \
  "serviceKey=$KEY" "standYmd=INVALID" "judgeKind=4304" "itemCd=27"

# ── 참가격 (XML) ───────────────────────────────────────────────
echo "== 참가격"
# 업체 100에 데이터가 있는 가장 최근 금요일 찾기 (최대 10주)
CH_DATE=""
for n in $(seq 0 70); do
  d="$(days_ago "$n")"
  [[ "$(weekday "$d")" == "5" ]] || continue
  body="$(curl -sS -G "$CHAM_URL/getProductPriceInfoSvc" --data-urlencode "serviceKey=$KEY" \
    --data-urlencode "goodInspectDay=$d" --data-urlencode "entpId=100")"
  if grep -q 'goodPriceVO' <<<"$body"; then CH_DATE="$d"; break; fi
done
: "${CH_DATE:?참가격에서 최근 10주 안에 데이터가 있는 금요일을 못 찾았다}"
echo "  조사일 $CH_DATE"
# 조사일이 아닌 날(조사일 +1일, 토요일)
NONSURVEY="$(date -j -v+1d -f %Y%m%d "$CH_DATE" +%Y%m%d 2>/dev/null || date -d "$CH_DATE +1 day" +%Y%m%d)"

fetch chamgagyeok/price-by-entp-100.xml "$CHAM_URL/getProductPriceInfoSvc" \
  "serviceKey=$KEY" "goodInspectDay=$CH_DATE" "entpId=100"
fetch chamgagyeok/price-by-good-1000.xml "$CHAM_URL/getProductPriceInfoSvc" \
  "serviceKey=$KEY" "goodInspectDay=$CH_DATE" "goodId=1000"
fetch chamgagyeok/price-non-survey-day.xml "$CHAM_URL/getProductPriceInfoSvc" \
  "serviceKey=$KEY" "goodInspectDay=$NONSURVEY" "entpId=100"
fetch chamgagyeok/error-no-entp-no-good.xml "$CHAM_URL/getProductPriceInfoSvc" \
  "serviceKey=$KEY" "goodInspectDay=$CH_DATE"
fetch chamgagyeok/error-bad-date.xml "$CHAM_URL/getProductPriceInfoSvc" \
  "serviceKey=$KEY" "goodInspectDay=INVALID" "entpId=100"
fetch chamgagyeok/store-100.xml "$CHAM_URL/getStoreInfoSvc.do" \
  "ServiceKey=$KEY" "entpId=100"
fetch chamgagyeok/store-all.xml "$CHAM_URL/getStoreInfoSvc.do" \
  "ServiceKey=$KEY"
fetch chamgagyeok/product-1000.xml "$CHAM_URL/getProductInfoSvc.do" \
  "ServiceKey=$KEY" "goodId=1000"
fetch chamgagyeok/product-all.xml "$CHAM_URL/getProductInfoSvc.do" \
  "ServiceKey=$KEY"
for c in AL UT AR BU; do
  fetch "chamgagyeok/standard-$c.xml" "$CHAM_URL/getStandardInfoSvc.do" \
    "ServiceKey=$KEY" "classCode=$c"
done
fetch chamgagyeok/error-bad-classcode.xml "$CHAM_URL/getStandardInfoSvc.do" \
  "ServiceKey=$KEY" "classCode=ZZ"

# ── 발췌본 ─────────────────────────────────────────────────────
# 50KB 넘는 XML은 반복 항목을 앞 5개만 남긴 *.excerpt.xml 을 같이 만든다 (사람이 읽기 위한 용도).
echo "== 발췌본"
for f in "$HERE"/chamgagyeok/*.xml; do
  [[ "$f" == *.excerpt.xml ]] && continue
  [[ "$(wc -c < "$f")" -gt 50000 ]] || continue
  python3 -I - "$f" <<'PY'
import sys, xml.etree.ElementTree as ET
src = sys.argv[1]
tree = ET.parse(src)
for parent in tree.getroot().iter():
    kids = list(parent)
    if len(kids) > 5 and len({k.tag for k in kids}) == 1:
        for k in kids[5:]:
            parent.remove(k)
        parent.append(ET.Comment(f" {len(kids) - 5}건 생략 (전체 {len(kids)}건) "))
out = src[:-4] + ".excerpt.xml"
ET.indent(tree)
tree.write(out, encoding="utf-8", xml_declaration=True)
print("  " + out.split("/")[-1])
PY
done

echo "완료. manifest: $MANIFEST"
