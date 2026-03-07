# Growth Launchpad

Growth Launchpad is a hackathon-focused MVP for supervised, multi-agent product launches.

This repo implements the architecture defined in `design.md`:
- Next.js frontend (`apps/web`)
- FastAPI API + worker (`apps/api`)
- Postgres-backed queue/state
- Approval-gated execution flows

## What this MVP does

- Project/workspace creation and sync
- Research, positioning, and execution workflows
- Persistent project memory and activity timeline
- Asset generation and promotion
- Contact ingestion, email batch preparation, approval flow, and send execution

## Repo layout

- `apps/web`: Next.js App Router product UI
- `apps/api`: FastAPI API, worker, SQLAlchemy models, Alembic migrations
- `packages/shared-types`: shared TypeScript types
- `infra/docker`: local Docker Compose
- `infra/scripts`: utility scripts (including demo seeding)

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.12+
- Postgres 15+ (or Docker)

## Environment setup

1. Copy `.env.example` to `.env`.
2. Fill required values for your mode:
   - local/hack mode: minimum local runtime values
   - production-like mode: Auth0, Supabase, Backboard, Google, and Resend credentials

Notes:
- The API has a local fallback identity mode when Auth0 verification env vars are not set.
- Resend and Google integrations degrade to mock behavior when API keys are absent.

## Local development

### 1. Install frontend deps

```bash
npm install
```

### 2. Install API deps

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

### 3. Run migrations

From `apps/api`:

```bash
alembic upgrade head
```

### 4. Start API

From repo root:

```bash
uvicorn app.main:app --reload --app-dir apps/api
```

### 5. Start worker

From `apps/api` (with venv active):

```bash
python -m app.worker.runner
```

### 6. Start web

From repo root:

```bash
npm run dev --workspace web
```

## Docker quickstart (optional)

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

This starts:
- Postgres
- API
- Worker

## API overview

Base URL: `http://localhost:8000/v1`

### Identity + workspace

- `GET /me`
- `GET /workspaces`
- `POST /workspaces/sync`

### Projects

- `POST /projects`
- `GET /projects/{project_id}`
- `POST /projects/{project_id}/brief`
- `POST /projects/{project_id}/sources`
- `GET /projects/{project_id}/memory`
- `GET /projects/{project_id}/activity`

### Research

- `POST /projects/{project_id}/research/run`
- `GET /projects/{project_id}/research`

### Positioning

- `POST /projects/{project_id}/positioning/run`
- `GET /projects/{project_id}/positioning`
- `POST /projects/{project_id}/positioning/select/{version_id}`

### Execution

- `POST /projects/{project_id}/execution/plan`
- `POST /projects/{project_id}/execution/assets`
- `POST /projects/{project_id}/execution/contacts`
- `POST /projects/{project_id}/execution/email-batch/prepare`
- `POST /projects/{project_id}/execution/email-batch/{batch_id}/send`
- `GET /projects/{project_id}/execution/state`

### Approvals + assets

- `GET /projects/{project_id}/approvals`
- `POST /approvals/{approval_id}/approve`
- `POST /approvals/{approval_id}/reject`
- `GET /projects/{project_id}/assets`
- `POST /assets/{asset_id}/promote`

## Worker jobs

The worker processes `job_runs` records for:
- `project.bootstrap`
- `research.run`
- `positioning.run`
- `execution.plan`
- `execution.generate_assets`
- `execution.prepare_email_batch`
- `execution.send_email_batch`
- `creative.render_video`

## Demo seed script

```bash
API_BASE=http://localhost:8000/v1 \
WORKSPACE_ID=<workspace-uuid> \
python infra/scripts/seed_demo.py
```

## Frontend route map

- `/`
- `/login`
- `/app`
- `/app/select-workspace`
- `/app/workspace/[workspaceSlug]`
- `/app/workspace/[workspaceSlug]/projects/new`
- `/app/workspace/[workspaceSlug]/projects/[projectSlug]`
- `/app/workspace/[workspaceSlug]/projects/[projectSlug]/research`
- `/app/workspace/[workspaceSlug]/projects/[projectSlug]/positioning`
- `/app/workspace/[workspaceSlug]/projects/[projectSlug]/execution`
- `/app/workspace/[workspaceSlug]/projects/[projectSlug]/approvals`
- `/app/workspace/[workspaceSlug]/projects/[projectSlug]/memory`
- `/app/workspace/[workspaceSlug]/projects/[projectSlug]/settings`
- `/app/settings/security`

## Implementation notes

- Hackathon-first design: API and worker use simple, explicit service flows.
- Postgres is the single durable state store for app data and queue state.
- Browser writes are API-mediated; sensitive actions are approval-gated.
- Auth0 is the intended production trust boundary, with local fallback for dev velocity.
