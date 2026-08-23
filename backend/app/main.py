"""
RiskGraph FastAPI application entry point.

Startup sequence:
1. Configure logging
2. Init database
3. Load XGBoost model
4. Init SHAP explainer
5. Register routers
"""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import health, model, risk, transactions
from app.core.config import get_settings
from app.core.logging_config import configure_logging, get_logger
from app.ml.explainer import explainer
from app.ml.model_loader import model_loader
from app.services.transaction_service import init_db

settings = get_settings()
configure_logging(settings.log_level, settings.log_format)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")

    # Database
    await init_db()

    # Model — non-fatal if missing (return 503 on predict calls)
    model_path = Path(settings.model_path)
    feature_config_path = Path(settings.feature_config_path)
    try:
        model_loader.load(model_path, feature_config_path)
        explainer.initialize()
        logger.info("Model and explainer ready")
    except FileNotFoundError as exc:
        logger.warning(
            f"Model file not found — running in degraded mode. "
            f"Place model files in backend/model/. Error: {exc}"
        )
    except Exception as exc:
        logger.error(f"Model load error: {exc}")

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("Shutting down RiskGraph")


# ── App factory ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="RiskGraph — Context-Aware AI Payment Risk Engine",
    description=(
        "Production-style AI payment fraud and risk detection API. "
        "Built for the Razorpay AI Buildathon. "
        "Provides real-time transaction risk assessment, SHAP-based explainability, "
        "and structured risk decisions."
    ),
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global error handlers ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_ERROR", "message": "An unexpected error occurred."},
    )


# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(risk.router, prefix="/api/v1/risk")
app.include_router(transactions.router, prefix="/api/v1/transactions")
app.include_router(model.router, prefix="/api/v1/model")

# Convenience alias — /api/v1/metrics maps to model metrics
from app.api.routes.model import model_metrics  # noqa: E402
from fastapi import APIRouter  # noqa: E402
metrics_router = APIRouter()
metrics_router.add_api_route(
    "/api/v1/metrics",
    model_metrics,
    methods=["GET"],
    summary="Model evaluation metrics",
    tags=["Model"],
)
app.include_router(metrics_router)
