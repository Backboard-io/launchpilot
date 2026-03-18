from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ConnectorCredential(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "connector_credentials"
    __table_args__ = (UniqueConstraint("user_id", "provider", name="uq_connector_credentials_user_provider"),)

    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=True)
