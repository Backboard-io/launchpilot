from __future__ import annotations

import uuid

from app.core.config import get_settings


class GoogleMediaClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    def generate_image_ads(self, prompts: list[str]) -> list[dict]:
        outputs: list[dict] = []
        for prompt in prompts:
            outputs.append(
                {
                    "prompt": prompt,
                    "storage_path": f"generated-assets/images/{uuid.uuid4().hex}.png",
                    "provider": "google-genai" if self.settings.google_genai_api_key else "mock",
                }
            )
        return outputs

    def render_video(self, prompt: str) -> dict:
        if not self.settings.enable_video_render:
            raise ValueError("Video rendering is disabled")
        return {
            "prompt": prompt,
            "storage_path": f"video-renders/{uuid.uuid4().hex}.mp4",
            "provider": "google-genai" if self.settings.google_genai_api_key else "mock",
        }
