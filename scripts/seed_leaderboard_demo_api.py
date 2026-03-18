#!/usr/bin/env python3
"""
Seed leaderboard demo data through the API.

Usage:
    python scripts/seed_leaderboard_demo_api.py
    python scripts/seed_leaderboard_demo_api.py --reset

Env:
    API_BASE_URL=http://localhost:8000
"""
from __future__ import annotations

import argparse
import os
import sys

import httpx


def _post_seed(base_url: str, reset: bool, timeout: float) -> dict:
    url = f"{base_url.rstrip('/')}/v1/leaderboard/seed"
    payload = {"reset": reset}
    with httpx.Client(timeout=timeout) as client:
        response = client.post(url, json=payload)
    if response.status_code >= 400:
        detail = response.text.strip() or response.reason_phrase
        raise RuntimeError(f"Seed failed: {response.status_code} {detail}")
    data = response.json()
    return data.get("data", data)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed leaderboard demo data via API.")
    parser.add_argument("--reset", action="store_true", help="Wipe existing demo data first")
    parser.add_argument(
        "--api-base-url",
        default=os.environ.get("API_BASE_URL", "http://localhost:8000"),
        help="Base URL for the API (env: API_BASE_URL)",
    )
    parser.add_argument("--timeout", type=float, default=20.0, help="Request timeout in seconds")
    args = parser.parse_args()

    try:
        result = _post_seed(args.api_base_url, args.reset, args.timeout)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)

    reset_summary = result.get("reset")
    if reset_summary:
        print(
            "Reset: "
            f"{reset_summary.get('deleted_tasks', 0)} tasks, "
            f"{reset_summary.get('deleted_memberships', 0)} memberships, "
            f"{reset_summary.get('deleted_users', 0)} users."
        )

    print("Seeded leaderboard demo data:")
    print(f"  Workspace  : {result.get('workspace_id')}")
    print(f"  Project    : {result.get('project_id')}")
    print(f"  Launch plan: {result.get('launch_plan_id')}")
    print(f"  Users      : {result.get('users_seeded')}")
    print(f"  Tasks      : {result.get('tasks_seeded')}")


if __name__ == "__main__":
    main()
