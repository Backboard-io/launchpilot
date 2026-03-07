from __future__ import annotations

from app.prompts.positioning_prompt import POSITIONING_PROMPT


def run_positioning_agent(context: dict) -> dict:
    wedges = context.get("research", {}).get("wedges", [])
    chosen_wedge = wedges[0]["label"] if wedges else "Narrow audience launch execution"

    return {
        "prompt_used": POSITIONING_PROMPT,
        "recommended_icp": "CS students and indie developers launching portfolio tools",
        "recommended_wedge": chosen_wedge,
        "positioning_statement": "For technical builders with weak GTM skills, Growth Launchpad turns raw projects into approval-gated first-user launch systems.",
        "headline": "Turn your side project into first users",
        "subheadline": "Research your niche, choose a wedge, and execute supervised outreach in one workspace.",
        "benefits": [
            "Narrow ICP and wedge selection",
            "Generated launch assets and 7-day plan",
            "Approval-gated outbound execution",
        ],
        "objection_handling": [
            {
                "objection": "Why not use general chat tools",
                "response": "This workflow stores decisions and executes launch actions with approvals and memory.",
            }
        ],
        "pricing_direction": "Free tier with optional paid launch sprint",
    }
