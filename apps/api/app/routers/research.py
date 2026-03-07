from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import JobRun
from app.models.research import Competitor, OpportunityWedge, PainPointCluster, ResearchRun
from app.routers.utils import success
from app.schemas.research import ResearchRunRequest
from app.security.auth0 import CurrentUser
from app.security.permissions import require_scope
from app.services.job_service import JobService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects/{project_id}/research", tags=["research"])


@router.post("/run")
def queue_research_run(
    project_id: UUID,
    payload: ResearchRunRequest,
    _scope: CurrentUser = Depends(require_scope("research:run")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    run = ResearchRun(project_id=project_id, status="queued")
    db.add(run)
    job = JobService(db).enqueue(project_id, "research.run", payload=payload.model_dump())
    db.commit()
    return success({"research_run_id": str(run.id), "job_id": str(job.id)})


@router.get("")
def get_research_snapshot(
    project_id: UUID,
    _scope: CurrentUser = Depends(require_scope("project:read")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    latest_run = (
        db.query(ResearchRun)
        .filter(ResearchRun.project_id == project_id)
        .order_by(ResearchRun.created_at.desc())
        .first()
    )
    competitors = db.query(Competitor).filter(Competitor.project_id == project_id).all()
    pains = db.query(PainPointCluster).filter(PainPointCluster.project_id == project_id).all()
    wedges = db.query(OpportunityWedge).filter(OpportunityWedge.project_id == project_id).all()
    jobs = (
        db.query(JobRun)
        .filter(JobRun.project_id == project_id, JobRun.job_type == "research.run")
        .order_by(JobRun.created_at.desc())
        .limit(5)
        .all()
    )
    return success(
        {
            "run": {
                "id": str(latest_run.id) if latest_run else None,
                "status": latest_run.status if latest_run else "not_started",
                "summary": latest_run.summary if latest_run else None,
                "saturation_score": float(latest_run.saturation_score or 0) if latest_run else None,
            },
            "competitors": [
                {
                    "id": str(c.id),
                    "name": c.name,
                    "url": c.url,
                    "category": c.category,
                    "positioning": c.positioning,
                    "pricing_summary": c.pricing_summary,
                    "strengths": c.strengths,
                    "weaknesses": c.weaknesses,
                }
                for c in competitors
            ],
            "pain_point_clusters": [
                {
                    "id": str(p.id),
                    "label": p.label,
                    "description": p.description,
                    "rank": p.rank,
                    "evidence": p.evidence,
                }
                for p in pains
            ],
            "opportunity_wedges": [
                {
                    "id": str(w.id),
                    "label": w.label,
                    "description": w.description,
                    "score": float(w.score or 0),
                    "status": w.status,
                }
                for w in wedges
            ],
            "recent_jobs": [{"id": str(j.id), "status": j.status, "error": j.error_message} for j in jobs],
        }
    )
