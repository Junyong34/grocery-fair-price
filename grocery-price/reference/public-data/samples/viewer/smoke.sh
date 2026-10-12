#!/usr/bin/env bash
# 뷰어 스모크 테스트: 빌드한 뒤 헤드리스 Chrome 으로 샘플마다 열어 렌더링을 검사한다.
#
#   ./smoke.sh            샘플 34개 전부 (1~2분)
#   ./smoke.sh --quick    API 기능마다 대표 샘플만 (약 15초)
#   HTML=/경로/x.html ./smoke.sh --quick    다른 HTML 을 검사 (이 스크립트 자체를 시험할 때)
#
# 검사 항목 (샘플마다)
#   1. 스크립트 오류 없음 (<html data-js-error> 가 없다)
#   2. 화면에 null / undefined / NaN / [object Object] 글자가 없다
#   3. 탭 줄마다 선택된 탭이 정확히 하나다
#   4. 카드가 5개 이상이고 마지막 카드(전체 행과 원문)가 있다
# 이 검사는 레이아웃·색은 보지 못한다. 모양은 shot.sh 로 눈으로 확인한다.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[[ -x "$CHROME" ]] || { echo "Chrome 을 찾을 수 없다: $CHROME (CHROME 환경변수로 지정)" >&2; exit 2; }

if [[ -z "${HTML:-}" ]]; then
  python3 -I build.py >/dev/null || { echo "✕ build.py 실패" >&2; exit 1; }
  HTML="$PWD/api-explorer.html"
fi

# 문법 검사
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
python3 -I - "$HTML" "$TMP/page.js" <<'PY' || exit 1
import re, sys
src = open(sys.argv[1], encoding="utf-8").read()
open(sys.argv[2], "w", encoding="utf-8").write(re.findall(r"<script>(.*?)</script>", src, re.S)[-1])
PY
if command -v node >/dev/null; then
  node --check "$TMP/page.js" || { echo "✕ JS 문법 오류" >&2; exit 1; }
fi

# 대상 샘플
if [[ "${1:-}" == "--quick" ]]; then
  IDS="kamis/vegetable-baechu-retail-14d kamis/empty-future-dates kamis/error-invalid-key
ekape/beef-deungsim ekape/error-bad-date
chamgagyeok/price-by-entp-100 chamgagyeok/price-non-survey-day chamgagyeok/store-all chamgagyeok/product-all chamgagyeok/standard-BU"
else
  IDS="$(cut -f1 ../manifest.tsv | tail -n +2 | sed -E 's/\.(json|xml)$//')"
fi

fail=0; n=0
while read -r id; do
  [[ -n "$id" ]] || continue
  n=$((n + 1))
  # 오류 샘플 등은 manifest 에 있어도 화면 드롭다운에 없을 수 있어 해시 선택이 무시될 수 있다.
  "$CHROME" --headless=new --disable-gpu --virtual-time-budget=5000 --dump-dom "file://$HTML#s=$id" >"$TMP/dom.html" 2>/dev/null
  out="$(python3 -I - "$TMP/dom.html" <<'PY'
import re, sys
d = open(sys.argv[1], encoding="utf-8").read()
probs = []
if not d.strip(): probs.append("DOM 이 비어 있다")
m = re.search(r'data-js-error="([^"]*)"', d)
if m: probs.append("스크립트 오류: " + m.group(1)[:120])
body = re.sub(r"<script>.*?</script>", "", d, flags=re.S)
text = re.sub(r"<[^>]+>", "\n", body)
for line in text.splitlines():
    if re.fullmatch(r"\s*(null|undefined|NaN|\[object Object\])\s*", line):
        probs.append(f'화면에 "{line.strip()}" 글자가 있다'); break
for w in ("undefined", "NaN", "[object Object]"):
    if re.search(r"(?<![A-Za-z가-힣])" + re.escape(w) + r"(?![A-Za-z가-힣])", text):
        probs.append(f'본문에 "{w}" 가 섞여 있다')
lists = re.findall(r'<div class="tabs[^"]*" role="tablist"[^>]*>(.*?)</div>', body, flags=re.S)
if not lists: probs.append("탭이 없다")
for i, tl in enumerate(lists):
    sel = len(re.findall(r'aria-selected="true"', tl))
    if sel != 1: probs.append(f"탭 줄 {i + 1}: 선택된 탭이 {sel}개")
cards = body.count('<section class="card"')
if cards < 5: probs.append(f"카드가 {cards}개뿐이다")
if "전체 행과 원문" not in body: probs.append("마지막 카드(전체 행과 원문)가 없다")
print("; ".join(probs))
PY
)"
  if [[ -n "$out" ]]; then echo "✕ $id — $out"; fail=$((fail + 1)); fi
done < <(tr ' \t' '\n\n' <<<"$IDS")

if [[ $fail -ne 0 ]]; then echo "스모크 테스트 실패: ${fail} / ${n}"; exit 1; fi
echo "스모크 테스트 통과: ${n}개 샘플"
