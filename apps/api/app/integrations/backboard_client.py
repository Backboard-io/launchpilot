from __future__ import annotations

import uuid

from app.core.config import get_settings


class BackboardClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    def create_project_runtime(self, project_name: str) -> dict[str, str]:
        _ = project_name
        return {
            "assistant_id": f"asst_{uuid.uuid4().hex[:16]}",
            "research_thread_id": f"thr_{uuid.uuid4().hex[:16]}",
            "positioning_thread_id": f"thr_{uuid.uuid4().hex[:16]}",
            "execution_thread_id": f"thr_{uuid.uuid4().hex[:16]}",
        }

    def append_memory(self, assistant_id: str, key: str, value: dict) -> None:
        _ = (assistant_id, key, value)

    def run_thread(self, assistant_id: str, thread_id: str, instruction: str, context: dict) -> dict:
        _ = (assistant_id, thread_id, instruction, context)
        return {"message": "ok"}
