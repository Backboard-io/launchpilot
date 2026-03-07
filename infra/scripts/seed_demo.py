#!/usr/bin/env python3
"""Seed a demo project through the API for hackathon demos."""

from __future__ import annotations

import os

import requests

API_BASE = os.environ.get("API_BASE", "http://localhost:8000/v1")
WORKSPACE_ID = os.environ.get("WORKSPACE_ID")


def main() -> None:
    if not WORKSPACE_ID:
        raise SystemExit("WORKSPACE_ID is required")

    payload = {
        "workspace_id": WORKSPACE_ID,
        "name": "Demo Launch Project",
        "summary": "An AI onboarding assistant for student founders",
        "goal": "Get first 20 users",
        "website_url": "https://example.com"
    }
    response = requests.post(f"{API_BASE}/projects", json=payload, timeout=20)
    response.raise_for_status()
    data = response.json()["data"]
    print("Seeded demo project")
    print(data)


if __name__ == "__main__":
    main()
