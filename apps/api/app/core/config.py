from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Growth Launchpad API"
    app_env: str = "development"
    app_jwt_namespace: str = Field(default="https://growthlaunchpad.app")
    web_app_url: str = "http://localhost:3000"

    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    supabase_db_url: str = Field(default="postgresql+psycopg://postgres:postgres@localhost:5432/postgres")

    auth0_domain: str | None = None
    auth0_audience: str | None = None
    auth0_issuer: str | None = None

    backboard_api_key: str | None = None
    backboard_default_model: str = "gpt-4.1-mini"

    google_genai_api_key: str | None = None

    resend_api_key: str | None = None
    resend_from_email: str = "noreply@growthlaunchpad.app"

    enable_video_render: bool = True
    enable_token_vault: bool = False
    worker_poll_interval_seconds: int = 3


@lru_cache
def get_settings() -> Settings:
    return Settings()
