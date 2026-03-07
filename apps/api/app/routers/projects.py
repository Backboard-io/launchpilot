from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project, ProjectBrief, ProjectSource
from app.models.approval import ActivityEvent
from app.models.project import ProjectMemory
from app.models.workspace import User
from app.routers.utils import success
from app.schemas.project import ProjectBriefUpsertRequest, ProjectCreateRequest, ProjectSourceCreateRequest
from app.security.auth0 import CurrentUser, get_current_user
from app.security.permissions import require_scope
from app.services.job_service import JobService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("")
def create_project(
    payload: ProjectCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    _scope: CurrentUser = Depends(require_scope("project:write")),
    db: Session = Depends(get_db),
):
    project_service = ProjectService(db)
    project_service.ensure_workspace_access(payload.workspace_id, current_user)

    actor = db.query(User).filter(User.auth0_user_id == current_user.sub).first()
    slug = project_service.next_available_project_slug(payload.workspace_id, payload.name)

    project = Project(
        workspace_id=payload.workspace_id,
        name=payload.name,
        slug=slug,
        summary=payload.summary,
        goal=payload.goal,
        website_url=payload.website_url,
        repo_url=payload.repo_url,
        target_market_hint=payload.target_market_hint,
        created_by=actor.id if actor else None,
    )
    db.add(project)
    db.flush()

    job = JobService(db).enqueue(project.id, "project.bootstrap", created_by=actor.id if actor else None)
    db.commit()
    return success({"project_id": str(project.id), "job_id": str(job.id)})


@router.get("/{project_id}")
def get_project(
    project_id: UUID,
    _scope: CurrentUser = Depends(require_scope("project:read")),
    db: Session = Depends(get_db),
):
    project = ProjectService(db).get_project_or_404(project_id)
    return success(
        {
            "id": str(project.id),
            "workspace_id": str(project.workspace_id),
            "name": project.name,
            "slug": project.slug,
            "summary": project.summary,
            "stage": project.stage,
            "goal": project.goal,
            "website_url": project.website_url,
            "repo_url": project.repo_url,
            "status": project.status,
        }
    )


@router.post("/{project_id}/brief")
def upsert_project_brief(
    project_id: UUID,
    payload: ProjectBriefUpsertRequest,
    _scope: CurrentUser = Depends(require_scope("project:write")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    brief = (
        db.query(ProjectBrief)
        .filter(ProjectBrief.project_id == project_id)
        .order_by(ProjectBrief.created_at.desc())
        .first()
    )
    if brief:
        brief.raw_brief = payload.raw_brief
        brief.parsed_problem = payload.parsed_problem
        brief.parsed_audience = payload.parsed_audience
        brief.parsed_constraints = payload.parsed_constraints
    else:
        brief = ProjectBrief(
            project_id=project_id,
            raw_brief=payload.raw_brief,
            parsed_problem=payload.parsed_problem,
            parsed_audience=payload.parsed_audience,
            parsed_constraints=payload.parsed_constraints,
        )
        db.add(brief)
    db.commit()
    return success({"brief_id": str(brief.id)})


@router.post("/{project_id}/sources")
def add_project_source(
    project_id: UUID,
    payload: ProjectSourceCreateRequest,
    _scope: CurrentUser = Depends(require_scope("project:write")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    source = ProjectSource(
        project_id=project_id,
        source_type=payload.source_type,
        url=payload.url,
        storage_path=payload.storage_path,
        title=payload.title,
    )
    db.add(source)
    db.commit()
    return success({"source_id": str(source.id)})


@router.get("/{project_id}/memory")
def get_project_memory(
    project_id: UUID,
    _scope: CurrentUser = Depends(require_scope("project:read")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    memory_rows = (
        db.query(ProjectMemory)
        .filter(ProjectMemory.project_id == project_id)
        .order_by(ProjectMemory.updated_at.desc())
        .all()
    )
    return success(
        [
            {
                "id": str(row.id),
                "key": row.memory_key,
                "value": row.memory_value,
                "memory_type": row.memory_type,
                "source": row.source,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
            }
            for row in memory_rows
        ]
    )


@router.get("/{project_id}/activity")
def get_project_activity(
    project_id: UUID,
    _scope: CurrentUser = Depends(require_scope("project:read")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    rows = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.project_id == project_id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(100)
        .all()
    )
    return success(
        [
            {
                "id": str(row.id),
                "actor_type": row.actor_type,
                "actor_id": row.actor_id,
                "verb": row.verb,
                "object_type": row.object_type,
                "object_id": row.object_id,
                "metadata": row.event_metadata,
                "created_at": row.created_at,
            }
            for row in rows
        ]
    )
