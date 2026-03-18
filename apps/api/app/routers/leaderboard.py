from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.execution import LaunchPlan, LaunchTask, TASK_CATEGORY_POINTS
from app.models.project import Project
from app.models.workspace import User, WorkspaceMember
from app.routers.utils import success
from app.schemas.leaderboard import (
    LeaderboardEntry,
    LeaderboardResponse,
    LeaderboardSeedRequest,
    LeaderboardSeedResetSummary,
    LeaderboardSeedResponse,
)
from app.security.auth import CurrentUser, get_current_user
from app.security.permissions import require_scope
from app.services.project_service import ProjectService

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

VERIFIED_STATUSES = ("completed", "succeeded")
DEMO_TAG = "demo_leaderboard"
NOW = datetime.now(timezone.utc)

DEMO_USERS = [
    ("Aria Chen", "aria@demo.dev"),
    ("Benson Okeke", "benson@demo.dev"),
    ("Camila Reyes", "camila@demo.dev"),
    ("Dmitri Volkov", "dmitri@demo.dev"),
    ("Evelyn Park", "evelyn@demo.dev"),
    ("Felix Guerrero", "felix@demo.dev"),
    ("Grace Ndiaye", "grace@demo.dev"),
    ("Hiroshi Tanaka", "hiroshi@demo.dev"),
    ("Isla MacLeod", "isla@demo.dev"),
    ("Jonas Weber", "jonas@demo.dev"),
]

TASK_TEMPLATES: list[tuple[str | None, bool]] = [
    ("video_social", True),
    ("video_social", True),
    ("text_social", True),
    ("text_social", True),
    ("text_social", True),
    ("coding", True),
    ("infra", True),
    ("text_social", False),
]


@router.get("", response_model=None)
def get_leaderboard(
    current_user: CurrentUser = Depends(get_current_user),
    _scope: CurrentUser = Depends(require_scope("project:read")),
    db: Session = Depends(get_db),
):
    project_service = ProjectService(db)
    user = project_service.get_or_create_local_user(current_user)
    workspace_ids = [
        m.workspace_id for m in db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).all()
    ]
    if not workspace_ids:
        return success(LeaderboardResponse(entries=[]).model_dump())

    tasks = (
        db.query(LaunchTask, User)
        .join(LaunchPlan, LaunchPlan.id == LaunchTask.launch_plan_id)
        .join(Project, Project.id == LaunchPlan.project_id)
        .join(User, User.id == LaunchTask.assignee_id)
        .filter(
            Project.workspace_id.in_(workspace_ids),
            LaunchTask.status.in_(VERIFIED_STATUSES),
            LaunchTask.evidence_verified_at.isnot(None),
            LaunchTask.assignee_id.isnot(None),
        )
        .all()
    )

    # Aggregate by assignee: total_points, count, category_breakdown
    by_user: dict[str, dict] = defaultdict(
        lambda: {
            "user_id": "",
            "display_name": "",
            "avatar_url": None,
            "total_points": 0,
            "verified_task_count": 0,
            "category_breakdown": defaultdict(int),
        }
    )
    for task, assignee in tasks:
        uid = str(assignee.id)
        pts = TASK_CATEGORY_POINTS.get(task.category) or 0
        by_user[uid]["user_id"] = uid
        by_user[uid]["display_name"] = assignee.name or assignee.email or "Unknown"
        by_user[uid]["avatar_url"] = assignee.avatar_url
        by_user[uid]["total_points"] += pts
        by_user[uid]["verified_task_count"] += 1
        if task.category:
            by_user[uid]["category_breakdown"][task.category] += 1

    entries = [
        LeaderboardEntry(
            user_id=row["user_id"],
            display_name=row["display_name"],
            avatar_url=row["avatar_url"],
            total_points=row["total_points"],
            verified_task_count=row["verified_task_count"],
            category_breakdown=dict(row["category_breakdown"]),
        )
        for row in sorted(by_user.values(), key=lambda r: (-r["total_points"], r["display_name"]))
    ]

    return success(LeaderboardResponse(entries=entries).model_dump())


def _tasks_for_user(idx: int) -> list[tuple[str | None, bool]]:
    rotated = TASK_TEMPLATES[idx % len(TASK_TEMPLATES):] + TASK_TEMPLATES[: idx % len(TASK_TEMPLATES)]
    limit = max(2, len(TASK_TEMPLATES) - idx // 2)
    return rotated[:limit]


def _task_title(category: str | None, day: int) -> str:
    titles = {
        "video_social": [
            "Record product walkthrough video",
            "Shoot 60-sec launch trailer",
            "Post YouTube short on pain point",
        ],
        "text_social": [
            "Write Twitter/X launch thread",
            "Draft LinkedIn post: behind the scenes",
            "Post on relevant subreddit",
        ],
        "coding": [
            "Build onboarding flow",
            "Ship analytics integration",
            "Deploy public landing page",
        ],
        "infra": [
            "Set up CI/CD pipeline",
            "Configure production environment",
            "Enable error monitoring",
        ],
    }
    options = titles.get(category or "", ["Complete launch task"])
    return options[day % len(options)]


def _reset_demo_data(db: Session) -> LeaderboardSeedResetSummary:
    demo_users = db.query(User).filter(User.auth0_user_id.like(f"{DEMO_TAG}%")).all()
    if not demo_users:
        return LeaderboardSeedResetSummary(deleted_tasks=0, deleted_memberships=0, deleted_users=0)
    ids = [u.id for u in demo_users]
    deleted_tasks = db.query(LaunchTask).filter(LaunchTask.assignee_id.in_(ids)).delete(synchronize_session=False)
    deleted_memberships = (
        db.query(WorkspaceMember).filter(WorkspaceMember.user_id.in_(ids)).delete(synchronize_session=False)
    )
    deleted_users = db.query(User).filter(User.id.in_(ids)).delete(synchronize_session=False)
    return LeaderboardSeedResetSummary(
        deleted_tasks=deleted_tasks,
        deleted_memberships=deleted_memberships,
        deleted_users=deleted_users,
    )


@router.post("/seed")
def seed_leaderboard_demo(
    payload: LeaderboardSeedRequest,
    current_user: CurrentUser = Depends(get_current_user),
    _scope: CurrentUser = Depends(require_scope("project:write")),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    if settings.auth_mode.lower() != "dev":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Leaderboard seed is only available in dev mode")

    reset_summary = None
    if payload.reset:
        reset_summary = _reset_demo_data(db)

    project_service = ProjectService(db)
    actor = project_service.get_or_create_local_user(current_user)
    workspace = project_service.get_or_create_default_workspace(actor)

    slug = "leaderboard-demo"
    project = db.query(Project).filter(Project.workspace_id == workspace.id, Project.slug == slug).first()
    if not project:
        project = Project(
            workspace_id=workspace.id,
            name="Leaderboard Demo",
            slug=slug,
            summary="Auto-seeded project for leaderboard demo.",
            stage="execution",
            status="active",
            created_by=actor.id,
        )
        db.add(project)
        db.flush()

    plan = db.query(LaunchPlan).filter(LaunchPlan.project_id == project.id).first()
    if not plan:
        plan = LaunchPlan(
            project_id=project.id,
            primary_channel="social",
            status="active",
        )
        db.add(plan)
        db.flush()

    users_seeded = 0
    tasks_seeded = 0
    for i, (name, email) in enumerate(DEMO_USERS):
        auth0_id = f"{DEMO_TAG}|user-{i:02d}"
        user = db.query(User).filter(User.auth0_user_id == auth0_id).first()
        if not user:
            user = User(auth0_user_id=auth0_id, email=email, name=name)
            db.add(user)
            db.flush()
            users_seeded += 1

        membership = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace.id, WorkspaceMember.user_id == user.id)
            .first()
        )
        if not membership:
            db.add(
                WorkspaceMember(
                    workspace_id=workspace.id,
                    user_id=user.id,
                    role="member",
                    status="active",
                )
            )

        task_mix = _tasks_for_user(i)
        for day, (category, verified) in enumerate(task_mix, start=1):
            db.add(
                LaunchTask(
                    launch_plan_id=plan.id,
                    assignee_id=user.id,
                    day_number=day,
                    title=_task_title(category, day),
                    description=f"Demo task seeded for {name}.",
                    status="completed",
                    priority=2,
                    category=category,
                    evidence_url="https://example.com/demo-evidence" if verified else None,
                    evidence_verified_at=NOW - timedelta(days=day) if verified else None,
                )
            )
            tasks_seeded += 1

    db.commit()
    return success(
        LeaderboardSeedResponse(
            workspace_id=str(workspace.id),
            project_id=str(project.id),
            launch_plan_id=str(plan.id),
            users_seeded=users_seeded,
            tasks_seeded=tasks_seeded,
            reset=reset_summary,
        ).model_dump()
    )
