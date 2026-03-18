from pydantic import BaseModel


class AdminUserOut(BaseModel):
    id: str
    email: str
    name: str | None
    auth0_user_id: str


class AdminUserUpdateRequest(BaseModel):
    name: str | None = None
    email: str | None = None


class AdminProjectBriefOut(BaseModel):
    id: str
    name: str
    slug: str
    stage: str
    status: str
    workspace_id: str | None = None


class AdminProjectUpdateRequest(BaseModel):
    name: str | None = None
    slug: str | None = None
    status: str | None = None
    workspace_id: str | None = None


class AdminWorkspaceMemberOut(BaseModel):
    user_id: str
    email: str
    name: str | None
    role: str
    status: str


class AdminWorkspaceOut(BaseModel):
    id: str
    name: str
    slug: str
    owner_user_id: str | None
    project_count: int
    member_count: int


class AdminWorkspaceDetailOut(BaseModel):
    id: str
    name: str
    slug: str
    owner_user_id: str | None
    projects: list[AdminProjectBriefOut]
    members: list[AdminWorkspaceMemberOut]


class AdminWorkspaceMemberAddRequest(BaseModel):
    user_id: str
    role: str = "member"
