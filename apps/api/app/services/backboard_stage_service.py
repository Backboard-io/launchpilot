from __future__ import annotations

import hashlib
import json
import re
import ast
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.integrations.backboard_client import BackboardClient, BackboardRequestError
from app.services.memory_service import get_project_memory_value, upsert_project_memory

VALID_MODES = {"baseline", "deepen", "retry", "extend"}

MODE_GUIDANCE = {
    "baseline": "Generate a high-confidence baseline output suitable for immediate execution.",
    "deepen": "Go deeper: increase specificity, include stronger rationale, and add practical detail.",
    "retry": "Take a materially different approach than prior attempts while staying grounded in context.",
    "extend": "Extend existing work by building on earlier outputs rather than replacing everything.",
}


@dataclass(slots=True)
class BackboardRunTrace:
    provider: str
    mode: str
    used_advice: bool
    assistant_id: str | None = None
    thread_id: str | None = None
    fallback_reason: str | None = None


class BackboardStageService:
    def __init__(self, db: Session, settings: Settings | None = None):
        self.db = db
        self.settings = settings or get_settings()
        self._client: BackboardClient | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.settings.backboard_api_key)

    def run_json_stage(
        self,
        *,
        project_id: str,
        project_name: str,
        stage: str,
        system_prompt: str,
        context: dict[str, Any],
        advice: str | None,
        mode: str,
        extra_task_instructions: str | None = None,
    ) -> tuple[dict[str, Any], BackboardRunTrace]:
        normalized_mode = mode if mode in VALID_MODES else "baseline"
        if not self.enabled:
            raise BackboardRequestError("BACKBOARD_API_KEY is not configured")

        message = self._build_stage_message(
            mode=normalized_mode,
            context=context,
            advice=advice,
            extra_task_instructions=extra_task_instructions,
        )

        did_reset_session = False
        did_reset_after_parse_failure = False
        while True:
            assistant_id, thread_id = self._get_or_create_stage_session(
                project_id=project_id,
                project_name=project_name,
                stage=stage,
                system_prompt=system_prompt,
            )

            try:
                result = self.client.add_message(
                    thread_id=thread_id,
                    content=message,
                    memory=self.settings.backboard_memory_mode,
                    llm_provider=self.settings.backboard_llm_provider,
                    model_name=self.settings.backboard_model_name,
                )
            except BackboardRequestError as exc:
                if self._is_prompt_template_error(str(exc)) and not did_reset_session:
                    assistant_id, thread_id = self._reset_stage_session(
                        project_id=project_id,
                        project_name=project_name,
                        stage=stage,
                        system_prompt=system_prompt,
                    )
                    did_reset_session = True
                    continue
                raise

            text = self._extract_text_content(result)
            if self._is_prompt_template_error(text) and not did_reset_session:
                assistant_id, thread_id = self._reset_stage_session(
                    project_id=project_id,
                    project_name=project_name,
                    stage=stage,
                    system_prompt=system_prompt,
                )
                did_reset_session = True
                continue

            try:
                parsed = self._parse_json_response(text)
                break
            except BackboardRequestError as first_exc:
                # Ask the same thread to reformat its previous response as strict JSON.
                repair = self.client.add_message(
                    thread_id=thread_id,
                    content=(
                        "Reformat your previous answer as valid JSON only. "
                        "Do not include markdown, prose, or code fences. "
                        "Return exactly one JSON object."
                    ),
                    memory="Readonly",
                    llm_provider=self.settings.backboard_llm_provider,
                    model_name=self.settings.backboard_model_name,
                )
                repaired_text = self._extract_text_content(repair)
                if self._is_prompt_template_error(repaired_text) and not did_reset_session:
                    assistant_id, thread_id = self._reset_stage_session(
                        project_id=project_id,
                        project_name=project_name,
                        stage=stage,
                        system_prompt=system_prompt,
                    )
                    did_reset_session = True
                    continue
                try:
                    parsed = self._parse_json_response(repaired_text)
                    break
                except BackboardRequestError as second_exc:
                    # Final attempt: rerun full generation with hard JSON constraints.
                    strict_message = (
                        f"{message}\n\n"
                        "CRITICAL OUTPUT RULES:\n"
                        "- Return exactly one JSON object.\n"
                        "- Use only double-quoted keys and strings.\n"
                        "- No markdown, no code fences, no prose.\n"
                        "- No comments, no trailing commas.\n"
                        "- Output must be parseable by Python json.loads.\n"
                    )
                    strict = self.client.add_message(
                        thread_id=thread_id,
                        content=strict_message,
                        memory="Readonly",
                        llm_provider=self.settings.backboard_llm_provider,
                        model_name=self.settings.backboard_model_name,
                    )
                    strict_text = self._extract_text_content(strict)
                    if self._is_prompt_template_error(strict_text) and not did_reset_session:
                        assistant_id, thread_id = self._reset_stage_session(
                            project_id=project_id,
                            project_name=project_name,
                            stage=stage,
                            system_prompt=system_prompt,
                        )
                        did_reset_session = True
                        continue
                    try:
                        parsed = self._parse_json_response(strict_text)
                        break
                    except BackboardRequestError as third_exc:
                        compact = self.client.add_message(
                            thread_id=thread_id,
                            content=(
                                "Generate a fresh response from scratch as compact valid JSON only. "
                                "Do not include markdown or explanations. "
                                "Keep string values concise to avoid truncation. "
                                "Return exactly one JSON object matching the required schema."
                            ),
                            memory="Readonly",
                            llm_provider=self.settings.backboard_llm_provider,
                            model_name=self.settings.backboard_model_name,
                        )
                        compact_text = self._extract_text_content(compact)
                        try:
                            parsed = self._parse_json_response(compact_text)
                            break
                        except BackboardRequestError as fourth_exc:
                            if not did_reset_after_parse_failure:
                                assistant_id, thread_id = self._reset_stage_session(
                                    project_id=project_id,
                                    project_name=project_name,
                                    stage=stage,
                                    system_prompt=system_prompt,
                                )
                                did_reset_after_parse_failure = True
                                continue
                            snippet = compact_text[:800].replace("\n", " ")
                            raise BackboardRequestError(
                                f"{fourth_exc}. first_parse={first_exc}. repair_parse={second_exc}. strict_parse={third_exc}. compact_snippet={snippet}"
                            ) from fourth_exc

        upsert_project_memory(
            self.db,
            project_id,
            f"backboard_{stage}_last_output",
            {"mode": normalized_mode, "advice": advice, "output": parsed},
            "agent_output",
            "backboard",
        )

        return parsed, BackboardRunTrace(
            provider="backboard",
            mode=normalized_mode,
            used_advice=bool(advice and advice.strip()),
            assistant_id=assistant_id,
            thread_id=thread_id,
        )

    @property
    def client(self) -> BackboardClient:
        if self._client is None:
            if not self.settings.backboard_api_key:
                raise BackboardRequestError("BACKBOARD_API_KEY is not configured")
            self._client = BackboardClient(
                api_key=self.settings.backboard_api_key,
                base_url=self.settings.backboard_base_url,
            )
        return self._client

    def _get_or_create_stage_session(
        self,
        *,
        project_id: str,
        project_name: str,
        stage: str,
        system_prompt: str,
    ) -> tuple[str, str]:
        assistant_key = f"backboard_{stage}_assistant"
        thread_key = f"backboard_{stage}_thread"
        prompt_fingerprint = self._prompt_fingerprint(system_prompt)

        assistant_mem = get_project_memory_value(self.db, project_id, assistant_key, {})
        thread_mem = get_project_memory_value(self.db, project_id, thread_key, {})
        assistant_id = assistant_mem.get("assistant_id")
        stored_fingerprint = assistant_mem.get("system_prompt_fingerprint")
        thread_id = thread_mem.get("thread_id")

        if assistant_id and stored_fingerprint != prompt_fingerprint:
            # Prompt changed: rotate assistant + thread so new system prompt is applied.
            assistant_id = None
            thread_id = None

        if not assistant_id:
            assistant_name = f"{project_name or 'project'}-{stage}-agent"
            assistant_id = self.client.create_assistant(
                name=assistant_name,
                system_prompt=self._escape_prompt_template_braces(system_prompt),
            )
            upsert_project_memory(
                self.db,
                project_id,
                assistant_key,
                {"assistant_id": assistant_id, "system_prompt_fingerprint": prompt_fingerprint},
                "integration_ref",
                "backboard",
            )

        if not thread_id:
            thread_id = self.client.create_thread(assistant_id)
            upsert_project_memory(
                self.db,
                project_id,
                thread_key,
                {"thread_id": thread_id},
                "integration_ref",
                "backboard",
            )

        return assistant_id, thread_id

    def _reset_stage_session(
        self,
        *,
        project_id: str,
        project_name: str,
        stage: str,
        system_prompt: str,
    ) -> tuple[str, str]:
        assistant_key = f"backboard_{stage}_assistant"
        thread_key = f"backboard_{stage}_thread"
        prompt_fingerprint = self._prompt_fingerprint(system_prompt)

        assistant_name = f"{project_name or 'project'}-{stage}-agent"
        assistant_id = self.client.create_assistant(
            name=assistant_name,
            system_prompt=self._escape_prompt_template_braces(system_prompt),
        )
        thread_id = self.client.create_thread(assistant_id)

        upsert_project_memory(
            self.db,
            project_id,
            assistant_key,
            {"assistant_id": assistant_id, "system_prompt_fingerprint": prompt_fingerprint},
            "integration_ref",
            "backboard",
        )
        upsert_project_memory(
            self.db,
            project_id,
            thread_key,
            {"thread_id": thread_id},
            "integration_ref",
            "backboard",
        )
        return assistant_id, thread_id

    def _build_stage_message(
        self,
        *,
        mode: str,
        context: dict[str, Any],
        advice: str | None,
        extra_task_instructions: str | None = None,
    ) -> str:
        advice_text = advice.strip() if advice else "None provided."
        parts = [
            f"Mode: {mode}",
            f"Mode guidance: {MODE_GUIDANCE.get(mode, MODE_GUIDANCE['baseline'])}",
            "User guidance:",
            advice_text,
        ]
        if extra_task_instructions:
            parts.extend(["Task extension:", extra_task_instructions.strip()])
        parts.extend(
            [
                "Project context JSON:",
                json.dumps(context, ensure_ascii=True),
                "Return valid JSON only. Do not include markdown fences.",
            ]
        )
        return "\n\n".join(parts)

    def _escape_prompt_template_braces(self, text: str) -> str:
        return text.replace("{", "{{").replace("}", "}}")

    def _prompt_fingerprint(self, text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def _is_prompt_template_error(self, error_text: str) -> bool:
        lowered = error_text.lower()
        return "invalid_prompt_input" in lowered or "missing variables" in lowered or "llm invocation error" in lowered

    def _extract_text_content(self, result: dict[str, Any]) -> str:
        text = self._extract_text_fragment(result)
        if text:
            return text
        return json.dumps(result, ensure_ascii=True)

    def _extract_text_fragment(self, value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, str):
            return value.strip()
        if isinstance(value, list):
            chunks = [self._extract_text_fragment(item) for item in value]
            return "\n".join(chunk for chunk in chunks if chunk).strip()
        if not isinstance(value, dict):
            return ""

        direct_text = value.get("content") or value.get("text")
        if isinstance(direct_text, str):
            return direct_text.strip()
        if isinstance(direct_text, list):
            nested = self._extract_text_fragment(direct_text)
            if nested:
                return nested

        for key in ("message", "data", "response"):
            nested = value.get(key)
            nested_text = self._extract_text_fragment(nested)
            if nested_text:
                return nested_text
        return ""

    def _parse_json_response(self, content: str) -> dict[str, Any]:
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
            cleaned = re.sub(r"```$", "", cleaned).strip()

        parsed = self._parse_json_or_python_dict(cleaned)
        if isinstance(parsed, dict):
            return parsed

        extracted = self._extract_first_json_object(cleaned)
        if extracted is None:
            start = cleaned.find("{")
            if start == -1:
                raise BackboardRequestError("Backboard response did not contain JSON object content")
            # If the model output is truncated, keep everything from the first object start
            # and let repair logic close quotes/braces.
            extracted = cleaned[start:]

        parsed = self._parse_json_or_python_dict(extracted)
        if isinstance(parsed, dict):
            return parsed

        repaired = self._repair_maybe_truncated_json(extracted)
        parsed = self._parse_json_or_python_dict(repaired)
        if not isinstance(parsed, dict):
            raise BackboardRequestError("Backboard response contained invalid JSON")

        return parsed

    def _parse_json_or_python_dict(self, text: str) -> dict[str, Any] | None:
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
            if isinstance(parsed, list) and parsed and isinstance(parsed[0], dict):
                return parsed[0]
        except json.JSONDecodeError:
            pass

        try:
            parsed = ast.literal_eval(text)
            if isinstance(parsed, dict):
                return parsed
            if isinstance(parsed, list) and parsed and isinstance(parsed[0], dict):
                return parsed[0]
        except (ValueError, SyntaxError):
            pass

        return None

    def _extract_first_json_object(self, text: str) -> str | None:
        start = text.find("{")
        if start == -1:
            return None

        depth = 0
        in_string = False
        escape = False
        for idx in range(start, len(text)):
            ch = text[idx]
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                continue

            if ch == '"':
                in_string = True
                continue

            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start : idx + 1]
        return None

    def _repair_maybe_truncated_json(self, text: str) -> str:
        candidate = text.strip()
        if not candidate:
            return candidate

        # Remove trailing commas before closing containers.
        candidate = re.sub(r",(\s*[}\]])", r"\1", candidate)

        # Close unbalanced double quotes if the final quote is missing.
        quote_count = 0
        escape = False
        for ch in candidate:
            if escape:
                escape = False
                continue
            if ch == "\\":
                escape = True
                continue
            if ch == '"':
                quote_count += 1
        if quote_count % 2 == 1:
            candidate += '"'

        # Append missing closing braces/brackets based on stack.
        stack: list[str] = []
        in_string = False
        escape = False
        for ch in candidate:
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                continue

            if ch == '"':
                in_string = True
                continue

            if ch == "{":
                stack.append("}")
            elif ch == "[":
                stack.append("]")
            elif ch in ("}", "]") and stack and ch == stack[-1]:
                stack.pop()

        if stack:
            candidate += "".join(reversed(stack))
        candidate = re.sub(r",(\s*[}\]])", r"\1", candidate)
        return candidate
