from __future__ import annotations

from fastapi import Depends, HTTPException, status

from app.security.auth0 import CurrentUser, get_current_user


def require_scope(scope: str):
    def dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if scope not in current_user.scopes:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing scope: {scope}")
        return current_user

    return dependency
