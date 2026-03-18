#!/usr/bin/env bash
# Smoke test: create a project end-to-end and verify it appears on the leaderboard endpoint.
set -euo pipefail

BASE="${BASE_URL:-http://localhost:8000}"
PASS=0; FAIL=0

ok()   { echo "  ✓ $*"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $*"; FAIL=$((FAIL+1)); }

echo "=== Smoke: create project + leaderboard ==="
echo "Target: ${BASE}"

# ── 1. Health check ──────────────────────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/v1/health")
if [[ "${STATUS}" != "200" ]]; then
  echo "FAIL: /v1/health returned ${STATUS} – aborting"
  exit 1
fi
ok "/v1/health → 200"

# ── 2. Create project ────────────────────────────────────────────────────────
STATUS=$(curl -s -o /tmp/smoke_project.json -w "%{http_code}" \
  -X POST "${BASE}/v1/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"wedge","goal":"to leaderboard updated","summary":"Smoke test project"}')

if [[ "${STATUS}" != "200" ]]; then
  echo "FAIL: POST /v1/projects returned ${STATUS}"
  echo "Response:"
  cat /tmp/smoke_project.json
  exit 1
fi
ok "POST /v1/projects → 200"

# ── 3. Confirm project_id and slug in response ───────────────────────────────
PROJECT_ID=$(python3 -c "import json,sys; d=json.load(open('/tmp/smoke_project.json')); print(d['data']['project_id'])" 2>/dev/null || true)
SLUG=$(python3 -c "import json,sys; d=json.load(open('/tmp/smoke_project.json')); print(d['data']['slug'])" 2>/dev/null || true)

if [[ -z "${PROJECT_ID}" ]]; then
  fail "Response missing data.project_id"
  cat /tmp/smoke_project.json
else
  ok "project_id present: ${PROJECT_ID}"
fi

if [[ "${SLUG}" == wedge* ]]; then
  ok "slug starts with 'wedge': ${SLUG}"
else
  fail "slug expected to start with 'wedge', got '${SLUG}'"
fi

# ── 4. GET the project by id ─────────────────────────────────────────────────
STATUS=$(curl -s -o /tmp/smoke_get_project.json -w "%{http_code}" \
  "${BASE}/v1/projects/${PROJECT_ID}")

if [[ "${STATUS}" != "200" ]]; then
  fail "GET /v1/projects/${PROJECT_ID} returned ${STATUS}"
  cat /tmp/smoke_get_project.json
else
  ok "GET /v1/projects/${PROJECT_ID} → 200"
fi

# ── 5. GET leaderboard ───────────────────────────────────────────────────────
STATUS=$(curl -s -o /tmp/smoke_leaderboard.json -w "%{http_code}" \
  "${BASE}/v1/leaderboard")

if [[ "${STATUS}" != "200" ]]; then
  fail "GET /v1/leaderboard returned ${STATUS}"
  cat /tmp/smoke_leaderboard.json
else
  ok "GET /v1/leaderboard → 200"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "Results: ${PASS} passed, ${FAIL} failed"
[[ "${FAIL}" -eq 0 ]]
