"""Encode/decode signed state for connector OAuth flow (sub + redirect)."""

from __future__ import annotations

from jose import JWTError, jwt

from app.core.config import get_settings


def encode_connector_state(sub: str, redirect_path: str = "/app/settings/security") -> str:
    settings = get_settings()
    secret = settings.auth_jwt_secret
    if not secret:
        raise ValueError("AUTH_JWT_SECRET is not set")
    return jwt.encode(
        {"sub": sub, "redirect": redirect_path},
        secret,
        algorithm="HS256",
    )


def decode_connector_state(token: str) -> tuple[str, str]:
    settings = get_settings()
    secret = settings.auth_jwt_secret
    if not secret:
        raise ValueError("AUTH_JWT_SECRET is not set")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        sub = payload.get("sub")
        redirect_path = payload.get("redirect", "/app/settings/security")
        if not sub:
            raise ValueError("Invalid state: missing sub")
        return str(sub), str(redirect_path)
    except JWTError as exc:
        raise ValueError("Invalid state token") from exc
