#!/usr/bin/env bash
# 큰 숫자 · 영문 제목 서체(Bricolage Grotesque)를 이 사이트가 쓰는 글자만 남겨 줄인다(.scratch/seasonal-render-perf/issues/12).
# 원본 BricolageGrotesque-full.woff2(212KB) → BricolageGrotesque.woff2. 한글은 이 서체에 없어 Pretendard로 넘어간다.
# - 글자: 기본 라틴 · Latin-1 · 문장부호 · 화살표 · ₩ · €. 숫자의 tabular-nums 등 OpenType 기능은 모두 남긴다.
# - 축: 폭(wdth)은 아무 데서도 바꾸지 않아 100%로 고정한다. 굵기(wght) · 광학 크기(opsz)는 남긴다.
# 필요한 것: pip install fonttools brotli (가상환경 권장). 사용: PYTHON=/path/to/venv/bin/python scripts/subset-display-font.sh
set -euo pipefail
cd "$(dirname "$0")/../apps/web/shared/fonts"
PY="${PYTHON:-python3}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

"$PY" -m fontTools.subset BricolageGrotesque-full.woff2 \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+20A9,U+20AC,U+2190-2193,U+2212" \
  --layout-features='*' --output-file="$TMP/subset.ttf"
"$PY" -m fontTools.varLib.instancer "$TMP/subset.ttf" wdth=100 -o "$TMP/pinned.ttf" 2>/dev/null
"$PY" - "$TMP/pinned.ttf" BricolageGrotesque.woff2 <<'PY'
import sys
from fontTools.ttLib import TTFont
font = TTFont(sys.argv[1])
font.flavor = "woff2"
font.save(sys.argv[2])
PY
ls -l BricolageGrotesque-full.woff2 BricolageGrotesque.woff2
