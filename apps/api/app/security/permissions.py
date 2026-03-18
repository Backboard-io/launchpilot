from __future__ import annotations

from fastapi import Depends, HTTPException, status

from app.core.config import get_settings
from app.security.auth import CurrentUser, get_current_user


def require_scope(scope: str):
    def dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if scope not in current_user.scopes:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing scope: {scope}")
        return current_user

    return dependency


def require_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    settings = get_settings()
    admin_emails_set = {e.strip().lower() for e in settings.admin_emails.split(",") if e.strip()}
    if (current_user.email or "").lower() not in admin_emails_set:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
