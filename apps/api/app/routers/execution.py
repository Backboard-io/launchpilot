from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.approval import Approval
from app.models.execution import Asset, Contact, OutboundBatch, OutboundMessage
from app.models.project import JobRun
from app.routers.utils import success
from app.schemas.execution import (
    AssetGenerationRequest,
    ContactsUpsertRequest,
    EmailBatchPrepareRequest,
    ExecutionPlanRequest,
)
from app.security.auth0 import CurrentUser
from app.security.permissions import require_scope
from app.services.job_service import JobService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects/{project_id}/execution", tags=["execution"])


@router.post("/plan")
def generate_execution_plan(
    project_id: UUID,
    payload: ExecutionPlanRequest,
    _scope: CurrentUser = Depends(require_scope("execution:run")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    job = JobService(db).enqueue(
        project_id,
        "execution.plan",
        payload={"positioning_version_id": str(payload.positioning_version_id) if payload.positioning_version_id else None},
    )
    db.commit()
    return success({"job_id": str(job.id)})


@router.post("/assets")
def generate_assets(
    project_id: UUID,
    payload: AssetGenerationRequest,
    _scope: CurrentUser = Depends(require_scope("execution:run")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    job = JobService(db).enqueue(project_id, "execution.generate_assets", payload=payload.model_dump())
    db.commit()
    return success({"job_id": str(job.id)})


@router.post("/contacts")
def upsert_contacts(
    project_id: UUID,
    payload: ContactsUpsertRequest,
    _scope: CurrentUser = Depends(require_scope("execution:run")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    inserted_ids = []
    for contact in payload.contacts:
        row = Contact(project_id=project_id, **contact.model_dump())
        db.add(row)
        db.flush()
        inserted_ids.append(str(row.id))
    db.commit()
    return success({"contact_ids": inserted_ids})


@router.post("/email-batch/prepare")
def prepare_email_batch(
    project_id: UUID,
    payload: EmailBatchPrepareRequest,
    _scope: CurrentUser = Depends(require_scope("execution:run")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    job = JobService(db).enqueue(project_id, "execution.prepare_email_batch", payload=payload.model_dump())
    db.commit()
    return success({"job_id": str(job.id)})


@router.post("/email-batch/{batch_id}/send")
def send_email_batch(
    project_id: UUID,
    batch_id: UUID,
    _scope: CurrentUser = Depends(require_scope("execution:send")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)

    batch = db.query(OutboundBatch).filter(OutboundBatch.id == batch_id, OutboundBatch.project_id == project_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    approval = (
        db.query(Approval)
        .filter(
            Approval.project_id == project_id,
            Approval.resource_type == "outbound_batch",
            Approval.resource_id == batch_id,
            Approval.status == "approved",
        )
        .first()
    )
    if not approval:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Batch not approved")

    job = JobService(db).enqueue(project_id, "execution.send_email_batch", payload={"batch_id": str(batch_id)})
    db.commit()
    return success({"job_id": str(job.id), "batch_id": str(batch_id), "status": "queued"})


@router.get("/state")
def get_execution_state(
    project_id: UUID,
    _scope: CurrentUser = Depends(require_scope("project:read")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    assets = db.query(Asset).filter(Asset.project_id == project_id).order_by(Asset.created_at.desc()).all()
    contacts = db.query(Contact).filter(Contact.project_id == project_id).all()
    batches = db.query(OutboundBatch).filter(OutboundBatch.project_id == project_id).order_by(OutboundBatch.created_at.desc()).all()
    messages = (
        db.query(OutboundMessage)
        .join(OutboundBatch, OutboundMessage.batch_id == OutboundBatch.id)
        .filter(OutboundBatch.project_id == project_id)
        .all()
    )
    jobs = (
        db.query(JobRun)
        .filter(JobRun.project_id == project_id, JobRun.job_type.like("execution.%"))
        .order_by(JobRun.created_at.desc())
        .limit(10)
        .all()
    )

    return success(
        {
            "assets": [
                {
                    "id": str(a.id),
                    "asset_type": a.asset_type,
                    "status": a.status,
                    "title": a.title,
                    "content": a.content,
                    "storage_path": a.storage_path,
                }
                for a in assets
            ],
            "contacts": [{"id": str(c.id), "name": c.name, "email": c.email, "segment": c.segment} for c in contacts],
            "batches": [
                {
                    "id": str(b.id),
                    "status": b.status,
                    "subject_line": b.subject_line,
                    "send_count": b.send_count,
                    "approved_at": b.approved_at,
                    "sent_at": b.sent_at,
                }
                for b in batches
            ],
            "messages": [
                {
                    "id": str(m.id),
                    "batch_id": str(m.batch_id),
                    "status": m.status,
                    "subject": m.subject,
                    "error_message": m.error_message,
                }
                for m in messages
            ],
            "recent_jobs": [{"id": str(j.id), "type": j.job_type, "status": j.status, "error": j.error_message} for j in jobs],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    )
