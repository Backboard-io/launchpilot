from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.workspace import User, Workspace, WorkspaceMember
from app.security.auth0 import CurrentUser


class Auth0AdminSync:
    def __init__(self, db: Session):
        self.db = db

    def sync_user_and_workspace(self, current_user: CurrentUser) -> dict:
        user = self.db.query(User).filter(User.auth0_user_id == current_user.sub).first()
        if not user:
            user = User(
                auth0_user_id=current_user.sub,
                email=current_user.email or "unknown@example.com",
                name=current_user.name,
            )
            self.db.add(user)
            self.db.flush()

        workspace = None
        if current_user.org_id:
            workspace = self.db.query(Workspace).filter(Workspace.auth0_org_id == current_user.org_id).first()
            if not workspace:
                slug = current_user.org_id.replace("org_", "workspace-")
                workspace = Workspace(
                    auth0_org_id=current_user.org_id,
                    name=f"Workspace {current_user.org_id[-6:]}",
                    slug=slug,
                    owner_user_id=user.id,
                )
                self.db.add(workspace)
                self.db.flush()

            member = (
                self.db.query(WorkspaceMember)
                .filter(WorkspaceMember.workspace_id == workspace.id, WorkspaceMember.user_id == user.id)
                .first()
            )
            if not member:
                member = WorkspaceMember(
                    workspace_id=workspace.id,
                    user_id=user.id,
                    role=current_user.workspace_role or "owner",
                    status="active",
                )
                self.db.add(member)
                self.db.flush()

        return {
            "user_id": str(user.id),
            "workspace_id": str(workspace.id) if workspace else None,
        }
