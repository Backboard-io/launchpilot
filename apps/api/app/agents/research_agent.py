from __future__ import annotations

from app.prompts.research_prompt import RESEARCH_PROMPT


def run_research_agent(context: dict) -> dict:
    project_name = context.get("project", {}).get("name") or "Project"
    summary = (context.get("project", {}).get("summary") or "").lower()

    category = "developer productivity" if "developer" in summary or "dev" in summary else "early-stage SaaS"
    segments = ["student developers", "indie developers"]

    competitors = [
        {
            "name": "Notion",
            "positioning": "All-in-one workspace",
            "pricing_summary": "Freemium + team plans",
            "strengths": ["brand", "templates"],
            "weaknesses": ["generic onboarding"],
        },
        {
            "name": "Linear",
            "positioning": "Fast issue tracking",
            "pricing_summary": "Per-seat SaaS",
            "strengths": ["speed", "developer affinity"],
            "weaknesses": ["narrow use case"],
        },
    ]

    pains = [
        {
            "label": "No clear first audience",
            "description": "Builders cannot decide a narrow ICP for launch",
            "evidence": ["brief ambiguity", "broad messaging"],
        },
        {
            "label": "Inconsistent launch execution",
            "description": "Advice exists but execution steps are unclear",
            "evidence": ["missing tactical sequence"],
        },
    ]

    wedges = [
        {
            "label": "Hackathon to first users",
            "description": "Convert student and indie hackathon projects into first-user systems",
            "score": 0.84,
        },
        {
            "label": "Operator-in-the-loop outbound",
            "description": "Approval-gated outreach for technical builders",
            "score": 0.77,
        },
    ]

    return {
        "prompt_used": RESEARCH_PROMPT,
        "project_category": category,
        "candidate_user_segments": segments,
        "competitors": competitors,
        "pain_point_clusters": pains,
        "opportunity_wedges": wedges,
        "risk_warnings": ["Crowded launch tooling category"],
        "summary": f"{project_name} sits in {category} with strongest wedge around hackathon-to-first-user execution.",
    }
