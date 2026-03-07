from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.positioning import PositioningVersion
from app.models.project import JobRun, ProjectMemory
from app.routers.utils import success
from app.schemas.positioning import PositioningRunRequest
from app.security.auth0 import CurrentUser
from app.security.permissions import require_scope
from app.services.job_service import JobService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects/{project_id}/positioning", tags=["positioning"])


@router.post("/run")
def queue_positioning_run(
    project_id: UUID,
    payload: PositioningRunRequest,
    _scope: CurrentUser = Depends(require_scope("positioning:run")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    job = JobService(db).enqueue(project_id, "positioning.run", payload=payload.model_dump())
    db.commit()
    return success({"job_id": str(job.id)})


@router.get("")
def get_positioning(
    project_id: UUID,
    _scope: CurrentUser = Depends(require_scope("project:read")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    versions = (
        db.query(PositioningVersion)
        .filter(PositioningVersion.project_id == project_id)
        .order_by(PositioningVersion.created_at.desc())
        .all()
    )
    jobs = (
        db.query(JobRun)
        .filter(JobRun.project_id == project_id, JobRun.job_type == "positioning.run")
        .order_by(JobRun.created_at.desc())
        .limit(5)
        .all()
    )
    return success(
        {
            "versions": [
                {
                    "id": str(v.id),
                    "selected": v.selected,
                    "icp": v.icp,
                    "wedge": v.wedge,
                    "positioning_statement": v.positioning_statement,
                    "headline": v.headline,
                    "subheadline": v.subheadline,
                    "benefits": v.benefits,
                    "pricing_direction": v.pricing_direction,
                    "objection_handling": v.objection_handling,
                }
                for v in versions
            ],
            "recent_jobs": [{"id": str(j.id), "status": j.status, "error": j.error_message} for j in jobs],
        }
    )


@router.post("/select/{version_id}")
def select_positioning_version(
    project_id: UUID,
    version_id: UUID,
    _scope: CurrentUser = Depends(require_scope("positioning:run")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    version = (
        db.query(PositioningVersion)
        .filter(PositioningVersion.project_id == project_id, PositioningVersion.id == version_id)
        .first()
    )
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Positioning version not found")

    db.execute(update(PositioningVersion).where(PositioningVersion.project_id == project_id).values(selected=False))
    version.selected = True

    memory = (
        db.query(ProjectMemory)
        .filter(ProjectMemory.project_id == project_id, ProjectMemory.memory_key == "selected_positioning")
        .first()
    )
    memory_value = {
        "version_id": str(version.id),
        "icp": version.icp,
        "wedge": version.wedge,
        "headline": version.headline,
    }
    if memory:
        memory.memory_value = memory_value
        memory.memory_type = "decision"
        memory.source = "user"
    else:
        db.add(
            ProjectMemory(
                project_id=project_id,
                memory_key="selected_positioning",
                memory_value=memory_value,
                memory_type="decision",
                source="user",
            )
        )
    db.commit()
    return success({"selected_version_id": str(version.id)})
