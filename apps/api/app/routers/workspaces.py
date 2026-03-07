from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.integrations.auth0_admin import Auth0AdminSync
from app.models.workspace import User, Workspace, WorkspaceMember
from app.routers.utils import success
from app.security.auth0 import CurrentUser, get_current_user
from app.security.permissions import require_scope

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("")
def list_workspaces(
    _user_scope: CurrentUser = Depends(require_scope("project:read")),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sync = Auth0AdminSync(db)
    sync.sync_user_and_workspace(current_user)

    local_user = db.query(User).filter(User.auth0_user_id == current_user.sub).first()
    if not local_user:
        return success([])

    rows = (
        db.query(Workspace, WorkspaceMember)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .filter(WorkspaceMember.user_id == local_user.id)
        .all()
    )
    data = [
        {
            "id": str(workspace.id),
            "name": workspace.name,
            "slug": workspace.slug,
            "role": member.role,
        }
        for workspace, member in rows
    ]
    return success(data)


@router.post("/sync")
def sync_workspaces(
    current_user: CurrentUser = Depends(get_current_user),
    _scope: CurrentUser = Depends(require_scope("admin:workspace")),
    db: Session = Depends(get_db),
):
    sync = Auth0AdminSync(db)
    data = sync.sync_user_and_workspace(current_user)
    db.commit()
    return success(data)
