import uuid

from pydantic import BaseModel


class ResearchRunRequest(BaseModel):
    pinned_wedge_ids: list[uuid.UUID] | None = None


class ResearchSnapshot(BaseModel):
    summary: str | None = None
    competitors: list[dict] = []
    pain_point_clusters: list[dict] = []
    opportunity_wedges: list[dict] = []
