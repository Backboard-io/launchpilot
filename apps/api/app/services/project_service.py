from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.workspace import Workspace, WorkspaceMember
from app.security.auth0 import CurrentUser


class ProjectService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def slugify(name: str) -> str:
        value = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
        return value or "project"

    def next_available_project_slug(self, workspace_id, name: str) -> str:
        base = self.slugify(name)
        slug = base
        suffix = 2
        while (
            self.db.query(Project)
            .filter(Project.workspace_id == workspace_id, Project.slug == slug)
            .first()
            is not None
        ):
            slug = f"{base}-{suffix}"
            suffix += 1
        return slug

    def ensure_workspace_access(self, workspace_id, current_user: CurrentUser) -> None:
        if current_user.org_id:
            workspace = self.db.query(Workspace).filter(Workspace.id == workspace_id).first()
            if not workspace:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
            if workspace.auth0_org_id and workspace.auth0_org_id != current_user.org_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Workspace access denied")
            return
        membership = self.db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).first()
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Workspace access denied")

    def get_project_or_404(self, project_id):
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project
