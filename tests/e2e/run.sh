#!/usr/bin/env bash
# Run the full end-to-end suite against a running dev server.
# Exit code = number of failing test files (0 = all pass).
set -u
cd "$(dirname "$0")"

BASE_URL="${E2E_BASE_URL:-http://localhost:8080}"
export E2E_BASE_URL="$BASE_URL"

if ! curl -sSf -o /dev/null "$BASE_URL"; then
  echo "dev server not reachable at $BASE_URL" >&2
  exit 2
fi

fails=0
for f in test_*.py; do
  echo
  echo "▶ $f"
  echo "-------------------------------------------"
  if ! python3 "$f"; then
    fails=$((fails + 1))
  fi
done

echo
if [ "$fails" -eq 0 ]; then
  echo "✓ all e2e tests passed"
else
  echo "✗ $fails e2e test file(s) failed"
fi
exit "$fails"
