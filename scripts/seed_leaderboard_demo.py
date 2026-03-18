#!/usr/bin/env python3
"""
Seed 10 demo users with verified launch tasks so the leaderboard has real data.

Usage:
    # From repo root, target the local dev DB (default):
    python scripts/seed_leaderboard_demo.py

    # Target a specific DB:
    DATABASE_URL=sqlite+pysqlite:////path/to/db.sqlite python scripts/seed_leaderboard_demo.py

    # Wipe only the demo data and re-seed:
    python scripts/seed_leaderboard_demo.py --reset
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

# ---------------------------------------------------------------------------
# Allow running from repo root without installing the api package
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.db.base import *  # noqa: F401,F403  – registers all model metadata
from app.models.base import Base
from app.models.execution import LaunchPlan, LaunchTask
from app.models.project import Project
from app.models.workspace import User, Workspace, WorkspaceMember

DB_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite+pysqlite:///./data/launchpilot.db",
)

NOW = datetime.now(timezone.utc)
DEMO_TAG = "demo_leaderboard"  # stored as auth0_user_id prefix so we can wipe cleanly

# ── 10 demo personas ────────────────────────────────────────────────────────
DEMO_USERS = [
    ("Aria Chen",       "aria@demo.dev"),
    ("Benson Okeke",    "benson@demo.dev"),
    ("Camila Reyes",    "camila@demo.dev"),
    ("Dmitri Volkov",   "dmitri@demo.dev"),
    ("Evelyn Park",     "evelyn@demo.dev"),
    ("Felix Guerrero",  "felix@demo.dev"),
    ("Grace Ndiaye",    "grace@demo.dev"),
    ("Hiroshi Tanaka",  "hiroshi@demo.dev"),
    ("Isla MacLeod",    "isla@demo.dev"),
    ("Jonas Weber",     "jonas@demo.dev"),
]

# Each user gets this many tasks; mix of categories creates varied scores.
# Row: (category, evidence_verified)
TASK_TEMPLATES: list[tuple[str | None, bool]] = [
    # video posts (3 pts each, verified)
    ("video_social", True),
    ("video_social", True),
    # text posts (1 pt each, verified)
    ("text_social", True),
    ("text_social", True),
    ("text_social", True),
    # coding / infra (0 pts, verified — show on count but not pts)
    ("coding",  True),
    ("infra",   True),
    # unverified text post — should NOT appear in points
    ("text_social", False),
]

# Each user gets a different slice of the task list so scores vary.
def tasks_for_user(idx: int) -> list[tuple[str | None, bool]]:
    """Return a unique but deterministic task mix per user index (0–9)."""
    # Rotate the template so each user has a different combo
    rotated = TASK_TEMPLATES[idx % len(TASK_TEMPLATES):] + TASK_TEMPLATES[: idx % len(TASK_TEMPLATES)]
    # Fewer tasks for lower-ranked users (take max 8 − idx//2 tasks)
    limit = max(2, len(TASK_TEMPLATES) - idx // 2)
    return rotated[:limit]


def find_or_create_demo_workspace(db: Session) -> Workspace:
    """Use the dev-mode default workspace (dev|dev-user) or create one."""
    dev_user = db.query(User).filter(User.auth0_user_id == "dev|dev-user").first()
    if dev_user:
        membership = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == dev_user.id).first()
        if membership:
            ws = db.query(Workspace).filter(Workspace.id == membership.workspace_id).first()
            if ws:
                return ws

    # Fall back: first workspace in the DB
    ws = db.query(Workspace).first()
    if ws:
        return ws

    # Last resort: create a demo workspace
    ws = Workspace(id=uuid4(), name="Demo Workspace", slug="demo-workspace")
    db.add(ws)
    db.flush()
    return ws


def find_or_create_demo_project(db: Session, workspace: Workspace) -> Project:
    slug = "leaderboard-demo"
    project = db.query(Project).filter(Project.workspace_id == workspace.id, Project.slug == slug).first()
    if project:
        return project
    project = Project(
        id=uuid4(),
        workspace_id=workspace.id,
        name="Leaderboard Demo",
        slug=slug,
        summary="Auto-seeded project for leaderboard demo.",
        stage="execution",
        status="active",
    )
    db.add(project)
    db.flush()
    return project


def seed(db: Session) -> None:
    workspace = find_or_create_demo_workspace(db)
    project = find_or_create_demo_project(db, workspace)

    # Find or create a single launch plan for the demo project
    plan = db.query(LaunchPlan).filter(LaunchPlan.project_id == project.id).first()
    if not plan:
        plan = LaunchPlan(
            id=uuid4(),
            project_id=project.id,
            primary_channel="social",
            status="active",
        )
        db.add(plan)
        db.flush()

    print(f"Workspace : {workspace.name} ({workspace.id})")
    print(f"Project   : {project.name} ({project.id})")
    print(f"Plan      : {plan.id}")
    print()

    for i, (name, email) in enumerate(DEMO_USERS):
        auth0_id = f"{DEMO_TAG}|user-{i:02d}"

        # Upsert user
        user = db.query(User).filter(User.auth0_user_id == auth0_id).first()
        if not user:
            user = User(id=uuid4(), auth0_user_id=auth0_id, email=email, name=name)
            db.add(user)
            db.flush()

        # Add to workspace as member if not already
        membership = (
            db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace.id, WorkspaceMember.user_id == user.id)
            .first()
        )
        if not membership:
            db.add(WorkspaceMember(id=uuid4(), workspace_id=workspace.id, user_id=user.id, role="member", status="active"))

        # Seed tasks
        task_mix = tasks_for_user(i)
        created = 0
        for day, (category, verified) in enumerate(task_mix, start=1):
            task = LaunchTask(
                id=uuid4(),
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
            db.add(task)
            created += 1

        verified_pts = sum(
            _pts(cat) for cat, v in task_mix if v
        )
        print(f"  [{i+1:2d}] {name:<18} — {created} tasks, {verified_pts} pts")

    db.commit()
    print("\nDone. Reload the leaderboard to see results.")


def reset(db: Session) -> None:
    """Remove all demo users' tasks and workspace memberships, then the users."""
    demo_users = db.query(User).filter(User.auth0_user_id.like(f"{DEMO_TAG}%")).all()
    if not demo_users:
        print("No demo users found — nothing to reset.")
        return
    ids = [u.id for u in demo_users]

    deleted_tasks = db.query(LaunchTask).filter(LaunchTask.assignee_id.in_(ids)).delete(synchronize_session=False)
    deleted_memberships = db.query(WorkspaceMember).filter(WorkspaceMember.user_id.in_(ids)).delete(synchronize_session=False)
    deleted_users = db.query(User).filter(User.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    print(f"Removed {deleted_tasks} tasks, {deleted_memberships} memberships, {deleted_users} users.")


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


def _pts(category: str | None) -> int:
    return {"text_social": 1, "video_social": 3}.get(category or "", 0)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed leaderboard demo data.")
    parser.add_argument("--reset", action="store_true", help="Wipe existing demo data first")
    args = parser.parse_args()

    engine = create_engine(DB_URL)
    with Session(engine) as db:
        if args.reset:
            print("Resetting demo data...")
            reset(db)
            print()
        seed(db)


if __name__ == "__main__":
    main()
