from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.routers import approvals, assets, execution, health, me, positioning, projects, research, workspaces

configure_logging()
settings = get_settings()

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_app_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and {"code", "message"}.issubset(exc.detail.keys()):
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": "HTTP_ERROR", "message": str(exc.detail)}},
    )


@app.get("/")
def root():
    return {"data": {"name": settings.app_name, "status": "ok"}, "meta": {}}


app.include_router(health.router, prefix="/v1")
app.include_router(me.router, prefix="/v1")
app.include_router(workspaces.router, prefix="/v1")
app.include_router(projects.router, prefix="/v1")
app.include_router(research.router, prefix="/v1")
app.include_router(positioning.router, prefix="/v1")
app.include_router(execution.router, prefix="/v1")
app.include_router(approvals.router, prefix="/v1")
app.include_router(assets.router, prefix="/v1")
