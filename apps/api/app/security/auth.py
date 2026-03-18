from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt

from app.core.config import Settings, get_settings


@dataclass(slots=True)
class CurrentUser:
    sub: str
    email: str | None
    name: str | None
    org_id: str | None
    workspace_role: str | None
    scopes: set[str]
    allowed_actions: list[str]
    raw_claims: dict


def _decode_oauth_token(token: str, settings: Settings) -> dict:
    secret = settings.auth_jwt_secret
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AUTH_JWT_SECRET is not configured",
        )
    try:
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        ) from exc


def _dev_user() -> CurrentUser:
    return CurrentUser(
        sub="dev|dev-user",
        email="dev@growthlaunchpad.app",
        name="Dev User",
        org_id=None,
        workspace_role="owner",
        scopes={
            "project:read",
            "project:write",
            "research:run",
            "positioning:run",
            "execution:run",
            "approval:read",
            "approval:write",
            "execution:send",
            "connector:link",
            "repo:read",
            "repo:write",
            "drive:write",
        },
        allowed_actions=["approve_send", "publish_asset"],
        raw_claims={},
    )


def get_current_user(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if settings.auth_mode.lower() == "dev":
        return _dev_user()

    if settings.auth_mode.lower() != "oauth":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unsupported AUTH_MODE",
        )

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = authorization.split(" ", 1)[1]
    claims = _decode_oauth_token(token, settings)

    scope_claim = claims.get("scope", "")
    scopes = set(scope_claim.split()) if scope_claim else set()

    return CurrentUser(
        sub=claims.get("sub", ""),
        email=claims.get("email"),
        name=claims.get("name"),
        org_id=None,
        workspace_role="owner",
        scopes=scopes,
        allowed_actions=["approve_send", "publish_asset"],
        raw_claims=claims,
    )
