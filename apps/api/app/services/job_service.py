from __future__ import annotations

import socket
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import JobRun


class JobService:
    def __init__(self, db: Session):
        self.db = db
        self.worker_id = socket.gethostname()

    def enqueue(self, project_id, job_type: str, created_by=None, payload: dict | None = None) -> JobRun:
        job = JobRun(project_id=project_id, job_type=job_type, created_by=created_by, payload=payload or {})
        self.db.add(job)
        self.db.flush()
        return job

    def claim_next(self) -> JobRun | None:
        stmt = (
            select(JobRun)
            .where(JobRun.status == "queued")
            .order_by(JobRun.created_at.asc())
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        job = self.db.execute(stmt).scalar_one_or_none()
        if not job:
            return None
        now = datetime.now(timezone.utc)
        job.status = "running"
        job.locked_by = self.worker_id
        job.locked_at = now
        job.started_at = now
        self.db.flush()
        return job

    def mark_success(self, job: JobRun, result: dict | None = None) -> None:
        job.status = "succeeded"
        job.result = result or {}
        job.completed_at = datetime.now(timezone.utc)
        self.db.flush()

    def mark_failure(self, job: JobRun, error_message: str) -> None:
        job.status = "failed"
        job.error_message = error_message
        job.attempt_count = (job.attempt_count or 0) + 1
        job.completed_at = datetime.now(timezone.utc)
        self.db.flush()
