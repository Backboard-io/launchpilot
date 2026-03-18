#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

cleanup() {
  echo "Shutting down..."
  docker compose -f infra/docker/docker-compose.yml down 2>/dev/null || true
  exit 0
}
trap cleanup EXIT SIGINT SIGTERM

# ---- Clear only local runtime/build state (never .env or persisted data) ----
echo "Clearing build/cache state..."
rm -rf apps/web/.next
rm -f apps/web/tsconfig.tsbuildinfo
find apps/api -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find apps/api -type f -name '*.py[cod]' -delete 2>/dev/null || true
rm -rf apps/api/.pytest_cache
rm -rf apps/api/*.egg-info 2>/dev/null || true

if [[ -n "${CLEAN:-}" ]]; then
  echo "Clean reinstall (CLEAN=1)..."
  rm -rf node_modules apps/web/node_modules
  npm run install:web
fi

if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example to .env and set values (e.g. BACKBOARD_API_KEY, AUTH_MODE=dev)."
  exit 1
fi

echo "Starting API + web (single container, Docker)..."
docker compose -f infra/docker/docker-compose.yml up --build -d

echo "Waiting for app on :8000 (API at /v1, web at /)..."
for i in {1..60}; do
  if curl -sf -o /dev/null http://localhost:8000/v1/health 2>/dev/null || curl -sf -o /dev/null http://localhost:8000/ 2>/dev/null; then
    break
  fi
  [[ $i -eq 60 ]] && echo "App did not become ready in time." && exit 1
  sleep 1
done
echo "App is up: http://localhost:8000"
docker compose -f infra/docker/docker-compose.yml logs -f api
