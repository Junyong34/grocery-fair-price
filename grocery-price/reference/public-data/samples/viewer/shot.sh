#!/usr/bin/env bash
# 뷰어 화면을 이미지로 저장하고 파일 경로를 출력한다 (눈으로 모양을 확인할 때 쓴다).
#
#   ./shot.sh <샘플id> [시작y] [높이]
#   ./shot.sh chamgagyeok/product-all            페이지 전체 (세로 4200px)
#   ./shot.sh ekape/beef-deungsim 1250 1400      세로 1250px 지점부터 1400px만 잘라서
#
# 환경변수: OUT=저장할 파일 경로, WIDTH=1100, HEIGHT=4200, QUERY="&pq=라면" (해시에 덧붙임)
# 레이아웃·색은 smoke.sh 가 보지 못하므로 화면을 바꾸면 이 이미지를 직접 본다.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
ID="${1:?샘플 id 가 필요하다. 예: chamgagyeok/product-all}"
Y="${2:-}"; H="${3:-1400}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="${OUT:-$(mktemp -d)/shot.png}"
FULL="$OUT"; [[ -n "$Y" ]] && FULL="${OUT%.png}.full.png"

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size="${WIDTH:-1100},${HEIGHT:-4200}" --virtual-time-budget=5000 \
  --screenshot="$FULL" "file://$PWD/api-explorer.html#s=$ID${QUERY:-}" >/dev/null 2>&1
[[ -s "$FULL" ]] || { echo "스크린샷을 만들지 못했다" >&2; exit 1; }

if [[ -n "$Y" ]]; then
  sips --cropOffset "$Y" 0 --cropToHeightWidth "$H" "${WIDTH:-1100}" "$FULL" --out "$OUT" >/dev/null
  rm -f "$FULL"
fi
echo "$OUT"
