import uuid

from pydantic import BaseModel


class PositioningRunRequest(BaseModel):
    wedge_ids: list[uuid.UUID] | None = None


class PositioningSelectResponse(BaseModel):
    selected_version_id: uuid.UUID
