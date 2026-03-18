from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import quote
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.integrations.github_client import GitHubClient
from app.routers.connector_oauth import decode_connector_state, encode_connector_state
from app.routers.utils import success
from app.security.auth import CurrentUser, get_current_user
from app.security.permissions import require_scope
from app.services.connector_service import (
    get_github_access_token,
    get_github_status,
    get_google_access_token,
    get_google_status,
    upsert_connector_credentials,
)
from app.services.memory_service import upsert_project_memory
from app.services.project_service import ProjectService

router = APIRouter(tags=["connectors"])
oauth_router = APIRouter(tags=["connectors"])

REDIRECT_PATH = "/app/settings/security"


def _expires_at(expires_in: int | None) -> datetime | None:
    if not expires_in:
        return None
    from datetime import timedelta
    return datetime.now(timezone.utc).replace(microsecond=0) + timedelta(seconds=expires_in)


@router.get("/connectors/github/status")
def github_status(
    current_user: CurrentUser = Depends(get_current_user),
    _scope: CurrentUser = Depends(require_scope("connector:link")),
    db: Session = Depends(get_db),
):
    return success(get_github_status(db, current_user.sub))


@router.get("/connectors/github/link-url")
def github_link_url(
    current_user: CurrentUser = Depends(get_current_user),
    _scope: CurrentUser = Depends(require_scope("connector:link")),
):
    settings = get_settings()
    base = settings.api_base_url.rstrip("/")
    state = encode_connector_state(current_user.sub, REDIRECT_PATH)
    url = f"{base}/v1/connectors/github/authorize?state={quote(state)}"
    return success({"url": url})


def _handle_github_callback(code: str, state: str, db: Session) -> RedirectResponse:
    settings = get_settings()
    if not settings.connector_github_client_id or not settings.connector_github_client_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="GitHub connector not configured")
    try:
        sub, redirect_path = decode_connector_state(state)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state")

    with httpx.Client(timeout=15.0) as client:
        r = client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.connector_github_client_id,
                "client_secret": settings.connector_github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        if not r.is_success:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="GitHub token exchange failed")
        data = r.json()
        access_token = data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No access token in GitHub response")

    user = ProjectService(db).get_or_create_local_user(
        CurrentUser(sub=sub, email=None, name=None, org_id=None, workspace_role="owner", scopes=set(), allowed_actions=[], raw_claims={}),
    )
    upsert_connector_credentials(db, str(user.id), "github", access_token=access_token)
    db.commit()

    app_url = settings.web_app_url.rstrip("/")
    return RedirectResponse(url=f"{app_url}{redirect_path}", status_code=302)


@router.get("/connectors/github/authorize")
def github_authorize(state: str = Query(...)):
    settings = get_settings()
    if not settings.connector_github_client_id:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="GitHub connector not configured")
    redirect_uri = f"{settings.api_base_url.rstrip('/')}{settings.github_callback_url}"
    auth_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={quote(settings.connector_github_client_id)}"
        f"&redirect_uri={quote(redirect_uri)}"
        "&scope=repo,user:email"
        f"&state={quote(state)}"
    )
    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/connectors/github/callback")
def github_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    return _handle_github_callback(code, state, db)


@oauth_router.get("/oauth/github/callback")
def oauth_github_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    return _handle_github_callback(code, state, db)


@router.get("/connectors/google/status")
def google_status(
    current_user: CurrentUser = Depends(get_current_user),
    _scope: CurrentUser = Depends(require_scope("connector:link")),
    db: Session = Depends(get_db),
):
    return success(get_google_status(db, current_user.sub))


@router.get("/connectors/google/link-url")
def google_link_url(
    current_user: CurrentUser = Depends(get_current_user),
    _scope: CurrentUser = Depends(require_scope("connector:link")),
):
    settings = get_settings()
    base = settings.api_base_url.rstrip("/")
    state = encode_connector_state(current_user.sub, REDIRECT_PATH)
    url = f"{base}/v1/connectors/google/authorize?state={quote(state)}"
    return success({"url": url})


@router.get("/connectors/google/authorize")
def google_authorize(state: str = Query(...)):
    settings = get_settings()
    if not settings.connector_google_client_id:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google connector not configured")
    redirect_uri = f"{settings.api_base_url.rstrip('/')}/v1/connectors/google/callback"
    scope = quote("https://www.googleapis.com/auth/drive.file openid email profile")
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={quote(settings.connector_google_client_id)}"
        f"&redirect_uri={quote(redirect_uri)}"
        f"&response_type=code&scope={scope}"
        "&access_type=offline&prompt=consent"
        f"&state={quote(state)}"
    )
    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/connectors/google/callback")
def google_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    if not settings.connector_google_client_id or not settings.connector_google_client_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google connector not configured")
    try:
        sub, redirect_path = decode_connector_state(state)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state")

    redirect_uri = f"{settings.api_base_url.rstrip('/')}/v1/connectors/google/callback"
    with httpx.Client(timeout=15.0) as client:
        r = client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.connector_google_client_id,
                "client_secret": settings.connector_google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if not r.is_success:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Google token exchange failed")
        data = r.json()
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        if not access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No access token in Google response")
        expires_in = data.get("expires_in")

    user = ProjectService(db).get_or_create_local_user(
        CurrentUser(sub=sub, email=None, name=None, org_id=None, workspace_role="owner", scopes=set(), allowed_actions=[], raw_claims={}),
    )
    upsert_connector_credentials(
        db,
        str(user.id),
        "google",
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=_expires_at(expires_in),
    )
    db.commit()

    app_url = settings.web_app_url.rstrip("/")
    return RedirectResponse(url=f"{app_url}{redirect_path}", status_code=302)


@router.get("/connectors/debug")
def connectors_debug(
    current_user: CurrentUser = Depends(get_current_user),
    _scope: CurrentUser = Depends(require_scope("connector:link")),
    db: Session = Depends(get_db),
):
    return success({
        "current_user": {"sub": current_user.sub, "email": current_user.email},
        "github": get_github_status(db, current_user.sub),
        "google": get_google_status(db, current_user.sub),
    })


@router.get("/projects/{project_id}/github/repos")
def list_github_repos_for_project(
    project_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    _scope: CurrentUser = Depends(require_scope("repo:read")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    token = get_github_access_token(db, current_user.sub)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "GITHUB_NOT_LINKED", "message": "GitHub account is not linked."},
        )
    try:
        repos = GitHubClient().list_user_repos(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "GITHUB_FETCH_FAILED", "message": str(exc)},
        ) from exc
    return success({"project_id": str(project_id), "repos": repos})


@router.post("/projects/{project_id}/github/sync")
def sync_github_repos_for_project(
    project_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    _read_scope: CurrentUser = Depends(require_scope("repo:read")),
    _write_scope: CurrentUser = Depends(require_scope("project:write")),
    db: Session = Depends(get_db),
):
    ProjectService(db).get_project_or_404(project_id)
    token = get_github_access_token(db, current_user.sub)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "GITHUB_NOT_LINKED", "message": "GitHub account is not linked."},
        )
    try:
        repos = GitHubClient().list_user_repos(token, per_page=50)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "GITHUB_FETCH_FAILED", "message": str(exc)},
        ) from exc
    upsert_project_memory(
        db, project_id, "github_repos_snapshot",
        {"repos": repos, "count": len(repos)}, "integration_data", "github",
    )
    db.commit()
    return success({"project_id": str(project_id), "synced_repo_count": len(repos)})
