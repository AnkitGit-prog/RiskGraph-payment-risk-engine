"""
Model info and metrics routes.
GET /api/v1/model/info
GET /api/v1/metrics
"""
from fastapi import APIRouter, HTTPException, status

from app.ml.model_loader import model_loader
from app.models.schemas import MetricsResponse, ModelInfoResponse
from app.services.risk_engine import get_threshold_summary

router = APIRouter()


@router.get(
    "/info",
    response_model=ModelInfoResponse,
    summary="Model information",
    tags=["Model"],
)
async def model_info() -> ModelInfoResponse:
    """
    Returns metadata about the loaded XGBoost model including feature list
    and load timestamp.
    """
    return ModelInfoResponse(
        model_type=model_loader.model_type,
        model_version="1.0.0",
        features_count=len(model_loader.feature_names),
        features=model_loader.feature_names,
        is_loaded=model_loader.is_loaded,
        load_timestamp=model_loader.load_timestamp,
    )


@router.get(
    "/metrics",
    response_model=MetricsResponse,
    summary="Model evaluation metrics",
    tags=["Model"],
)
async def model_metrics() -> MetricsResponse:
    """
    Returns offline validation/benchmark metrics from model development.

    **Important**: These are evaluation metrics from the training/validation phase.
    They are NOT live production performance metrics.
    """
    if not model_loader.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "MODEL_NOT_LOADED", "message": "Model not available."},
        )

    return MetricsResponse(
        model_version="1.0.0",
        pr_auc=0.2380,
        roc_auc=0.7998,
        precision=0.1402,
        recall=0.5930,
        f1_score=0.2268,
        baseline_pr_auc=0.0459,
        baseline_roc_auc=0.5801,
        feature_importance=model_loader.feature_importance,
    )
