from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.execution import Asset
from app.models.project import ProjectMemory
from app.routers.utils import success
from app.security.auth0 import CurrentUser
from app.security.permissions import require_scope

router = APIRouter(tags=["assets"])


@router.get("/projects/{project_id}/assets")
def list_assets(
    project_id: UUID,
    _scope: CurrentUser = Depends(require_scope("project:read")),
    db: Session = Depends(get_db),
):
    rows = db.query(Asset).filter(Asset.project_id == project_id).order_by(Asset.created_at.desc()).all()
    return success(
        [
            {
                "id": str(a.id),
                "asset_type": a.asset_type,
                "status": a.status,
                "title": a.title,
                "content": a.content,
                "storage_path": a.storage_path,
                "created_at": a.created_at,
            }
            for a in rows
        ]
    )


@router.post("/assets/{asset_id}/promote")
def promote_asset(
    asset_id: UUID,
    _scope: CurrentUser = Depends(require_scope("execution:run")),
    db: Session = Depends(get_db),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    asset.status = "selected"
    memory_key = f"selected_asset_{asset.asset_type}"
    memory = (
        db.query(ProjectMemory)
        .filter(ProjectMemory.project_id == asset.project_id, ProjectMemory.memory_key == memory_key)
        .first()
    )
    memory_value = {"asset_id": str(asset.id), "title": asset.title, "asset_type": asset.asset_type}
    if memory:
        memory.memory_value = memory_value
        memory.memory_type = "decision"
        memory.source = "user"
    else:
        db.add(
            ProjectMemory(
                project_id=asset.project_id,
                memory_key=memory_key,
                memory_value=memory_value,
                memory_type="decision",
                source="user",
            )
        )
    db.commit()
    return success({"asset_id": str(asset.id), "status": asset.status})
