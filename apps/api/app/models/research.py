from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.models.base import Base, UUIDPrimaryKeyMixin


class ResearchRun(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "research_runs"

    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="queued")
    summary: Mapped[str | None] = mapped_column(Text)
    saturation_score: Mapped[float | None] = mapped_column(Numeric)
    created_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Competitor(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "competitors"

    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str | None] = mapped_column(String)
    category: Mapped[str | None] = mapped_column(String)
    positioning: Mapped[str | None] = mapped_column(Text)
    pricing_summary: Mapped[str | None] = mapped_column(Text)
    target_user: Mapped[str | None] = mapped_column(Text)
    strengths: Mapped[list] = mapped_column(JSON, default=list)
    weaknesses: Mapped[list] = mapped_column(JSON, default=list)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PainPointCluster(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "pain_point_clusters"

    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    evidence: Mapped[list] = mapped_column(JSON, default=list)
    rank: Mapped[int | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class OpportunityWedge(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "opportunity_wedges"

    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    score: Mapped[float | None] = mapped_column(Numeric)
    status: Mapped[str] = mapped_column(String, nullable=False, default="candidate")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
