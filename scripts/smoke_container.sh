#!/usr/bin/env bash
# Smoke test: verifies the single container serves both web (CSS) and API correctly.
set -e
BASE="${1:-http://localhost:8000}"
CONTAINER="${2:-docker-api-1}"
PASS=0; FAIL=0

ok()   { echo "  ✓ $*"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $*"; FAIL=$((FAIL+1)); }

echo "=== 1. Root route must return HTML (not uvicorn JSON) ==="
BODY=$(curl -sf "$BASE/")
echo "$BODY" | grep -q '<!DOCTYPE html>' && ok "DOCTYPE present" || fail "DOCTYPE missing – uvicorn JSON is serving port 8000"

echo "=== 2. CSS URL extracted from HTML must return 200 ==="
CSS_PATH=$(echo "$BODY" | grep -o '"/_next/static/[^"]*\.css"' | head -1 | tr -d '"')
if [ -z "$CSS_PATH" ]; then
  fail "No /_next/static/*.css link found in HTML – static files may not be built"
else
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$CSS_PATH")
  [ "$STATUS" = "200" ] && ok "CSS $CSS_PATH → $STATUS" || fail "CSS $CSS_PATH → $STATUS (static file serving broken)"
fi

echo "=== 3. API health via Next.js rewrite ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/health")
[ "$STATUS" = "200" ] && ok "/v1/health via rewrite → 200" || fail "/v1/health via rewrite → $STATUS"

echo "=== 4. uvicorn reachable on internal port 9000 ==="
STATUS=$(docker exec "$CONTAINER" curl -sf -o /dev/null -w "%{http_code}" http://127.0.0.1:9000/v1/health 2>/dev/null || echo "000")
[ "$STATUS" = "200" ] && ok "uvicorn 127.0.0.1:9000 → 200" || fail "uvicorn 127.0.0.1:9000 → $STATUS (Next.js rewrite will fail)"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]