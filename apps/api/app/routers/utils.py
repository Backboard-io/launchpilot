from fastapi import HTTPException, status


def success(data, meta: dict | None = None) -> dict:
    return {"data": data, "meta": meta or {}}


def error(code: str, message: str, http_status: int = status.HTTP_400_BAD_REQUEST):
    raise HTTPException(status_code=http_status, detail={"code": code, "message": message})
