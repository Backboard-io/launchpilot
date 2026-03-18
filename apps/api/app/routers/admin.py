from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.approval import ActivityEvent, Approval
from app.models.project import Project, ProjectBrief, ProjectMemory, ProjectSource
from app.models.workspace import User, Workspace, WorkspaceMember
from app.services.project_service import ProjectService
from app.routers.utils import success
from app.schemas.admin import (
    AdminProjectBriefOut,
    AdminProjectUpdateRequest,
    AdminUserOut,
    AdminUserUpdateRequest,
    AdminWorkspaceDetailOut,
    AdminWorkspaceMemberAddRequest,
    AdminWorkspaceMemberOut,
    AdminWorkspaceOut,
)
from app.security.auth import CurrentUser, get_current_user
from app.security.permissions import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def list_users(
    _admin: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.email).all()
    return success(
        [
            AdminUserOut(
                id=str(u.id),
                email=u.email,
                name=u.name,
                auth0_user_id=u.auth0_user_id,
            )
            for u in users
        ]
    )


@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    payload: AdminUserUpdateRequest,
    _admin: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None:
        user.email = payload.email
    db.commit()
    return success(
        AdminUserOut(
            id=str(user.id),
            email=user.email,
            name=user.name,
            auth0_user_id=user.auth0_user_id,
        )
    )


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    _admin: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    # Clear references so delete can succeed
    db.query(Workspace).filter(Workspace.owner_user_id == user_id).update({Workspace.owner_user_id: None})
    db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user_id).delete()
    db.query(Approval).filter(Approval.requested_by == user_id).update({Approval.requested_by: None})
    db.query(Approval).filter(Approval.approved_by == user_id).update({Approval.approved_by: None})
    db.delete(user)
    db.commit()
    return success({"deleted": True})


@router.get("/projects")
def list_projects(
    _admin: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    projects = db.query(Project).order_by(Project.name).all()
    return success(
        [
            AdminProjectBriefOut(
                id=str(p.id),
                name=p.name,
                slug=p.slug,
                stage=p.stage,
                status=p.status,
                workspace_id=str(p.workspace_id),
            )
            for p in projects
        ]
    )


@router.patch("/projects/{project_id}")
def update_project(
    project_id: UUID,
    payload: AdminProjectUpdateRequest,
    _admin: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id.hex).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if payload.name is not None:
        project.name = payload.name
    if payload.slug is not None:
        project.slug = payload.slug
    if payload.status is not None:
        project.status = payload.status
    if payload.workspace_id is not None:
        project_service = ProjectService(db)
        new_slug = project_service.next_available_project_slug(payload.workspace_id, project.name)
        project.workspace_id = payload.workspace_id
        project.slug = new_slug
    db.commit()
    return success(
        AdminProjectBriefOut(
            id=str(project.id),
            name=project.name,
            slug=project.slug,
            stage=project.stage,
            status=project.status,
            workspace_id=str(project.workspace_id),
        )
    )


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: UUID,
    _admin: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id.hex).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    db.query(ProjectMemory).filter(ProjectMemory.project_id == project.id).delete()
    db.query(ProjectSource).filter(ProjectSource.project_id == project.id).delete()
    db.query(ProjectBrief).filter(ProjectBrief.project_id == project.id).delete()
    db.query(ActivityEvent).filter(ActivityEvent.project_id == project.id).delete()
    db.delete(project)
    db.commit()
    return success({"deleted": True})


@router.delete("/workspaces/{workspace_id}")
def delete_workspace(
    workspace_id: UUID,
    _admin: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id.hex).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    projects = db.query(Project).filter(Project.workspace_id == workspace.id).all()
    for project in projects:
        db.query(ProjectMemory).filter(ProjectMemory.project_id == project.id).delete()
        db.query(ProjectSource).filter(ProjectSource.project_id == project.id).delete()
        db.query(ProjectBrief).filter(ProjectBrief.project_id == project.id).delete()
        db.query(ActivityEvent).filter(ActivityEvent.project_id == project.id).delete()
        db.delete(project)
    db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace.id).delete()
    db.delete(workspace)
    db.commit()
    return success({"deleted": True})


@router.get("/workspaces")
def list_workspaces(
    _admin: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    workspaces = db.query(Workspace).order_by(Workspace.name).all()
    result = []
    for ws in workspaces:
        project_count = db.query(func.count(Project.id)).filter(Project.workspace_id == ws.id).scalar() or 0
        member_count = (
            db.query(func.count(WorkspaceMember.id)).filter(WorkspaceMember.workspace_id == ws.id).scalar() or 0
        )
        result.append(
            AdminWorkspaceOut(
                id=str(ws.id),
                name=ws.name,
                slug=ws.slug,
                owner_user_id=str(ws.owner_user_id) if ws.owner_user_id else None,
                project_count=project_count,
                member_count=member_count,
            )
        )
    return success(result)


@router.get("/workspaces/{workspace_id}")
def get_workspace(
    workspace_id: UUID,
    _admin: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id.hex).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    projects = (
        db.query(Project)
        .filter(Project.workspace_id == workspace.id)
        .order_by(Project.name)
        .all()
    )
    members = (
        db.query(WorkspaceMember, User)
        .join(User, User.id == WorkspaceMember.user_id)
        .filter(WorkspaceMember.workspace_id == workspace.id)
        .all()
    )

    return success(
        AdminWorkspaceDetailOut(
            id=str(workspace.id),
            name=workspace.name,
            slug=workspace.slug,
            owner_user_id=str(workspace.owner_user_id) if workspace.owner_user_id else None,
            projects=[
                AdminProjectBriefOut(
                    id=str(p.id),
                    name=p.name,
                    slug=p.slug,
                    stage=p.stage,
                    status=p.status,
                )
                for p in projects
            ],
            members=[
                AdminWorkspaceMemberOut(
                    user_id=str(m.user_id),
                    email=u.email,
                    name=u.name,
                    role=m.role,
                    status=m.status,
                )
                for m, u in members
            ],
        )
    )


@router.post("/workspaces/{workspace_id}/members")
def add_workspace_member(
    workspace_id: UUID,
    payload: AdminWorkspaceMemberAddRequest,
    _admin: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id.hex).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id.hex,
            WorkspaceMember.user_id == payload.user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this workspace",
        )

    membership = WorkspaceMember(
        workspace_id=workspace_id.hex,
        user_id=payload.user_id,
        role=payload.role,
        status="active",
    )
    db.add(membership)
    db.commit()
    return success({"workspace_id": workspace_id.hex, "user_id": payload.user_id, "role": payload.role})


@router.delete("/workspaces/{workspace_id}/members/{user_id}")
def remove_workspace_member(
    workspace_id: UUID,
    user_id: str,
    _admin: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    membership = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id.hex,
            WorkspaceMember.user_id == user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")

    db.delete(membership)
    db.commit()
    return success({"removed": True})
