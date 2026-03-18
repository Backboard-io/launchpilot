import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, validates


def _hex(value) -> str:
    if isinstance(value, uuid.UUID):
        return value.hex
    if isinstance(value, str):
        return value.replace("-", "")
    return value


class Base(DeclarativeBase):
    pass


class ProjectIdMixin:
    @validates("project_id")
    def _coerce_project_id(self, key, value):
        return _hex(value)


class UUIDPrimaryKeyMixin:
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: uuid.uuid4().hex)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
