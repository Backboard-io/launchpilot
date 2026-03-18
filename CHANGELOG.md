# Changelog

## [1.0.0] - 2025-03-18

First stable release after fork. Summary of changes since the original hackathon MVP:

### Auth & identity
- **NextAuth** replaces Auth0: Google and GitHub OAuth via NextAuth; JWT verification in API with `AUTH_JWT_SECRET` and optional connector credentials for Google/GitHub linking.
- Removed Auth0-specific connectors and routes; added `auth.py`, connector OAuth routes, and NextAuth route handlers.

### Execution & UX
- **Execution plan UX**: Refactored execution view with work-items board (lanes and cards), task drawer (evidence, category), and execution tabs.
- Plans support **task assignee** and **positioning version**; new migrations for task evidence/category and launch task assignee.

### Connectors & credentials
- **Connector model** and migrations for storing OAuth connector credentials.
- Connector service and OAuth callback routes; optional `CONNECTOR_GOOGLE_*` / `CONNECTOR_GITHUB_*` env for production linking.

### Admin & leaderboard
- **Admin screen**: Workspace and project access management; default admin in dev mode; `ADMIN_EMAILS` for production.
- **Leaderboard** API and demo seed scripts.

### Infra & tooling
- **Terraform**: App Runner, ECR, SSM secrets modules; bootstrap state bucket.
- **Scripts**: `build.sh`, `start.sh`, smoke and seed scripts.
- **API**: `uv`/pyproject, Litestream config, Docker and docker-compose updates.
- Session and config updates; Backboard integration refinements.

### Database
- Migrations: `0004` task evidence/category, `0005` connector credentials, `0006` launch task assignee.
