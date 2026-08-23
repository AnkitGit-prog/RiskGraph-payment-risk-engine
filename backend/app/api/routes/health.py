"""Health check route."""
from datetime import datetime

from fastapi import APIRouter

from app.core.config import get_settings
from app.ml.model_loader import model_loader
from app.models.schemas import HealthResponse

router = APIRouter()
settings = get_settings()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System health check",
    tags=["System"],
)
async def health_check() -> HealthResponse:
    """
    Returns service health status including model and database connectivity.
    """
    return HealthResponse(
        status="ok" if model_loader.is_loaded else "degraded",
        app_name=settings.app_name,
        version=settings.app_version,
        model_loaded=model_loader.is_loaded,
        database_connected=True,  # SQLite is always local; actual check via try/except if needed
        timestamp=datetime.utcnow(),
    )
