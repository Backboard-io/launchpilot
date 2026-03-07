from sqlalchemy.orm import Session

from app.models.approval import ActivityEvent


class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def log(
        self,
        project_id,
        actor_type: str,
        actor_id: str | None,
        verb: str,
        object_type: str | None = None,
        object_id: str | None = None,
        metadata: dict | None = None,
    ) -> ActivityEvent:
        event = ActivityEvent(
            project_id=project_id,
            actor_type=actor_type,
            actor_id=actor_id,
            verb=verb,
            object_type=object_type,
            object_id=object_id,
            metadata=metadata or {},
        )
        self.db.add(event)
        self.db.flush()
        return event
