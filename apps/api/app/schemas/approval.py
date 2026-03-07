from pydantic import BaseModel


class ApprovalDecisionRequest(BaseModel):
    reason: str | None = None
