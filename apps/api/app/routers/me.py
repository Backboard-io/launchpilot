from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.workspace import WorkspaceMember
from app.routers.utils import success
from app.security.auth import CurrentUser, get_current_user
from app.services.project_service import ProjectService

router = APIRouter(prefix="/me", tags=["me"])


@router.get("")
def get_me(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = get_settings()
    project_service = ProjectService(db)
    user = project_service.get_or_create_local_user(current_user)
    workspace = project_service.get_or_create_default_workspace(user)

    membership = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace.id, WorkspaceMember.user_id == user.id)
        .first()
    )

    db.commit()

    admin_emails_set = {e.strip().lower() for e in settings.admin_emails.split(",") if e.strip()}
    is_admin = (current_user.email or "").lower() in admin_emails_set

    return success(
        {
            "id": str(user.id),
            "sub": current_user.sub,
            "email": current_user.email,
            "name": current_user.name,
            "is_admin": is_admin,
            "scopes": sorted(current_user.scopes),
            "default_workspace": {
                "workspace_id": str(workspace.id),
                "workspace_name": workspace.name,
                "workspace_slug": workspace.slug,
                "role": membership.role if membership else "owner",
            },
            "feature_flags": {
                "auth_mode": settings.auth_mode,
                "enable_oauth": settings.auth_mode == "oauth",
            },
        }
    )
