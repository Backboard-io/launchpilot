#!/usr/bin/env bash
# Smoke test: Litestream restore from LocalStack S3.
# 1. Bring up LocalStack + API, create a project, let it replicate to S3.
# 2. Stop API and remove its DB volume (simulate new instance with empty disk).
# 3. Start API again; it should restore from S3 and serve the project.
#
# Run from repo root: ./scripts/smoke_litestream_restore.sh
# Requires: docker compose, curl, jq (or grep/sed for JSON).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/infra/docker/docker-compose.yml}"
BASE="${BASE_URL:-http://localhost:8000}"
# Volume name: compose project "docker" (from infra/docker) + volume "sqlite_data"
VOLUME_NAME="${VOLUME_NAME:-docker_sqlite_data}"

PASS=0; FAIL=0
ok()   { echo "  ✓ $*"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $*"; FAIL=$((FAIL+1)); }

# Parse JSON without Python: prefer jq, else grep/sed
get_project_id() {
  local json="$1"
  if command -v jq >/dev/null 2>&1; then
    echo "$json" | jq -r '.data.project_id // empty'
  else
    echo "$json" | grep -o '"project_id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/'
  fi
}

# List API returns items with "id", not "project_id"
has_project_id_in_list() {
  local list_json="$1" id="$2"
  if command -v jq >/dev/null 2>&1; then
    echo "$list_json" | jq -e --arg id "$id" '.data[] | select(.id == $id)' >/dev/null 2>&1
  else
    echo "$list_json" | grep -q "\"id\"[[:space:]]*:[[:space:]]*\"$id\""
  fi
}

cd "$REPO_ROOT"
echo "=== Litestream restore smoke test (LocalStack) ==="
echo "Compose: $COMPOSE_FILE"
echo "Base URL: $BASE"
echo ""

# ── 1. Ensure stack is up ─────────────────────────────────────────────────────
echo "=== 1. Bring up LocalStack + bucket-init + API ==="
docker compose -f "$COMPOSE_FILE" up -d localstack bucket-init api 2>/dev/null || true
# Wait for API health
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf -o /dev/null "$BASE/v1/health" 2>/dev/null; then
    ok "API healthy"
    break
  fi
  if [ "$i" -eq 10 ]; then
    fail "API did not become healthy"
    echo "Run: docker compose -f $COMPOSE_FILE up -d"
    exit 1
  fi
  sleep 2
done

# ── 2. Create a project (so it’s in DB and will replicate to S3) ─────────────
echo ""
echo "=== 2. Create project via API ==="
CREATE_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"litestream-smoke","goal":"Verify restore","summary":"Smoke test for Litestream restore"}')
HTTP_CODE=$(echo "$CREATE_RESP" | tail -1)
BODY=$(echo "$CREATE_RESP" | sed '$d')
if [ "$HTTP_CODE" != "200" ]; then
  fail "POST /v1/projects → $HTTP_CODE"
  echo "$BODY"
  exit 1
fi
ok "POST /v1/projects → 200"

PROJECT_ID=$(get_project_id "$BODY")
if [ -z "$PROJECT_ID" ]; then
  fail "Could not parse project_id from response"
  echo "$BODY"
  exit 1
fi
ok "project_id: $PROJECT_ID"

# ── 3. Allow time for Litestream to replicate to S3 ───────────────────────
echo ""
echo "=== 3. Wait for Litestream to replicate to S3 (10s) ==="
sleep 10
ok "Replication wait done"

# ── 4. Stop API and remove DB volume (simulate new instance, empty disk) ─────
echo ""
echo "=== 4. Stop API and remove DB volume ==="
docker compose -f "$COMPOSE_FILE" stop api 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" rm -f api 2>/dev/null || true
if docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
  docker volume rm "$VOLUME_NAME" || { fail "Could not remove volume $VOLUME_NAME"; exit 1; }
  ok "Removed volume $VOLUME_NAME"
else
  ok "Volume $VOLUME_NAME not present (already removed or different name)"
fi

# ── 5. Start API again (should restore from S3, then serve) ──────────────────
echo ""
echo "=== 5. Start API again (restore from S3) ==="
docker compose -f "$COMPOSE_FILE" up -d api
# Wait for startup + restore
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -sf -o /dev/null "$BASE/v1/health" 2>/dev/null; then
    ok "API healthy after restart"
    break
  fi
  if [ "$i" -eq 15 ]; then
    fail "API did not become healthy after restart"
    echo "Check logs: docker compose -f $COMPOSE_FILE logs api"
    exit 1
  fi
  sleep 2
done

# ── 6. Verify project is present (restored from S3) ───────────────────────────
echo ""
echo "=== 6. Verify project list contains restored project ==="
LIST_RESP=$(curl -s -w "\n%{http_code}" "$BASE/v1/projects")
HTTP_CODE=$(echo "$LIST_RESP" | tail -1)
LIST_BODY=$(echo "$LIST_RESP" | sed '$d')
if [ "$HTTP_CODE" != "200" ]; then
  fail "GET /v1/projects → $HTTP_CODE"
  echo "$LIST_BODY"
  exit 1
fi
ok "GET /v1/projects → 200"

if has_project_id_in_list "$LIST_BODY" "$PROJECT_ID"; then
  ok "Restored DB contains project_id $PROJECT_ID"
else
  fail "Restored DB missing project_id $PROJECT_ID (restore may have failed)"
  echo "Response (first 500 chars): ${LIST_BODY:0:500}"
  docker logs docker-api-1
  exit 1
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
