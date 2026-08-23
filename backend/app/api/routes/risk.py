"""
Risk prediction routes.
POST /api/v1/risk/predict
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from app.models.schemas import ErrorResponse, PredictionResponse, TransactionRequest
from app.services.prediction_service import prediction_service
from app.services.transaction_service import AsyncSessionLocal, save_prediction

logger = get_logger(__name__)
router = APIRouter()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Assess transaction risk",
    responses={
        422: {"model": ErrorResponse, "description": "Validation error — missing or invalid fields"},
        503: {"model": ErrorResponse, "description": "Model not loaded"},
    },
    tags=["Risk"],
)
async def predict_risk(
    request: TransactionRequest,
    db: AsyncSession = Depends(get_db),
) -> PredictionResponse:
    """
    Analyse a payment transaction and return:
    - Fraud probability
    - Risk score (0–100)
    - Risk level (LOW / MEDIUM / HIGH / CRITICAL)
    - Recommended action (APPROVE / REVIEW / VERIFY / BLOCK)
    - Human-readable risk factors
    - SHAP-based explainability

    **This endpoint will return a validation error if required fields are missing.**
    It will never silently produce a prediction with fake data.
    """
    try:
        result = prediction_service.predict(request, is_demo=request.is_demo if hasattr(request, "is_demo") else False)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "MODEL_NOT_LOADED", "message": str(exc)},
        )
    except Exception as exc:
        logger.error(f"Prediction failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "PREDICTION_FAILED", "message": "An unexpected error occurred during risk assessment."},
        )

    # Persist to DB (best-effort — don't fail the prediction if DB is down)
    try:
        await save_prediction(db, result, request.TransactionAmt)
    except Exception as exc:
        logger.warning(f"Failed to persist transaction: {exc}")

    return result
