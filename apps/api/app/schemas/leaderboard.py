from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    user_id: str
    display_name: str
    avatar_url: str | None
    total_points: int
    verified_task_count: int
    category_breakdown: dict[str, int]


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]


class LeaderboardSeedRequest(BaseModel):
    reset: bool = False


class LeaderboardSeedResetSummary(BaseModel):
    deleted_tasks: int
    deleted_memberships: int
    deleted_users: int


class LeaderboardSeedResponse(BaseModel):
    workspace_id: str
    project_id: str
    launch_plan_id: str
    users_seeded: int
    tasks_seeded: int
    reset: LeaderboardSeedResetSummary | None = None
