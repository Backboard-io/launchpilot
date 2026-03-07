from __future__ import annotations

from datetime import datetime


def run_execution_plan_agent(context: dict) -> dict:
    return {
        "launch_strategy": {
            "primary_channel": "email outreach",
            "secondary_channels": ["reddit", "x"],
            "why": "Fastest path to early validation for niche builder tools",
        },
        "tasks": [
            {
                "day_number": day,
                "title": f"Day {day}: Launch task",
                "description": "Execute planned launch step and capture feedback",
                "priority": 3,
            }
            for day in range(1, 8)
        ],
        "kpis": ["emails_sent", "reply_rate", "signup_count"],
    }


def run_asset_generation_agent(context: dict, asset_types: list[str], count: int) -> list[dict]:
    project_name = context.get("project", {}).get("name") or "Project"
    assets = []
    for asset_type in asset_types:
        for idx in range(count):
            assets.append(
                {
                    "asset_type": asset_type,
                    "title": f"{project_name} {asset_type} v{idx + 1}",
                    "content": {
                        "generated_at": datetime.utcnow().isoformat(),
                        "body": f"Draft {asset_type} for {project_name}",
                        "cta": "Start your first launch sprint",
                    },
                }
            )
    return assets


def run_email_personalization_agent(context: dict, subject_line: str | None = None, max_contacts: int = 10) -> list[dict]:
    contacts = context.get("contacts", [])[:max_contacts]
    subject = subject_line or "Quick idea for your project launch"
    outputs = []
    for contact in contacts:
        name = contact.get("name") or "there"
        body = (
            f"Hi {name},<br/><br/>"
            "I built a focused launch workflow that helps technical builders get first users. "
            "Would you be open to a quick look and feedback?<br/><br/>"
            "Best,<br/>Growth Launchpad"
        )
        outputs.append({"contact_id": contact.get("id"), "subject": subject, "body": body})
    return outputs
