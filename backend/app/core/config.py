"""
Application configuration using pydantic-settings.
All settings are loaded from environment variables or .env file.
"""
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        protected_namespaces=(),
    )

    # ── Application ───────────────────────────────────────────────────────────
    app_name: str = "RiskGraph"
    app_version: str = "1.0.0"
    app_env: str = "development"
    debug: bool = False

    # ── Server ────────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000

    # ── CORS — stored as plain str to avoid pydantic-settings List parsing ────
    allowed_origins: str = (
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    )

    # ── Model ─────────────────────────────────────────────────────────────────
    model_path: str = "model/final_risk_model.json"
    feature_config_path: str = "model/feature_config.json"
    model_version: str = "1.0.0"

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./riskgraph.db"

    # ── Logging ───────────────────────────────────────────────────────────────
    log_level: str = "INFO"
    log_format: str = "json"

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS: handles comma-sep or JSON array."""
        raw = self.allowed_origins.strip()
        if raw.startswith("["):
            import json
            try:
                return json.loads(raw)
            except Exception:
                pass
        return [o.strip() for o in raw.split(",") if o.strip()]

    @property
    def model_path_absolute(self) -> Path:
        return Path(self.model_path)

    @property
    def feature_config_path_absolute(self) -> Path:
        return Path(self.feature_config_path)


@lru_cache()
def get_settings() -> Settings:
    return Settings()
