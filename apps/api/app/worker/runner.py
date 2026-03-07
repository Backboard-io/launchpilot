from __future__ import annotations

import logging
import time

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.session import SessionLocal
from app.services.job_service import JobService
from app.worker.handlers import WorkerHandlers


logger = logging.getLogger(__name__)


def run_worker() -> None:
    configure_logging()
    settings = get_settings()
    logger.info("worker.start")

    while True:
        with SessionLocal() as db:
            job_service = JobService(db)
            job = job_service.claim_next()
            if not job:
                db.commit()
                time.sleep(settings.worker_poll_interval_seconds)
                continue

            handlers = WorkerHandlers(db)
            try:
                result = handlers.handle(job.job_type, job.project_id, job.payload or {})
                job_service.mark_success(job, result)
                db.commit()
                logger.info("worker.job_succeeded job_id=%s type=%s", job.id, job.job_type)
            except Exception as exc:  # noqa: BLE001
                job_service.mark_failure(job, str(exc))
                db.commit()
                logger.exception("worker.job_failed job_id=%s type=%s", job.id, job.job_type)


def main() -> None:
    run_worker()


if __name__ == "__main__":
    main()
