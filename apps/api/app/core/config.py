from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Growth Launchpad API"
    app_env: str = "development"
    web_app_url: str = "http://localhost:3000"

    # Auth mode:
    # - dev: local fallback user + scopes
    # - oauth: JWT verification via AUTH_JWT_SECRET (NextAuth / Google / GitHub)
    auth_mode: str = "dev"
    app_jwt_namespace: str = Field(default="https://growthlaunchpad.app")
    auth_jwt_secret: str | None = None
    google_drive_default_folder_id: str | None = None
    api_base_url: str = "http://localhost:8000"
    connector_google_client_id: str | None = None
    connector_google_client_secret: str | None = None
    connector_github_client_id: str | None = None
    connector_github_client_secret: str | None = None
    github_callback_url: str = "/v1/connectors/github/callback"

    database_url: str = Field(default="sqlite+pysqlite:///./data/launchpilot.db")

    # Admin: comma-separated emails; these users get is_admin and can access /admin
    admin_emails: str = Field(default="dev@growthlaunchpad.app", description="Comma-separated admin emails")

    resend_api_key: str | None = None
    resend_from_email: str = "noreply@growthlaunchpad.app"

    # Backboard agent orchestration
    backboard_api_key: str | None = None
    backboard_base_url: str = "https://app.backboard.io/api"
    backboard_llm_provider: str = "openai"
    backboard_model_name: str = "gpt-4o"
    backboard_memory_mode: str = "On"


@lru_cache
def get_settings() -> Settings:
    return Settings()
