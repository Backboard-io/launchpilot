"""DB-backed Google/GitHub connector credentials (replaces Auth0 Management API)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.connector import ConnectorCredential
from app.models.workspace import User
from app.security.auth import CurrentUser


def _user_by_sub(db: Session, sub: str) -> User | None:
    return db.query(User).filter(User.auth0_user_id == sub).first()


def get_google_status(db: Session, sub: str) -> dict:
    user = _user_by_sub(db, sub)
    if not user:
        return {"linked": False, "provider": "google", "provider_user_id": None, "has_access_token": False}
    row = (
        db.query(ConnectorCredential)
        .filter(ConnectorCredential.user_id == str(user.id), ConnectorCredential.provider == "google")
        .first()
    )
    if not row or not row.access_token:
        return {"linked": False, "provider": "google", "provider_user_id": None, "has_access_token": False}
    return {
        "linked": True,
        "provider": "google",
        "provider_user_id": None,
        "has_access_token": bool(row.access_token),
    }


def get_google_access_token(db: Session, sub: str) -> str | None:
    user = _user_by_sub(db, sub)
    if not user:
        return None
    row = (
        db.query(ConnectorCredential)
        .filter(ConnectorCredential.user_id == str(user.id), ConnectorCredential.provider == "google")
        .first()
    )
    if not row:
        return None
    if row.access_token:
        if row.expires_at and datetime.now(timezone.utc) >= row.expires_at and row.refresh_token:
            token = _refresh_google_token(row.refresh_token)
            if token:
                row.access_token = token.get("access_token")
                row.expires_at = _expires_at(token.get("expires_in")) if token.get("expires_in") else None
                db.commit()
                return row.access_token
        return row.access_token
    return None


def get_github_status(db: Session, sub: str) -> dict:
    user = _user_by_sub(db, sub)
    if not user:
        return {"linked": False, "provider": "github", "provider_user_id": None, "has_access_token": False}
    row = (
        db.query(ConnectorCredential)
        .filter(ConnectorCredential.user_id == str(user.id), ConnectorCredential.provider == "github")
        .first()
    )
    if not row or not row.access_token:
        return {"linked": False, "provider": "github", "provider_user_id": None, "has_access_token": False}
    return {
        "linked": True,
        "provider": "github",
        "provider_user_id": None,
        "has_access_token": bool(row.access_token),
    }


def get_github_access_token(db: Session, sub: str) -> str | None:
    user = _user_by_sub(db, sub)
    if not user:
        return None
    row = (
        db.query(ConnectorCredential)
        .filter(ConnectorCredential.user_id == str(user.id), ConnectorCredential.provider == "github")
        .first()
    )
    return row.access_token if row else None


def upsert_connector_credentials(
    db: Session,
    user_id: str,
    provider: str,
    *,
    access_token: str | None = None,
    refresh_token: str | None = None,
    expires_at: datetime | None = None,
) -> ConnectorCredential:
    row = (
        db.query(ConnectorCredential)
        .filter(ConnectorCredential.user_id == user_id, ConnectorCredential.provider == provider)
        .first()
    )
    if row:
        if access_token is not None:
            row.access_token = access_token
        if refresh_token is not None:
            row.refresh_token = refresh_token
        if expires_at is not None:
            row.expires_at = expires_at
        db.flush()
        return row
    row = ConnectorCredential(
        user_id=user_id,
        provider=provider,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=expires_at,
    )
    db.add(row)
    db.flush()
    return row


def _expires_at(expires_in: int) -> datetime | None:
    if not expires_in:
        return None
    return datetime.now(timezone.utc).replace(microsecond=0) + timedelta(seconds=expires_in)


def _refresh_google_token(refresh_token: str) -> dict | None:
    import httpx
    from app.core.config import get_settings
    settings = get_settings()
    if not settings.connector_google_client_id or not settings.connector_google_client_secret:
        return None
    with httpx.Client(timeout=15.0) as client:
        r = client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.connector_google_client_id,
                "client_secret": settings.connector_google_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if not r.is_success:
            return None
        return r.json()