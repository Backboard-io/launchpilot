from __future__ import annotations

from app.prompts.execution_prompt import EXECUTION_PROMPT
from app.services.backboard_stage_service import BackboardStageService


def _project_name(context: dict) -> str:
    return context.get("project", {}).get("name") or "project"


def _normalize_launch_strategy(raw: dict | None, context: dict) -> dict:
    strategy = raw if isinstance(raw, dict) else {}
    primary = str(strategy.get("primary_channel") or "").strip() or "content + outreach"
    secondary = strategy.get("secondary_channels")
    if not isinstance(secondary, list):
        secondary = []
    secondary = [str(item).strip() for item in secondary if str(item).strip()][:3]
    why = str(strategy.get("why") or "").strip()
    if not why:
        audience = context.get("brief", {}).get("audience") or "target users"
        why = f"Fastest channel mix to reach {audience}, get feedback quickly, and iterate within 7 days."
    return {"primary_channel": primary, "secondary_channels": secondary, "why": why}


def _normalize_tasks(raw_tasks: list | None, context: dict) -> list[dict]:
    tasks: list[dict] = []
    seen_days: set[int] = set()
    if isinstance(raw_tasks, list):
        for item in raw_tasks:
            if not isinstance(item, dict):
                continue
            day = item.get("day_number")
            if not isinstance(day, int) or day < 1 or day > 7 or day in seen_days:
                continue
            title = str(item.get("title") or "").strip()
            description = str(item.get("description") or "").strip()
            if not title or not description:
                continue
            priority = item.get("priority")
            if not isinstance(priority, int):
                priority = day
            priority = max(1, min(7, priority))
            tasks.append(
                {
                    "day_number": day,
                    "title": title,
                    "description": description,
                    "priority": priority,
                }
            )
            seen_days.add(day)
    tasks.sort(key=lambda t: t["day_number"])

    project_name = _project_name(context)
    fallbacks = {
        1: ("Finalize ICP + offer", f"Lock offer and messaging for {project_name}; define baseline success metrics."),
        2: ("Build launch assets", "Create and QA email + ad assets with clear CTA and tracking links."),
        3: ("Set distribution list", "Prepare target contact segments and send schedule."),
        4: ("Soft launch", "Send first wave, monitor opens/clicks, capture qualitative feedback."),
        5: ("Iterate creative", "Adjust copy and prompt based on response patterns."),
        6: ("Second wave rollout", "Launch improved variants and compare against baseline."),
        7: ("Review + decision", "Summarize KPI outcomes and decide scale/iterate/stop."),
    }
    for day in range(1, 8):
        if day in seen_days:
            continue
        title, description = fallbacks[day]
        tasks.append({"day_number": day, "title": title, "description": description, "priority": day})
    tasks.sort(key=lambda t: t["day_number"])
    return tasks[:7]


def _normalize_kpis(raw_kpis: list | None) -> list[str]:
    kpis: list[str] = []
    if isinstance(raw_kpis, list):
        for item in raw_kpis:
            text = str(item).strip()
            if text:
                kpis.append(text)
    if len(kpis) >= 3:
        return kpis[:6]
    return [
        "Email open rate",
        "Email click-through rate",
        "Landing-to-signup conversion rate",
        "Cost per qualified lead",
    ]


def _normalize_assets(raw_assets: list | None, requested_types: list[str], count: int) -> list[dict]:
    allowed = set(requested_types)
    limit = max(1, min(5, count)) * max(1, len(requested_types))
    assets: list[dict] = []
    if isinstance(raw_assets, list):
        for item in raw_assets:
            if not isinstance(item, dict):
                continue
            asset_type = str(item.get("asset_type") or "").strip()
            if not asset_type:
                continue
            if allowed and asset_type not in allowed:
                continue
            title = str(item.get("title") or "").strip() or asset_type.replace("_", " ").title()
            content = item.get("content")
            if not isinstance(content, dict):
                content = {"body": str(content or "").strip()}
            assets.append({"asset_type": asset_type, "title": title, "content": content})
            if len(assets) >= limit:
                break
    return assets


def _normalize_drafts(raw_drafts: list | None, context: dict, max_contacts: int) -> list[dict]:
    valid_contact_ids = {str(c.get("id")) for c in (context.get("contacts") or []) if c.get("id")}
    drafts: list[dict] = []
    if isinstance(raw_drafts, list):
        for item in raw_drafts:
            if not isinstance(item, dict):
                continue
            contact_id = str(item.get("contact_id") or "").strip()
            if not contact_id or contact_id not in valid_contact_ids:
                continue
            body = str(item.get("body") or "").strip()
            if not body:
                continue
            subject = str(item.get("subject") or "").strip() or "Quick idea for your launch"
            drafts.append({"contact_id": contact_id, "subject": subject, "body": body})
            if len(drafts) >= max(1, max_contacts):
                break
    return drafts


def run_execution_plan_agent(
    context: dict,
    *,
    backboard: BackboardStageService,
    project_id: str,
    advice: str | None = None,
    mode: str = "baseline",
) -> tuple[dict, dict]:
    response, trace = backboard.run_json_stage(
        project_id=project_id,
        project_name=context.get("project", {}).get("name") or "project",
        stage="execution",
        system_prompt=EXECUTION_PROMPT,
        context=context,
        advice=advice,
        mode=mode,
        extra_task_instructions=(
            "Focus only on execution planning. Return launch_strategy, tasks, and kpis for a 7-day launch sprint. "
            "Tasks must be day_number 1..7 exactly once each, with non-generic, actionable descriptions."
        ),
    )
    normalized = {
        "launch_strategy": _normalize_launch_strategy(response.get("launch_strategy"), context),
        "tasks": _normalize_tasks(response.get("tasks"), context),
        "kpis": _normalize_kpis(response.get("kpis")),
        "chat_message": response.get("chat_message") or "",
        "next_step_suggestion": response.get("next_step_suggestion") or "",
        "should_move_to_next_stage": bool(response.get("should_move_to_next_stage")),
        "next_stage": response.get("next_stage") or "execution",
    }
    return normalized, {
        "provider": trace.provider,
        "mode": trace.mode,
        "used_advice": trace.used_advice,
        "assistant_id": trace.assistant_id,
        "thread_id": trace.thread_id,
    }


def run_asset_generation_agent(
    context: dict,
    asset_types: list[str],
    count: int,
    *,
    backboard: BackboardStageService,
    project_id: str,
    advice: str | None = None,
    mode: str = "baseline",
) -> tuple[dict, dict]:
    response, trace = backboard.run_json_stage(
        project_id=project_id,
        project_name=context.get("project", {}).get("name") or "project",
        stage="execution",
        system_prompt=EXECUTION_PROMPT,
        context=context,
        advice=advice,
        mode=mode,
        extra_task_instructions=(
            f"Generate only assets. asset_types={asset_types}, count_per_type={count}. "
            "Return JSON with an assets array. "
            "Do not generate placeholder copy; each asset must be immediately publishable."
        ),
    )
    assets = _normalize_assets(response.get("assets"), asset_types, count)
    normalized = {
        "assets": assets,
        "chat_message": response.get("chat_message") or "",
        "next_step_suggestion": response.get("next_step_suggestion") or "",
        "should_move_to_next_stage": bool(response.get("should_move_to_next_stage")),
        "next_stage": response.get("next_stage") or "execution",
    }
    return normalized, {
        "provider": trace.provider,
        "mode": trace.mode,
        "used_advice": trace.used_advice,
        "assistant_id": trace.assistant_id,
        "thread_id": trace.thread_id,
    }


def run_email_personalization_agent(
    context: dict,
    subject_line: str | None = None,
    max_contacts: int = 10,
    *,
    backboard: BackboardStageService,
    project_id: str,
    advice: str | None = None,
    mode: str = "baseline",
) -> tuple[dict, dict]:
    response, trace = backboard.run_json_stage(
        project_id=project_id,
        project_name=context.get("project", {}).get("name") or "project",
        stage="execution",
        system_prompt=EXECUTION_PROMPT,
        context=context,
        advice=advice,
        mode=mode,
        extra_task_instructions=(
            f"Prepare personalized outreach drafts for up to {max_contacts} contacts. "
            f"Preferred subject line: {subject_line or 'none'}. "
            "Return JSON with a drafts array of {contact_id, subject, body}."
        ),
    )
    drafts = response.get("drafts")
    if drafts is None:
        drafts = response.get("messages")
    if drafts is None:
        drafts = response.get("emails")
    normalized_drafts = _normalize_drafts(drafts, context, max_contacts)
    normalized = {
        "drafts": normalized_drafts,
        "chat_message": response.get("chat_message") or "",
        "next_step_suggestion": response.get("next_step_suggestion") or "",
        "should_move_to_next_stage": bool(response.get("should_move_to_next_stage")),
        "next_stage": response.get("next_stage") or "execution",
    }
    return normalized, {
        "provider": trace.provider,
        "mode": trace.mode,
        "used_advice": trace.used_advice,
        "assistant_id": trace.assistant_id,
        "thread_id": trace.thread_id,
    }


def run_image_ad_prompt_agent(
    context: dict,
    *,
    backboard: BackboardStageService,
    project_id: str,
    advice: str | None = None,
    mode: str = "baseline",
) -> tuple[dict, dict]:
    def _build_fallback_prompt(project_context: dict) -> str:
        project = project_context.get("project") or {}
        brief = project_context.get("brief") or {}
        research = project_context.get("research") or {}
        positioning_versions = project_context.get("positioning_versions") or []
        selected_positioning = next((p for p in positioning_versions if p.get("selected")), None) or (
            positioning_versions[0] if positioning_versions else {}
        )
        pains = research.get("pain_points") or []
        wedges = research.get("wedges") or []

        project_name = project.get("name") or "the product"
        audience = brief.get("audience") or selected_positioning.get("icp") or "the core target users"
        problem = brief.get("problem") or "a clear recurring user pain point"
        wedge = selected_positioning.get("wedge") or (wedges[0].get("label") if wedges else "a differentiated positioning wedge")
        headline = selected_positioning.get("headline") or f"{project_name}: {wedge}"
        primary_pain = pains[0].get("label") if pains else "friction in the current workflow"

        return (
            f"Create a premium, conversion-focused digital advertisement image for {project_name}. "
            f"Audience: {audience}. Core problem: {problem}. Primary pain: {primary_pain}. Differentiation wedge: {wedge}. "
            "Art direction: modern startup campaign aesthetic, clean but emotionally resonant, high contrast focal hierarchy, "
            "single clear hero subject representing the target user in an authentic environment where the pain is visible and the outcome is aspirational. "
            "Composition: rule-of-thirds, strong foreground-midground separation, directional leading lines toward the hero and value moment, "
            "ample negative space for optional headline lockup. Camera/style: photorealistic commercial photography look, 35mm lens feel, "
            "shallow depth of field, crisp detail on face/hands/product interaction, subtle filmic grain, realistic skin and materials, "
            "natural posture and believable expressions. Lighting: cinematic key light with soft fill and controlled rim light, "
            "golden-hour warmth blended with cool practicals for depth. Color palette: brand-safe modern palette with confident contrast "
            "(teal/blue accents against warm neutrals), avoid muddy tones. "
            f"Optional overlay copy reference (do not render literal text unless requested): headline '{headline}'. "
            "Output requirements: one hero ad visual, no collage, no watermark, no logo distortion, no gibberish text, no uncanny anatomy, "
            "no extra limbs/fingers, no low-res artifacts, no oversaturation. Render at ultra-high detail, ad-ready quality."
        )

    def _looks_low_quality(prompt_text: str) -> bool:
        stripped = (prompt_text or "").strip()
        if len(stripped) < 280:
            return True
        low_signal_markers = [
            "based on the github repositories",
            "provide the project's core problem statement",
            "what's the primary user pain point",
        ]
        lowered = stripped.lower()
        return any(marker in lowered for marker in low_signal_markers)

    response, trace = backboard.run_json_stage(
        project_id=project_id,
        project_name=context.get("project", {}).get("name") or "project",
        stage="execution",
        system_prompt=EXECUTION_PROMPT,
        context=context,
        advice=advice,
        mode=mode,
        extra_task_instructions=(
            "Generate exactly one comprehensive, high-quality image generation prompt from the full project context. "
            "Return JSON with keys: title, generation_prompt. "
            "generation_prompt must be detailed enough to produce a strong image in ChatGPT or Gemini image generation. "
            "Quality requirements for generation_prompt: "
            "1) include explicit target audience + pain point + outcome, "
            "2) include art direction, composition, camera/lens feel, lighting, color palette, and realism constraints, "
            "3) include ad-performance constraints (single clear focal subject and conversion intent), "
            "4) include negative constraints (no watermark, no gibberish text, no distorted anatomy), "
            "5) output as one polished prompt paragraph, not bullets."
        ),
    )
    generation_prompt = response.get("generation_prompt") or ""
    if _looks_low_quality(generation_prompt):
        generation_prompt = _build_fallback_prompt(context)

    normalized = {
        "title": response.get("title") or "Image Ad Draft",
        "generation_prompt": generation_prompt,
        "chat_message": response.get("chat_message") or "",
        "next_step_suggestion": response.get("next_step_suggestion") or "",
    }
    return normalized, {
        "provider": trace.provider,
        "mode": trace.mode,
        "used_advice": trace.used_advice,
        "assistant_id": trace.assistant_id,
        "thread_id": trace.thread_id,
    }
