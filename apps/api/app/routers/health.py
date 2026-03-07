from fastapi import APIRouter

from app.routers.utils import success

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health() -> dict:
    return success({"status": "ok"})
