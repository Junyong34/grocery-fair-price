#!/usr/bin/env bash
# .env 에 있는 비밀 값이 커밋 대상 파일에 들어갔는지 검사한다.
#
#   scripts/check-no-secrets.sh          스테이징된 내용만 검사 (pre-commit 이 쓴다)
#   scripts/check-no-secrets.sh --tree   추적 파일과 무시되지 않은 새 파일 전체를 검사
#
# 값은 출력하지 않는다. 변수 이름과 파일 이름만 알린다.
# 값이 12자 미만이면 우연히 겹칠 수 있어 검사에서 뺀다 (true, 8080 등).
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
MODE="${1:-staged}"

if [[ ! -f .env ]]; then
  echo "check-no-secrets: .env 가 없어 검사할 값이 없다 (건너뜀)" >&2
  exit 0
fi

# .env 가 커밋 대상이면 그 자체로 실패
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "✕ .env 가 git 추적 대상이다. 'git rm --cached .env' 로 빼라." >&2
  exit 1
fi
if [[ "$MODE" == "staged" ]] && git diff --cached --name-only | grep -qx '.env'; then
  echo "✕ .env 가 스테이징되어 있다. 'git restore --staged .env' 로 빼라." >&2
  exit 1
fi

list_files() {
  if [[ "$MODE" == "--tree" ]]; then
    git ls-files -co --exclude-standard
  else
    git diff --cached --name-only --diff-filter=ACMR
  fi
}
read_file() { # 검사 대상 내용을 stdout 으로
  if [[ "$MODE" == "--tree" ]]; then cat -- "$1"; else git show ":$1"; fi
}

fail=0
while IFS='=' read -r name value; do
  [[ "$name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
  value="${value%\"}"; value="${value#\"}"; value="${value%\'}"; value="${value#\'}"
  [[ ${#value} -ge 12 ]] || continue
  while IFS= read -r f; do
    [[ -n "$f" && -f "$f" || "$MODE" != "--tree" ]] || continue
    # 바이너리는 -a 로 문자열 검색 (zip 등 압축 파일은 못 잡는다)
    if read_file "$f" 2>/dev/null | grep -aqF -- "$value"; then
      echo "✕ $name 의 값이 $f 에 들어 있다" >&2
      fail=1
    fi
  done < <(list_files)
done < .env

if [[ $fail -ne 0 ]]; then
  echo "커밋을 중단했다. 해당 파일에서 값을 지운 뒤 다시 시도하라. 이미 푸시했다면 키를 재발급해야 한다." >&2
  exit 1
fi
