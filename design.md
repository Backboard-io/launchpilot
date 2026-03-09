# Growth Launchpad MVP Design Document

## 1. Document purpose

This document is the single source of truth for building the MVP of **Growth Launchpad**, a supervised multi agent launch workspace for students and indie developers. The product helps a user turn a rough project idea or early MVP into:

- a sharp target audience
- a clear positioning angle
- a lightweight first user acquisition plan
- generated launch assets
- supervised outbound execution

This MVP is designed for hackathon scope first, but the architecture is clean enough to extend after the event.

## 2. Product summary

### Product statement

Growth Launchpad is a workspace where a user can:

1. create a project
2. ingest a short brief and optional links
3. run a Research Agent to map competitors and gaps
4. run a Positioning Agent to choose an ICP, wedge, and messaging
5. run an Execution Agent to generate assets, prepare outreach, and execute selected actions under approval
6. return later and continue from remembered project context

### Core product promise

The product does not just give advice. It gives:

- decisions
- drafts
- assets
- approval gated execution
- persistent memory across sessions

### MVP target users

Primary:
- students shipping hackathon projects or portfolio tools
- indie developers shipping early SaaS, bots, plugins, utilities, or apps

Secondary:
- technical solo founders with weak GTM skills

### Primary user pain

The user can build, but does not know:
- which niche to choose
- how to position the product
- how to write launch copy
- how to get first users without random guessing

## 3. MVP goals and non goals

### Goals

The MVP must prove five things:

1. **Persistent project memory**
   The system remembers the project, prior research, rejected wedges, approved assets, and previous actions.

2. **Multi agent workflow**
   Research, Positioning, and Execution each have distinct responsibilities and visible outputs.

3. **Supervised execution**
   The system can prepare and execute some real actions, but only with explicit approval.

4. **Product first UX**
   The main surface is a workspace with boards, drafts, queues, and assets. Chat is secondary.

5. **Strong sponsor integrations**
   Auth0 is the trust and authorization layer. Backboard is the persistent assistant and memory substrate.

### Non goals

Do not build these into the MVP:

- full CRM
- social media direct posting to many platforms
- large scale lead scraping
- fully autonomous multi channel outbound
- deep analytics dashboards
- billing or subscriptions
- polished team admin suite
- many external integrations beyond one approved outbound path and one simple source ingestion path

## 4. MVP scope

### In scope

- Auth0 login, organization aware workspaces, RBAC, and step up auth for sensitive actions
- project creation and onboarding
- competitor and opportunity analysis
- ICP, wedge, positioning statement, and launch messaging generation
- 7 day launch plan generation
- static ad copy generation
- static image ad generation
- video ad concept and storyboard generation
- optional full short video render behind a feature flag
- outbound email drafting and supervised sending through Resend
- approval queue
- project memory and activity timeline
- Supabase database and storage
- Backboard assistant, threads, documents, and shared memory

### Out of scope but planned later

- direct Slack and Discord posting
- direct X or LinkedIn posting
- ad platform integrations
- detailed performance attribution
- autonomous follow up campaigns
- multi user real time collaboration on same screen

## 5. Core user stories

### Solo student founder

- As a student founder, I can create a project and describe my tool in one minute.
- As a student founder, I can see who my competitors are and what gaps exist.
- As a student founder, I can get a narrow user segment recommendation rather than generic startup advice.
- As a student founder, I can generate landing page copy, launch posts, and ads.
- As a student founder, I can approve and send a small batch of launch emails.
- As a student founder, I can return later and the system still remembers what I decided.

### Team workspace owner

- As a workspace owner, I can invite teammates.
- As a workspace owner, I can approve sensitive actions.
- As a workspace owner, I can see which agent prepared an action and who approved it.

### Reviewer teammate

- As a reviewer, I can inspect drafts and approve or reject if I have the right role.
- As a reviewer, I cannot send or publish sensitive actions unless granted the right scope.

## 6. Success criteria

For the MVP demo, success means:

- a user can sign in and create a project
- a project can run through Research, Positioning, and Execution end to end
- the app produces visible, structured outputs on each stage
- the user can approve a sensitive action and trigger step up auth
- the app can send at least one batch of real emails through Resend after approval
- the app stores activity, outputs, and decisions and shows them on a later reload

## 7. Technical stack

### Monorepo

Use a single monorepo with separate frontend and backend folders.

### Core stack

Frontend:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form + Zod
- Supabase JS client for realtime subscriptions only
- Auth0 Next.js SDK

Backend:
- FastAPI
- Python 3.12
- Pydantic v2
- httpx
- SQLAlchemy 2 or direct psycopg with SQLModel style access
- Alembic for migrations
- Backboard Python SDK
- Google GenAI Python SDK
- Resend Python SDK or direct REST

Infrastructure:
- Supabase Postgres
- Supabase Storage
- Supabase Realtime
- Auth0
- Backboard
- Google Gemini API
- Resend

### Architectural principle

- Auth0 handles identity and authorization
- Supabase is the application database, file store, and realtime layer
- FastAPI owns orchestration, agent execution, approvals, and external provider calls
- Backboard owns assistant threads, cross thread memory, and document aware agent context
- Next.js owns the product UI and auth integrated user experience

## 8. High level architecture

```text
User Browser
  -> Next.js Web App
      -> Auth0 Universal Login
      -> Calls FastAPI with Auth0 access token
      -> Subscribes to Supabase realtime for job and approval updates

Next.js Web App
  -> FastAPI API
      -> Supabase Postgres
      -> Supabase Storage
      -> Backboard
      -> Google Gemini API
      -> Resend

FastAPI Worker Loop
  -> claims queued jobs from Supabase
  -> runs Research / Positioning / Execution tasks
  -> writes outputs back to Supabase
  -> optionally updates Backboard memory and threads
```

## 9. Why this split is correct

### Why Next.js for frontend

- best product surface for a polished web app
- easy Auth0 integration for login and route protection
- strong App Router model for dashboards and server actions
- easy component composition and fast UI iteration

### Why FastAPI for backend

- Python is best for agent orchestration and LLM tooling
- easier to integrate Backboard Python SDK and Google GenAI Python SDK
- good typing, good API ergonomics, good async support

### Why Supabase for data

- single managed Postgres for structured state
- storage for uploaded and generated assets
- realtime updates for job and approval UI
- easy local development with migrations

### Why Backboard for agents

- assistant abstraction
- persistent threads
- shared memory across threads
- tool calling
- document ingestion and retrieval

### Why Auth0 as core auth layer

- strong Universal Login
- social sign in for students and developers
- passkeys
- organizations and roles
- custom claims via Actions
- API protection and RBAC
- step up auth for sensitive execution

## 10. Monorepo structure

```text
growth-launchpad/
  apps/
    web/
      app/
      components/
      features/
      lib/
      hooks/
      middleware.ts
      public/
      styles/
      package.json
    api/
      app/
        main.py
        core/
        routers/
        services/
        agents/
        worker/
        schemas/
        models/
        db/
        integrations/
        security/
        prompts/
      tests/
      pyproject.toml
      alembic.ini
      migrations/
  packages/
    shared-types/
    eslint-config/
  infra/
    docker/
    scripts/
  .env.example
  pnpm-workspace.yaml
  turbo.json
  README.md
```

## 11. Environment variables

```text
# Web
NEXT_PUBLIC_APP_URL=
AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_AUDIENCE=
AUTH0_SCOPE=openid profile email offline_access
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
API_BASE_URL=

# API
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
AUTH0_DOMAIN=
AUTH0_AUDIENCE=
AUTH0_ISSUER=
BACKBOARD_API_KEY=
BACKBOARD_DEFAULT_MODEL=
GOOGLE_GENAI_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
APP_JWT_NAMESPACE=https://growthlaunchpad.app
ENABLE_VIDEO_RENDER=true
ENABLE_TOKEN_VAULT=false
WORKER_POLL_INTERVAL_SECONDS=3
```

## 12. Auth0 integration design

Auth0 is not just login. It is the **trust boundary** for the entire product.

### 12.1 Core rules

- End user authentication is fully handled by Auth0.
- Supabase Auth is not used for user identity.
- Every frontend to backend call uses an Auth0 issued access token.
- Sensitive actions require additional scopes and step up authentication.
- Workspace membership and role based permissions come from Auth0 first, then are mirrored into local tables for app querying.

### 12.2 Auth0 features used in MVP

Mandatory:
- Universal Login
- Google social login
- GitHub social login
- passkeys
- Auth0 Next.js SDK
- Organizations if enabled on tenant
- RBAC for API
- custom claims via post login Action
- step up authentication for sensitive actions
- MFA for send and publish scopes
- account linking

Optional but recommended if tenant access exists:
- Token Vault for connected accounts and delegated access

### 12.3 Auth0 application setup

Create:

1. **Regular Web Application** for Next.js frontend
2. **API** for FastAPI backend

Auth0 API identifier example:

```text
https://api.growthlaunchpad.app
```

API scopes:

```text
project:read
project:write
research:run
positioning:run
execution:run
approval:read
approval:write
execution:send
creative:publish
connector:link
admin:workspace
```

### 12.4 Workspace model with Organizations

Use Auth0 Organizations to represent workspaces.

Mapping:
- Auth0 organization = workspace
- Auth0 user = member
- Auth0 roles = workspace role

App roles:
- owner
- operator
- reviewer
- guest

Role permissions:

**owner**
- full project access
- connect accounts
- approve sends
- publish assets
- invite members

**operator**
- edit project
- run agents
- draft assets
- request approvals

**reviewer**
- view outputs
- approve if explicit approval permission granted
- cannot link connectors by default

**guest**
- read only

### 12.5 Custom claims

Use a post login Action to attach custom claims to ID token and access token.

Namespace:

```text
https://growthlaunchpad.app/
```

Claims:

```json
{
  "https://growthlaunchpad.app/user_id": "auth0|...",
  "https://growthlaunchpad.app/org_id": "org_...",
  "https://growthlaunchpad.app/workspace_role": "owner",
  "https://growthlaunchpad.app/allowed_actions": ["approve_send", "publish_asset"],
  "https://growthlaunchpad.app/default_project_limit": 10
}
```

These claims are used by both Next.js and FastAPI.

### 12.6 Step up auth model

Sensitive actions are never allowed off a normal session alone.

Step up actions:
- send email batch
- publish final creative asset externally
- export contact data
- connect or reconnect delegated external accounts

Flow:
1. user clicks approve on a sensitive action
2. frontend requests token with sensitive scope such as `execution:send`
3. Auth0 triggers step up policy if current session lacks MFA assurance
4. user completes MFA or passkey challenge
5. frontend receives elevated token
6. FastAPI validates token permissions and executes action
7. audit entry is recorded

### 12.7 Account linking

Enable account linking so a user can use GitHub and Google under one profile.

Use cases:
- developer logs in with GitHub
- later joins workspace with Google
- app links accounts to one Auth0 identity

### 12.8 Connected accounts and Token Vault

Token Vault should be treated as optional because tenant availability may vary.

If enabled:
- connect GitHub as a delegated account
- later allow the app to request a GitHub access token on the user’s behalf for repo metadata retrieval
- use least privilege scopes only
- require step up before first connector link

MVP should not depend on Token Vault. If unavailable, fall back to manual repo URL ingestion and public metadata only.

### 12.9 Next.js integration with Auth0

Use Auth0 Next.js SDK in `apps/web`.

Responsibilities:
- login route
- logout route
- callback handling
- session retrieval on server
- route protection
- access token retrieval for backend audience

Middleware rules:
- protect all `/app/*` routes
- allow public landing page and auth routes

### 12.10 FastAPI integration with Auth0

FastAPI validates access tokens using Auth0 issuer and JWKS.

Security layer responsibilities:
- decode and validate JWT
- verify audience and issuer
- extract scopes
- extract custom claims
- enforce org scoped access
- enforce role permissions
- enforce step up requirement for sensitive endpoints

### 12.11 Auth0 audit visibility in product

The product should surface security state clearly.

Security center page shows:
- signed in provider
- linked accounts
- current workspace and role
- recent approvals
- recent step up events
- sensitive actions performed

## 13. Backboard integration design

Backboard is the persistent assistant and memory substrate for the agent system.

### 13.1 Design principle

Supabase is the canonical product state.
Backboard is the canonical semantic memory and conversational execution context.

Do not use Backboard as the main business database.
Do use Backboard for:
- assistant configuration
- long lived threads
- shared memory across threads
- RAG on project documents
- tool calling during agent execution

### 13.2 Backboard object model for this product

Per project create:

- **1 Backboard assistant**
- **3 primary threads**
  - research thread
  - positioning thread
  - execution thread
- optional branch threads for wedge A vs wedge B comparisons

Why this is the correct pattern:
- threads are persistent conversations
- one assistant can own multiple threads
- memory shared at assistant level makes cross thread continuity possible

### 13.3 What lives in Backboard memory

Only store facts that help future agent reasoning.

Good memory items:
- selected ICP
- rejected wedges
- preferred tone
- brand style hints
- pricing direction
- chosen channels
- winning hooks
- key objections from outreach
- do not target notes

Bad memory items:
- full canonical project records
- raw audit logs
- every UI click
- secret tokens

### 13.4 What lives in Backboard documents

Project wide assistant level docs:
- project brief PDF or text export
- landing page capture
- README export
- user uploaded notes
- approved positioning snapshot
- competitor notes if exported as docs

Thread specific docs:
- temporary branch comparison docs
- experiment specific briefs

### 13.5 Tool calling model

The Backboard assistant uses tool calls to ask the FastAPI orchestrator for actions and structured context.

Tool categories:

**Read tools**
- get_project_context
- get_research_snapshot
- get_positioning_snapshot
- get_execution_state
- list_contacts
- get_brand_guidelines

**Write tools**
- create_competitor_candidates
- save_positioning_version
- create_launch_plan
- create_asset_draft
- queue_approval
- append_memory_fact

**External action tools**
- generate_static_ads
- generate_video_storyboards
- render_short_video
- prepare_email_batch
- send_approved_email_batch

### 13.6 Assistant system prompts

Use one base assistant configuration per project with tool access enabled, then specialize per thread through message level instructions.

Base assistant responsibilities:
- reason from project memory and docs
- use tools instead of fabricating structured state
- never execute sensitive actions without explicit approval workflow
- write structured outputs only when asked

Thread specialization:
- research thread prompt emphasizes competitor analysis and opportunity framing
- positioning thread prompt emphasizes ICP selection and messaging decisions
- execution thread prompt emphasizes practical launch tasks, assets, and approval gated actions

### 13.7 Backboard lifecycle for a project

On project creation:
1. create assistant
2. create three threads
3. save assistant and thread ids to Supabase
4. optionally upload project brief doc
5. seed initial memory with product name, stage, and goal

On research run:
1. enqueue research job
2. worker assembles project context
3. worker sends instruction to research thread
4. if Backboard requests tools, worker fulfills them
5. final response is normalized into structured records and saved to Supabase
6. selective memory facts are mirrored into Backboard memory

On later sessions:
- same assistant and threads are reused
- user sees continuity

### 13.8 Backboard usage boundaries

Backboard is not used directly from the browser.
Only the FastAPI backend communicates with Backboard.

Reasons:
- protect API keys
- keep prompts and tool contracts server side
- centralize orchestration and audit logic

## 14. Data model

Use Supabase Postgres as the source of truth.

### 14.1 Identity and workspace tables

#### `users`

```sql
id uuid primary key default gen_random_uuid()
auth0_user_id text unique not null
email text not null
name text
avatar_url text
created_at timestamptz default now()
updated_at timestamptz default now()
```

#### `workspaces`

```sql
id uuid primary key default gen_random_uuid()
auth0_org_id text unique
name text not null
slug text unique not null
owner_user_id uuid references users(id)
created_at timestamptz default now()
updated_at timestamptz default now()
```

#### `workspace_members`

```sql
id uuid primary key default gen_random_uuid()
workspace_id uuid references workspaces(id) on delete cascade
user_id uuid references users(id) on delete cascade
role text not null check (role in ('owner','operator','reviewer','guest'))
status text not null default 'active'
created_at timestamptz default now()
unique(workspace_id, user_id)
```

### 14.2 Project tables

#### `projects`

```sql
id uuid primary key default gen_random_uuid()
workspace_id uuid references workspaces(id) on delete cascade
name text not null
slug text not null
summary text
stage text not null default 'idea'
goal text
product_type text
website_url text
repo_url text
target_market_hint text
status text not null default 'active'
created_by uuid references users(id)
created_at timestamptz default now()
updated_at timestamptz default now()
unique(workspace_id, slug)
```

#### `project_briefs`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
raw_brief text not null
parsed_problem text
parsed_audience text
parsed_constraints jsonb
created_at timestamptz default now()
```

#### `project_sources`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
source_type text not null check (source_type in ('website','repo','doc','manual_note'))
url text
storage_path text
title text
status text not null default 'ready'
created_at timestamptz default now()
```

### 14.3 Backboard linkage tables

#### `agent_runtime`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid unique references projects(id) on delete cascade
backboard_assistant_id text not null
research_thread_id text not null
positioning_thread_id text not null
execution_thread_id text not null
created_at timestamptz default now()
updated_at timestamptz default now()
```

#### `project_memory`

This is canonical structured memory in Supabase. Some of it is mirrored into Backboard.

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
memory_key text not null
memory_value jsonb not null
memory_type text not null check (memory_type in ('fact','decision','preference','objection','hook','constraint'))
source text not null check (source in ('user','agent','system'))
created_at timestamptz default now()
updated_at timestamptz default now()
unique(project_id, memory_key)
```

### 14.4 Research tables

#### `research_runs`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
status text not null default 'queued'
summary text
saturation_score numeric
created_by uuid references users(id)
created_at timestamptz default now()
completed_at timestamptz
```

#### `competitors`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
name text not null
url text
category text
positioning text
pricing_summary text
target_user text
strengths jsonb default '[]'::jsonb
weaknesses jsonb default '[]'::jsonb
notes text
created_at timestamptz default now()
```

#### `pain_point_clusters`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
label text not null
description text
evidence jsonb default '[]'::jsonb
rank integer
created_at timestamptz default now()
```

#### `opportunity_wedges`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
label text not null
description text
score numeric
status text not null default 'candidate'
created_at timestamptz default now()
```

### 14.5 Positioning tables

#### `positioning_versions`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
selected boolean not null default false
icp text not null
wedge text not null
positioning_statement text not null
headline text
subheadline text
benefits jsonb default '[]'::jsonb
pricing_direction text
objection_handling jsonb default '[]'::jsonb
created_at timestamptz default now()
created_by uuid references users(id)
```

### 14.6 Execution tables

#### `launch_plans`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
positioning_version_id uuid references positioning_versions(id)
primary_channel text
secondary_channels jsonb default '[]'::jsonb
kpis jsonb default '[]'::jsonb
status text not null default 'active'
created_at timestamptz default now()
```

#### `launch_tasks`

```sql
id uuid primary key default gen_random_uuid()
launch_plan_id uuid references launch_plans(id) on delete cascade
title text not null
description text
day_number integer
status text not null default 'todo'
priority integer default 3
created_at timestamptz default now()
updated_at timestamptz default now()
```

#### `assets`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
asset_type text not null check (asset_type in ('landing_copy','social_post','email_copy','ad_copy','image_ad','video_script','video_storyboard','video_render'))
status text not null default 'draft'
title text
content jsonb
storage_path text
created_by_agent text
created_at timestamptz default now()
updated_at timestamptz default now()
```

#### `contacts`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
name text
email text
company text
segment text
personalization_notes text
source text default 'manual'
created_at timestamptz default now()
```

#### `outbound_batches`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
asset_id uuid references assets(id)
status text not null default 'draft'
subject_line text
send_count integer default 0
created_at timestamptz default now()
approved_at timestamptz
sent_at timestamptz
```

#### `outbound_messages`

```sql
id uuid primary key default gen_random_uuid()
batch_id uuid references outbound_batches(id) on delete cascade
contact_id uuid references contacts(id) on delete cascade
subject text
body text
status text not null default 'draft'
provider_message_id text
error_message text
created_at timestamptz default now()
sent_at timestamptz
```

### 14.7 Approval and audit tables

#### `approvals`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
action_type text not null
resource_type text not null
resource_id uuid
status text not null default 'pending'
requested_by uuid references users(id)
requested_by_agent text
reason text
required_scope text
requires_step_up boolean not null default true
approved_by uuid references users(id)
approved_at timestamptz
rejected_at timestamptz
created_at timestamptz default now()
```

#### `activity_events`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
actor_type text not null check (actor_type in ('user','agent','system'))
actor_id text
verb text not null
object_type text
object_id text
metadata jsonb default '{}'::jsonb
created_at timestamptz default now()
```

### 14.8 Job system tables

#### `job_runs`

```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
job_type text not null
status text not null default 'queued'
payload jsonb not null default '{}'::jsonb
result jsonb
error_message text
attempt_count integer not null default 0
locked_by text
locked_at timestamptz
created_by uuid references users(id)
created_at timestamptz default now()
started_at timestamptz
completed_at timestamptz
```

## 15. Storage design

Use Supabase Storage buckets.

Buckets:
- `project-uploads`
- `generated-assets`
- `video-renders`
- `temp-ingestion`

Rules:
- original user files stored in Supabase Storage
- generated image and video outputs stored in Supabase Storage
- only derived text or selected docs copied into Backboard when needed for agent context

## 16. Realtime design

For MVP, use Supabase realtime subscriptions for:
- `job_runs`
- `approvals`
- `activity_events`
- `assets`

This drives:
- live job progress badges
- approval queue refresh
- newly generated asset cards
- activity timeline updates

## 17. Backend architecture

Backend consists of three runtime roles:

1. **FastAPI API server**
2. **Job worker**
3. **Shared service layer**

### 17.1 API server responsibilities

- validate Auth0 tokens
- authorize workspace and project access
- create projects and records
- enqueue jobs
- return structured results
- handle approval requests and execution triggers

### 17.2 Worker responsibilities

- claim queued jobs from `job_runs`
- run agent workflows
- call Backboard
- call Google models
- call Resend
- update results, assets, approvals, and activity log

### 17.3 Shared service layer responsibilities

- DB access
- Backboard client wrappers
- Google client wrappers
- Resend wrappers
- auth helpers
- policy checks

## 18. Minimal but robust job architecture

Use Postgres as the queue for MVP. Do not add Redis yet.

### Why

- one fewer infrastructure dependency
- durable state in the same database
- simpler hackathon deployment
- enough throughput for MVP

### Claiming jobs

Worker loop pseudocode:

```sql
select id
from job_runs
where status = 'queued'
order by created_at asc
for update skip locked
limit 1;
```

Then update:
- status = running
- locked_by = worker id
- locked_at = now()
- started_at = now()

On success:
- status = succeeded
- result = jsonb payload
- completed_at = now()

On failure:
- status = failed
- error_message set
- attempt_count incremented

### Supported job types

- `project.bootstrap`
- `research.run`
- `positioning.run`
- `execution.plan`
- `execution.generate_assets`
- `execution.prepare_email_batch`
- `execution.send_email_batch`
- `creative.render_video`

## 19. FastAPI folder design

```text
apps/api/app/
  main.py
  core/
    config.py
    logging.py
  db/
    session.py
    base.py
  security/
    auth0.py
    permissions.py
  schemas/
    common.py
    project.py
    research.py
    positioning.py
    execution.py
    approval.py
  models/
    project.py
    workspace.py
    research.py
    positioning.py
    execution.py
    approval.py
  routers/
    health.py
    me.py
    workspaces.py
    projects.py
    research.py
    positioning.py
    execution.py
    approvals.py
    assets.py
  services/
    project_service.py
    job_service.py
    audit_service.py
    storage_service.py
  integrations/
    backboard_client.py
    google_media_client.py
    resend_client.py
    auth0_admin.py
  agents/
    shared_context.py
    research_agent.py
    positioning_agent.py
    execution_agent.py
    normalizers.py
  prompts/
    research_prompt.py
    positioning_prompt.py
    execution_prompt.py
  worker/
    runner.py
    handlers.py
```

## 20. API route plan

### Auth and identity

#### `GET /v1/me`
Returns current user profile, workspace memberships, current role, and feature flags.

### Workspaces

#### `GET /v1/workspaces`
List user workspaces.

#### `POST /v1/workspaces/sync`
Mirror Auth0 org and member claims into local tables after login.

### Projects

#### `POST /v1/projects`
Create project.

Request:
```json
{
  "workspace_id": "uuid",
  "name": "My tool",
  "summary": "AI tool for ...",
  "goal": "Get first 20 users",
  "website_url": "https://...",
  "repo_url": "https://..."
}
```

Action:
- insert project
- create bootstrap job
- return project id

#### `GET /v1/projects/{project_id}`
Get project summary for dashboard.

#### `POST /v1/projects/{project_id}/brief`
Save or update project brief.

#### `POST /v1/projects/{project_id}/sources`
Add source URLs or uploaded file references.

### Research

#### `POST /v1/projects/{project_id}/research/run`
Queue research run.

#### `GET /v1/projects/{project_id}/research`
Return latest research snapshot.

### Positioning

#### `POST /v1/projects/{project_id}/positioning/run`
Queue positioning run.

Payload may optionally specify wedge candidate ids.

#### `GET /v1/projects/{project_id}/positioning`
Return current positioning options and selected version.

#### `POST /v1/projects/{project_id}/positioning/select/{version_id}`
Mark selected positioning version and write key decisions into memory.

### Execution

#### `POST /v1/projects/{project_id}/execution/plan`
Generate 7 day launch plan from selected positioning.

#### `POST /v1/projects/{project_id}/execution/assets`
Generate requested assets.

Payload:
```json
{
  "types": ["landing_copy", "email_copy", "image_ad", "video_storyboard"],
  "count": 3
}
```

#### `POST /v1/projects/{project_id}/execution/contacts`
Upload or add contacts.

#### `POST /v1/projects/{project_id}/execution/email-batch/prepare`
Generate personalized email drafts and create approval request.

#### `POST /v1/projects/{project_id}/execution/email-batch/{batch_id}/send`
Protected endpoint. Requires sensitive scope and approved batch.

### Approvals

#### `GET /v1/projects/{project_id}/approvals`
List pending and historical approvals.

#### `POST /v1/approvals/{approval_id}/approve`
Approve item. Backend checks sensitive scope.

#### `POST /v1/approvals/{approval_id}/reject`
Reject item.

### Assets

#### `GET /v1/projects/{project_id}/assets`
List generated assets.

#### `POST /v1/assets/{asset_id}/promote`
Mark asset as selected and write to memory if relevant.

## 21. Agent orchestration design

There are three product level agents.

### 21.1 Shared contract across all agents

Inputs:
- project record
- project brief
- sources
- current structured memory
- selected or candidate positioning
- user goal

Outputs:
- human readable explanation
- structured JSON payload
- optional proposed actions
- optional approval items

All agents must:
- use structured outputs
- avoid fabricating missing state
- request tools when necessary
- write only valid, normalized result objects

## 22. Research Agent design

### Mission

Turn a rough project into a market picture with competitors, pain points, and candidate wedges.

### Inputs

- project name and summary
- project brief
- URLs or docs
- existing memory

### Internal steps

1. normalize project category
2. identify likely substitutes and competitor categories
3. collect competitor candidates
4. summarize positioning and pricing patterns
5. cluster pain points
6. propose opportunity wedges
7. write results to database
8. mirror a few decisions into Backboard memory

### Output schema

```json
{
  "project_category": "developer productivity",
  "candidate_user_segments": ["student developers", "indie hackers"],
  "competitors": [
    {
      "name": "Example",
      "positioning": "...",
      "pricing_summary": "...",
      "strengths": ["..."],
      "weaknesses": ["..."]
    }
  ],
  "pain_point_clusters": [
    {
      "label": "Too generic",
      "description": "Users do not trust broad GTM helpers"
    }
  ],
  "opportunity_wedges": [
    {
      "label": "Hackathon to waitlist",
      "description": "Focus on student founders converting hackathon projects into first users",
      "score": 0.84
    }
  ],
  "risk_warnings": ["Crowded category"]
}
```

### Backboard usage

Use research thread.

Potential tools:
- get_project_context
- search_existing_competitors
- save_competitor_candidates
- save_pain_point_clusters
- save_opportunity_wedges

## 23. Positioning Agent design

### Mission

Choose who the product is for, what narrow wedge to enter with, and how to message it.

### Inputs

- research snapshot
- project goal
- current memory

### Internal steps

1. evaluate candidate segments
2. rank wedge candidates
3. choose one ICP
4. create positioning statement
5. generate headline, subheadline, benefits, objections, pricing direction
6. create multiple versions if useful
7. persist chosen and rejected options

### Output schema

```json
{
  "recommended_icp": "CS students shipping portfolio tools who need first users",
  "recommended_wedge": "turn hackathon projects into first-user growth systems",
  "positioning_statement": "For ...",
  "headline": "Turn your side project into first users",
  "subheadline": "...",
  "benefits": ["...", "...", "..."],
  "objection_handling": [
    {
      "objection": "Why not just use ChatGPT",
      "response": "..."
    }
  ],
  "pricing_direction": "free + low friction paid sprint"
}
```

### Backboard usage

Use positioning thread.

Potential tools:
- get_research_snapshot
- save_positioning_version
- save_rejected_icps
- append_memory_fact

## 24. Execution Agent design

### Mission

Convert selected positioning into:
- launch plan
- launch assets
- approval gated outbound steps
- optional creative renders

### Internal sub capabilities

1. planner
2. asset generator
3. action preparer
4. supervised executor
5. feedback observer

### Inputs

- selected positioning version
- project goal
- contacts if any
- current memory
- brand tone if any

### Internal steps

1. choose primary channel
2. generate 7 day launch plan
3. generate requested assets
4. prepare outreach batch if contacts exist
5. create approval records for sensitive actions
6. after approval, execute selected send or render action
7. record results and feedback

### Output schema

```json
{
  "launch_strategy": {
    "primary_channel": "email outreach",
    "secondary_channels": ["reddit", "x"],
    "why": "..."
  },
  "tasks": [
    {
      "day_number": 1,
      "title": "Finalize landing page headline",
      "description": "..."
    }
  ],
  "assets": [
    {
      "asset_type": "email_copy",
      "title": "Cold outreach v1",
      "content": {}
    }
  ],
  "approval_requests": [
    {
      "action_type": "send_email_batch",
      "required_scope": "execution:send"
    }
  ]
}
```

### Backboard usage

Use execution thread.

Potential tools:
- get_positioning_snapshot
- create_launch_plan
- create_asset_draft
- queue_approval
- prepare_email_batch
- generate_static_ads
- generate_video_storyboards
- render_short_video

## 25. Google creative generation design

Use Google GenAI for image and video related creative generation.

### Static image ads

Recommended MVP behavior:
- agent creates 3 ad angles
- each angle gets headline, body copy, CTA, and visual prompt
- backend calls Google image generation model to create 1 or 2 variants per chosen angle
- resulting images saved to Supabase Storage and `assets`

### Video concepts

Always supported:
- 15 second script
- scene breakdown
- hook
- captions
- CTA
- storyboard frames description

Optional full video render:
- user explicitly clicks render
- backend generates short 8 second or similar asset using Google video model
- saved to Supabase Storage and asset record updated

### Safety and cost controls

- only render video on explicit request
- cap number of images and videos per job
- store generation params for reproducibility

## 26. Resend integration design

Resend is used only for outbound email in MVP.

### Rules

- only send to user provided contacts
- no scraping
- batch caps, example 10 at a time
- every send requires approval
- every send requires step up auth

### Flow

1. user uploads contacts or manually enters them
2. execution agent prepares personalized messages
3. system creates outbound batch and pending approval
4. approver reviews preview
5. step up auth occurs
6. backend sends through Resend
7. message ids stored
8. activity and results recorded

### Why email only in MVP

This gives real execution without platform policy headaches from social DM automation.

## 27. Page by page frontend specification

The frontend must feel like a workspace, not a chatbot.

### Route map

```text
/
/login
/app
/app/select-workspace
/app/workspace/[workspaceSlug]
/app/workspace/[workspaceSlug]/projects/new
/app/workspace/[workspaceSlug]/projects/[projectSlug]
/app/workspace/[workspaceSlug]/projects/[projectSlug]/research
/app/workspace/[workspaceSlug]/projects/[projectSlug]/positioning
/app/workspace/[workspaceSlug]/projects/[projectSlug]/execution
/app/workspace/[workspaceSlug]/projects/[projectSlug]/approvals
/app/workspace/[workspaceSlug]/projects/[projectSlug]/memory
/app/workspace/[workspaceSlug]/projects/[projectSlug]/settings
/app/settings/security
```

## 28. Global layout

### Shell layout

```text
AppShell
  TopBar
    WorkspaceSwitcher
    ProjectBreadcrumbs
    SearchButton
    NotificationsButton
    UserMenu
  LeftSidebar
    NavSection
    ProjectNav
    SecondaryLinks
  MainContent
  RightRail
    PendingApprovalsCard
    AgentStatusCard
    MemorySummaryCard
```

### Layout behavior

- desktop: three column shell
- tablet: collapsible right rail
- mobile: bottom sheet navigation, right rail hidden by default

## 29. Landing page `/`

### Purpose

Explain the product quickly and drive sign in.

### Content blocks

- hero
- feature strip
- how it works
- security strip mentioning approval gated actions
- sponsor strip if wanted
- CTA buttons

### Component hierarchy

```text
LandingPage
  Header
    Logo
    NavLinks
    LoginButton
  HeroSection
    Headline
    Subheadline
    PrimaryCTA
    SecondaryCTA
    ProductMockup
  FeatureGrid
    FeatureCard x 4
  HowItWorksSection
    StepCard x 3
  SecurityCallout
  Footer
```

## 30. Login and callback pages

Auth0 Universal Login handles most of this. The app only needs thin entry pages.

### `/login`

```text
LoginPage
  CenterCard
    Logo
    Heading
    SignInWithGitHubButton
    SignInWithGoogleButton
    ContinueWithPasskeyButton
    SmallPrint
```

## 31. Workspace selector `/app/select-workspace`

### Purpose

Choose personal or team workspace after login.

### Wireframe

```text
WorkspaceSelectPage
  HeadingRow
    Title
    Subtitle
    CreateWorkspaceButton
  WorkspaceGrid
    WorkspaceCard x N
```

### Workspace card contents

- name
- role badge
- member count
- recent project count
- open button

## 32. Workspace dashboard `/app/workspace/[workspaceSlug]`

### Purpose

Show projects and recent activity.

### Wireframe

```text
WorkspaceDashboardPage
  PageHeader
    Title
    CreateProjectButton
  StatsRow
    StatCard x 3
  ProjectGrid
    ProjectCard x N
  RecentActivityPanel
```

### Project card contents

- project name
- stage badge
- last updated
- latest selected wedge
- pending approvals count
- open project button

## 33. New project page `/projects/new`

### Purpose

Collect brief and create project.

### Layout

Single centered form with preview panel.

### Component hierarchy

```text
NewProjectPage
  PageHeader
    Title
    Subtitle
  TwoColumnLayout
    ProjectFormCard
      InputName
      TextareaSummary
      InputGoal
      InputWebsiteUrl
      InputRepoUrl
      TextareaAudienceHint
      SubmitButton
    LiveParsePreviewCard
      ParsedCategoryField
      ParsedAudienceField
      ParsedGoalField
```

### UX notes

On submit:
- create project
- enqueue bootstrap job
- redirect to project overview

## 34. Project overview `/projects/[projectSlug]`

### Purpose

This is the project home. It should show where the project currently stands.

### Layout

```text
ProjectOverviewPage
  Header
    ProjectTitle
    StageBadge
    RunNextStepButton
  OverviewGrid
    CurrentPositioningCard
    LaunchStatusCard
    PendingApprovalsCard
    MemoryHighlightsCard
  SourceDocsCard
  RecentAssetsCard
  TimelineCard
```

### Key behavior

If research has not been run yet, primary CTA is `Run Research`.
If positioning exists but execution does not, primary CTA is `Generate Launch Plan`.

## 35. Research page `/research`

### Purpose

Display competitor landscape and opportunity wedges.

### Layout

Use a board like analytical screen.

### Wireframe

```text
ResearchPage
  PageHeader
    Title
    RunResearchButton
    LastRunBadge
  FilterRow
    SearchInput
    SegmentFilter
    RefreshButton
  MainGrid
    CompetitorBoardCard
    PainPointMapCard
    OpportunityWedgesCard
    RiskWarningsCard
  BottomPanel
    ResearchNarrativeCard
```

### Competitor board component hierarchy

```text
CompetitorBoardCard
  CardHeader
    Title
    ExportButton
  CompetitorTable
    CompetitorRow x N
      NameCell
      PositioningCell
      PricingCell
      StrengthTags
      WeaknessTags
```

### Opportunity wedges component hierarchy

```text
OpportunityWedgesCard
  CardHeader
  WedgeCard x N
    WedgeTitle
    WedgeDescription
    ScoreBadge
    UseForPositioningButton
```

### UX notes

- user can trigger research rerun
- user can pin wedge candidates for positioning
- selecting wedges influences next page defaults

## 36. Positioning page `/positioning`

### Purpose

Show candidate ICPs and positioning outputs, then let user lock one direction.

### Layout

```text
PositioningPage
  Header
    Title
    RunPositioningButton
  MainTwoColumn
    LeftColumn
      CandidateICPsCard
      WedgeSelectionCard
    RightColumn
      PositioningPreviewCard
      PricingDirectionCard
      ObjectionHandlingCard
  FooterBar
    SaveAsSelectedButton
```

### Positioning preview component hierarchy

```text
PositioningPreviewCard
  CardHeader
  SelectedICPRow
  PositioningStatementBlock
  HeadlineBlock
  SubheadlineBlock
  BenefitsList
  CompareVersionsTabs
```

### UX notes

- show 2 to 3 candidate versions at most
- user can compare versions side by side
- selecting a version writes a visible timeline event and memory update

## 37. Execution page `/execution`

This is the most important screen.

### Purpose

Turn strategy into concrete tasks, drafts, assets, and supervised actions.

### Layout model

Use tabbed workspace with four major tabs and an always visible action queue summary.

```text
ExecutionPage
  Header
    Title
    GenerateAssetsButton
    PrepareEmailBatchButton
  ExecutionTabs
    PlanTab
    AssetsTab
    OutreachTab
    ExperimentsTab
  RightRail
    ActionQueueCard
    ApprovalSummaryCard
    KPIsCard
```

### Plan tab hierarchy

```text
PlanTab
  LaunchStrategyCard
    PrimaryChannel
    SecondaryChannels
    WhyText
  SevenDayPlanCard
    DayColumn x 7
      TaskItem x N
  MetricsCard
```

### Assets tab hierarchy

```text
AssetsTab
  AssetToolbar
    AssetTypeFilter
    GenerateDropdown
  AssetGrid
    AssetCard x N
      AssetPreview
      AssetTitle
      StatusBadge
      EditButton
      ApproveOrPromoteButton
```

### Outreach tab hierarchy

```text
OutreachTab
  ContactImportCard
    UploadCsvButton
    ManualAddButton
  OutreachTableCard
    ContactsTable
      Row x N
        NameCell
        SegmentCell
        PersonalizationReasonCell
        MessagePreviewCell
        StatusCell
  BatchActionsBar
    ApproveSelectedButton
    ExportSelectedButton
    SendSelectedButton
```

### Experiments tab hierarchy

```text
ExperimentsTab
  ActiveExperimentsCard
    ExperimentCard x N
  ResultsCard
  NextRecommendationCard
```

### Action queue card hierarchy

```text
ActionQueueCard
  CardHeader
  ActionItem x N
    ActionTitle
    TargetLabel
    ReasonText
    StatusBadge
    ViewButton
```

## 38. Approvals page `/approvals`

### Purpose

Central command center for all sensitive actions.

### Layout

```text
ApprovalsPage
  Header
    Title
  ApprovalList
    ApprovalCard x N
```

### Approval card hierarchy

```text
ApprovalCard
  CardHeader
    ActionTypeBadge
    StatusBadge
  Body
    ResourcePreview
    ReasonText
    RequiredScopeRow
    RequestedByRow
    AgentRow
  Footer
    EditButton
    ApproveButton
    RejectButton
```

### Sensitive action behavior

On approve:
- frontend checks if sensitive scope already present
- if not, trigger step up auth
- after return, retry approval endpoint

## 39. Memory page `/memory`

### Purpose

Make persistence visible.

### Layout

```text
MemoryPage
  Header
    Title
  MemorySections
    DecisionsCard
    PreferencesCard
    WinningHooksCard
    ObjectionsCard
    RejectedDirectionsCard
  TimelineCard
```

### UX note

This page is important for the Backboard sponsor narrative. The user should be able to see what the system has remembered.

## 40. Project settings page `/settings`

### Purpose

Project level metadata and integrations.

### Layout

```text
ProjectSettingsPage
  GeneralCard
  SourceDocsCard
  ConnectedAccountsCard
  DangerZoneCard
```

### Connected accounts card

Show:
- GitHub status
- Google status
- linked login methods
- token vault status if enabled

## 41. Security center `/app/settings/security`

### Purpose

Make Auth0 integration visible and credible.

### Layout

```text
SecurityCenterPage
  Header
    Title
  SecurityGrid
    SessionCard
    LinkedAccountsCard
    MFAStatusCard
    RecentSensitiveActionsCard
    WorkspaceRoleCard
```

### Session card contents

- provider used for current login
- passkey enrolled or not
- recent step up timestamp
- current workspace role

## 42. Shared frontend components

### Navigation and shell

```text
components/layout/
  app-shell.tsx
  top-bar.tsx
  left-sidebar.tsx
  right-rail.tsx
  breadcrumbs.tsx
```

### Generic UI

```text
components/ui/
  data-table.tsx
  stat-card.tsx
  empty-state.tsx
  loading-state.tsx
  status-badge.tsx
  confirm-dialog.tsx
```

### Domain components

```text
components/project/
  project-card.tsx
  source-docs-card.tsx
  memory-highlights-card.tsx

components/research/
  competitor-table.tsx
  pain-point-map.tsx
  wedge-card.tsx

components/positioning/
  icp-card.tsx
  positioning-preview.tsx
  pricing-direction-card.tsx

components/execution/
  plan-board.tsx
  asset-card.tsx
  outreach-table.tsx
  action-queue.tsx
  approval-card.tsx
```

## 43. Frontend state management

Use a simple model.

- route level data fetch on server where possible
- client components for interactive tables and tabs
- TanStack Query optional but not required for MVP
- Supabase realtime client in client components for live updates
- local optimistic state only for edits and approval interactions

## 44. API to frontend contract pattern

Use consistent envelope shape.

Success:

```json
{
  "data": {...},
  "meta": {...}
}
```

Error:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to send this batch"
  }
}
```

## 45. Bootstrap workflow

When project is first created:

1. insert project
2. insert brief
3. enqueue `project.bootstrap`
4. worker creates Backboard assistant and threads
5. worker stores ids in `agent_runtime`
6. worker seeds memory with project name, stage, goal
7. UI shows setup complete and enables Research

## 46. End to end main flow

```text
Create Project
  -> Bootstrap Backboard runtime
  -> Run Research
  -> Review wedges
  -> Run Positioning
  -> Select positioning
  -> Generate execution plan
  -> Generate assets
  -> Add contacts
  -> Prepare email batch
  -> Approve with step up
  -> Send batch
  -> View timeline and memory
```

## 47. Approval flow sequence

```text
User clicks Send Batch
  -> Frontend calls prepare endpoint if not prepared
  -> Backend creates outbound batch and approval record
  -> Approval card appears
  -> User clicks Approve
  -> Frontend requests elevated token if needed
  -> Auth0 step up happens
  -> Frontend calls approve endpoint with elevated token
  -> Backend marks approval approved
  -> Backend enqueues send job
  -> Worker sends through Resend
  -> Batch and messages update
  -> Timeline event written
```

## 48. Error handling rules

### User facing

- clear toast or inline banner
- no raw provider errors exposed
- retry button for failed jobs
- failed asset cards display error state
- failed sends show per recipient errors

### System side

- every external call wrapped in provider client
- transient provider errors retried once or twice
- permanent errors persisted to `job_runs.error_message`
- audit event written for failed sensitive actions

## 49. Logging and observability

Minimum needed for MVP:

- request id per API request
- user id and workspace id in logs
- project id in all job logs
- structured event logging JSON
- provider latency timing for Backboard, Google, and Resend

## 50. Security rules

### Core security constraints

- never expose service keys to browser
- only backend talks to Backboard, Google, Resend
- only backend uses Supabase service role
- browser uses Supabase anon key only for realtime subscriptions
- every project query filtered by workspace membership
- every sensitive action requires approval record and correct scope

### RLS strategy

For MVP, the browser does not directly mutate core tables. Mutations go through FastAPI.

RLS still enabled to reduce accidental exposure for realtime reads.

Recommended pattern:
- realtime exposed only for rows where `workspace_id` is in current user workspace memberships mirrored in a secure lookup table or through API mediated channels
- if RLS becomes complex during hackathon, keep browser reads through FastAPI and use polling fallback

## 51. Testing plan

### Backend tests

- token validation unit tests
- permission matrix tests
- project bootstrap tests
- research normalizer tests
- positioning selection tests
- approval gate tests
- resend send path mocked tests

### Frontend tests

- page render smoke tests
- approval flow interaction test
- execution tab state transitions
- auth protected route tests

### Demo seed data

Ship with one seeded demo project so judges can instantly see the full flow.

## 52. Deployment plan

### Web

Deploy Next.js on Vercel.

### API and worker

Deploy FastAPI and worker on Railway, Render, Fly.io, or any simple Python hosting.

### Database and storage

Supabase hosted project.

### Auth

Auth0 hosted tenant.

### Agent runtime and media providers

Backboard, Google Gemini API, Resend.

## 53. Build order

Build in this exact order.

### Phase 1

- monorepo setup
- Auth0 login in Next.js
- FastAPI skeleton
- Supabase schema and migrations
- workspace sync endpoint
- project creation flow

### Phase 2

- bootstrap Backboard assistant and threads
- project overview page
- research run endpoint and placeholder results
- research page UI

### Phase 3

- real Research Agent integration with Backboard
- positioning page and positioning generation
- select positioning action and memory write

### Phase 4

- execution plan generation
- assets generation for copy and static images
- execution workspace tabs

### Phase 5

- contacts upload
- email batch preparation
- approvals page
- Auth0 step up flow
- Resend send path

### Phase 6

- memory page
- security center
- optional video render

## 54. Hackathon cut line

If time gets tight, keep these and cut the rest.

Must keep:
- Auth0 login and step up
- Backboard assistant and thread memory
- research page
- positioning page
- execution page with launch plan and one asset type
- email batch prep and approval
- real send through Resend
- memory page

Cut first if needed:
- video rendering
- account linking UI
- connected accounts UI
- multiple asset variants
- experiments tab depth

## 55. Exact MVP demo script

1. Sign in with Auth0 using GitHub.
2. Choose workspace.
3. Create or open a project.
4. Show research results with competitors and wedges.
5. Show positioning output and select one version.
6. Show execution workspace with 7 day plan.
7. Generate image ad assets and email copy.
8. Upload 5 to 10 contacts.
9. Prepare email batch.
10. Open approvals page.
11. Approve send, triggering step up auth.
12. Send emails through Resend.
13. Refresh or re open the project and show memory and timeline.

## 56. Final implementation decisions

These are locked for MVP.

- monorepo with `apps/web` and `apps/api`
- Auth0 is the only end user identity provider
- Supabase Auth is not used
- FastAPI is the only backend API surface
- Supabase is canonical application state
- Backboard is assistant, thread, memory, and document context layer
- one Backboard assistant per project
- three primary Backboard threads per project
- Postgres backed job queue for MVP
- Resend is the only real outbound execution channel in MVP
- Google image generation is in MVP
- Google video rendering is optional but designed in
- all sensitive actions require approval and step up auth

## 57. Implementation checklist

### Infrastructure
- [ ] create monorepo
- [ ] create Supabase project
- [ ] create Auth0 tenant, app, API, roles, org support
- [ ] create Backboard API key
- [ ] create Google Gemini API key
- [ ] create Resend domain and API key

### Backend
- [ ] set up FastAPI app
- [ ] set up DB models and Alembic
- [ ] implement Auth0 JWT verification
- [ ] implement workspace sync
- [ ] implement project CRUD
- [ ] implement job queue and worker
- [ ] implement Backboard wrapper
- [ ] implement Research Agent
- [ ] implement Positioning Agent
- [ ] implement Execution Agent
- [ ] implement Resend sending
- [ ] implement Google image generation
- [ ] implement approval endpoints

### Frontend
- [ ] set up Next.js app shell
- [ ] integrate Auth0 SDK
- [ ] build workspace selector
- [ ] build dashboard
- [ ] build new project page
- [ ] build research page
- [ ] build positioning page
- [ ] build execution page
- [ ] build approvals page
- [ ] build memory page
- [ ] build security center

### Security
- [ ] configure Auth0 roles and scopes
- [ ] configure post login Action claims
- [ ] configure step up auth for send scope
- [ ] configure passkeys
- [ ] configure MFA

### Demo readiness
- [ ] seed demo project
- [ ] verify send flow works
- [ ] verify memory survives refresh
- [ ] verify step up blocks sensitive action without MFA

## 58. Summary

The MVP is a product workspace, not a chatbot. It should feel like a launch operating system for students and indie developers.

The central architecture choice is:
- Auth0 for trust, identity, permissions, and step up auth
- Supabase for product state and assets
- FastAPI for orchestration
- Backboard for persistent agent memory and threads
- Google for creative generation
- Resend for supervised outbound execution

That combination is the smallest architecture that still looks serious, agentic, and product complete.

# Deploy LaunchPilot (Vercel + Render)

This guide deploys:
- `apps/api` to Render (Docker web service)
- `apps/web` to Vercel (Next.js app)

## 1. Prerequisites

- Repo pushed to GitHub
- Backboard API key
- Auth0 config (if using `AUTH_MODE=auth0`)
- Optional Resend key (for real email sends)

## 2. Deploy API on Render

### Option A: Blueprint (recommended)

1. In Render, click `New` -> `Blueprint`.
2. Select this repo.
3. Render will detect [`render.yaml`](/Users/akamel/Code/launchpilot/render.yaml).
4. Click `Apply`.

This creates:
- Postgres database: `launchpilot-db`
- Web service: `launchpilot-api` using [`apps/api/Dockerfile`](/Users/akamel/Code/launchpilot/apps/api/Dockerfile)

### Option B: Manual service setup

1. `New` -> `PostgreSQL` (create DB).
2. `New` -> `Web Service` (connect repo).
3. Use:
   - Runtime: `Docker`
   - Dockerfile path: `apps/api/Dockerfile`
   - Docker context: repo root (`.`)
   - Health check path: `/v1/health`

### Required API environment variables

Set these on Render service:

- `SUPABASE_DB_URL`
- `WEB_APP_URL`
- `AUTH_MODE`
- `BACKBOARD_API_KEY`

Important for `SUPABASE_DB_URL`:
- Use a SQLAlchemy URL with psycopg driver:
- `postgresql+psycopg://USER:PASSWORD@HOST:PORT/DBNAME`
- If you copy Render's default DB URL, replace scheme with `postgresql+psycopg://`.

Recommended defaults:

- `AUTH_MODE=dev` (fastest path)
- `BACKBOARD_BASE_URL=https://app.backboard.io/api`
- `BACKBOARD_LLM_PROVIDER=openai`
- `BACKBOARD_MODEL_NAME=gpt-4o`
- `BACKBOARD_MEMORY_MODE=On`
- `RESEND_FROM_EMAIL=noreply@growthlaunchpad.app`

Optional:
- `RESEND_API_KEY` (if omitted, send path stays mock mode)

If `AUTH_MODE=auth0`, also set:
- `AUTH0_ISSUER`
- `AUTH0_AUDIENCE`
- `APP_JWT_NAMESPACE` (default: `https://growthlaunchpad.app`)
- `AUTH0_DOMAIN`
- `AUTH0_M2M_CLIENT_ID`
- `AUTH0_M2M_CLIENT_SECRET`
- `AUTH0_MANAGEMENT_AUDIENCE`

### Render runtime behavior

Container startup command (in Dockerfile):
- `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

So migrations run automatically on each deploy/start.

## 3. Deploy Web on Vercel

1. In Vercel, click `Add New` -> `Project`.
2. Import this repo.
3. Set **Root Directory** to `apps/web`.
4. Deploy.

### Required web environment variables

- `NEXT_PUBLIC_API_BASE_URL=https://<your-render-api-domain>/v1`
- `API_BASE_URL=https://<your-render-api-domain>/v1`
- `NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>`

If using Auth0 on web, also set:
- `APP_BASE_URL=https://<your-vercel-domain>`
- `AUTH0_SECRET`
- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_AUDIENCE` (must match API audience)
- Optional: `AUTH0_SCOPE`

## 4. Auth0 settings (only for `AUTH_MODE=auth0`)

Configure your Auth0 Application:
- Allowed Callback URLs:
  - `https://<your-vercel-domain>/auth/callback`
- Allowed Logout URLs:
  - `https://<your-vercel-domain>`
- Allowed Web Origins:
  - `https://<your-vercel-domain>`

Make sure API and web use matching `AUTH0_AUDIENCE` and issuer.

## 5. Final wiring checklist

1. Render API is healthy:
   - `GET https://<render-api>/v1/health` returns OK.
2. Render `WEB_APP_URL` exactly matches your Vercel origin.
3. Vercel `NEXT_PUBLIC_API_BASE_URL` points to Render `/v1`.
4. Re-deploy both services after env updates.

## 6. Smoke test flow

1. Open Vercel app.
2. Create project.
3. Run research.
4. Run positioning.
5. Run execution plan/assets.
6. Prepare outreach batch.
7. Approve and send.

If no `RESEND_API_KEY` is configured, send will run in mock mode by design.
