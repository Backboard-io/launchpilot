from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.integrations.auth0_admin import Auth0AdminSync
from app.models.workspace import User, Workspace, WorkspaceMember
from app.routers.utils import success
from app.security.auth0 import CurrentUser, get_current_user

router = APIRouter(prefix="/me", tags=["me"])


@router.get("")
def get_me(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    sync = Auth0AdminSync(db)
    sync.sync_user_and_workspace(current_user)

    local_user = db.query(User).filter(User.auth0_user_id == current_user.sub).first()
    if not local_user:
        return success(
            {
                "sub": current_user.sub,
                "email": current_user.email,
                "name": current_user.name,
                "org_id": current_user.org_id,
                "workspace_role": current_user.workspace_role,
                "scopes": sorted(current_user.scopes),
                "memberships": [],
                "feature_flags": {
                    "enable_video_render": True,
                    "enable_token_vault": False,
                },
            }
        )

    rows = (
        db.query(Workspace, WorkspaceMember)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .filter(WorkspaceMember.user_id == local_user.id)
        .all()
    )
    memberships = [
        {
            "workspace_id": str(workspace.id),
            "workspace_name": workspace.name,
            "workspace_slug": workspace.slug,
            "role": member.role,
        }
        for workspace, member in rows
    ]
    return success(
        {
            "sub": current_user.sub,
            "email": current_user.email,
            "name": current_user.name,
            "org_id": current_user.org_id,
            "workspace_role": current_user.workspace_role,
            "scopes": sorted(current_user.scopes),
            "memberships": memberships,
            "feature_flags": {
                "enable_video_render": True,
                "enable_token_vault": False,
            },
        }
    )
