# Growth Launchpad

Monorepo implementing the Growth Launchpad MVP from `design.md`.

## Structure

- `apps/web`: Next.js App Router frontend
- `apps/api`: FastAPI backend + worker + migrations
- `packages/shared-types`: shared TS types
- `infra`: local scripts and deployment helpers

## Quick start

1. Copy `.env.example` to `.env` and fill values.
2. Install frontend dependencies with pnpm.
3. Create a Python virtualenv for API and install `apps/api/pyproject.toml` deps.
4. Run database migrations with Alembic from `apps/api`.
5. Run API: `uvicorn app.main:app --reload --app-dir apps/api`
6. Run worker: `python -m app.worker.runner` from `apps/api`
7. Run web: `pnpm --filter web dev`

## Notes

- Auth0 is the only identity provider.
- Supabase is the canonical DB/storage/realtime layer.
- Backboard provides assistant/thread memory context.
- Resend handles supervised outbound email sends.

## API surface

- `GET /v1/me`
- `GET /v1/workspaces`
- `POST /v1/workspaces/sync`
- `POST /v1/projects`
- `GET /v1/projects/{project_id}`
- `POST /v1/projects/{project_id}/brief`
- `POST /v1/projects/{project_id}/sources`
- `GET /v1/projects/{project_id}/memory`
- `GET /v1/projects/{project_id}/activity`
- `POST /v1/projects/{project_id}/research/run`
- `GET /v1/projects/{project_id}/research`
- `POST /v1/projects/{project_id}/positioning/run`
- `GET /v1/projects/{project_id}/positioning`
- `POST /v1/projects/{project_id}/positioning/select/{version_id}`
- `POST /v1/projects/{project_id}/execution/plan`
- `POST /v1/projects/{project_id}/execution/assets`
- `POST /v1/projects/{project_id}/execution/contacts`
- `POST /v1/projects/{project_id}/execution/email-batch/prepare`
- `POST /v1/projects/{project_id}/execution/email-batch/{batch_id}/send`
- `GET /v1/projects/{project_id}/approvals`
- `POST /v1/approvals/{approval_id}/approve`
- `POST /v1/approvals/{approval_id}/reject`
- `GET /v1/projects/{project_id}/assets`
- `POST /v1/assets/{asset_id}/promote`
