"""
Prediction service — orchestrates ML inference, risk classification, and explanation.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict

from app.core.logging_config import get_logger
from app.ml.explainer import explainer
from app.ml.feature_pipeline import build_feature_vector, get_feature_names
from app.ml.model_loader import model_loader
from app.models.schemas import PredictionResponse, TransactionRequest
from app.services.risk_engine import classify_risk, probability_to_score

logger = get_logger(__name__)


class PredictionService:
    """Orchestrates end-to-end risk prediction for a single transaction."""

    def predict(
        self,
        request: TransactionRequest,
        is_demo: bool = False,
    ) -> PredictionResponse:
        """
        Run full risk prediction pipeline.

        Steps:
        1. Validate model is loaded
        2. Build feature vector (centralized, deterministic)
        3. Run XGBoost inference
        4. Convert probability → risk score
        5. Classify risk level and action
        6. Explain prediction (SHAP or fallback)
        7. Return structured response

        Raises:
            RuntimeError: if model is not loaded
        """
        if not model_loader.is_loaded:
            raise RuntimeError(
                "Model is not loaded. Place final_risk_model.json in backend/model/ and restart."
            )

        raw = request.model_dump()
        transaction_id = raw.get("transaction_id") or f"TXN-{uuid.uuid4().hex[:12].upper()}"

        # ── 1. Feature assembly ────────────────────────────────────────────────
        feature_vector = build_feature_vector(raw)
        feature_names = get_feature_names()

        # ── 2. Inference ──────────────────────────────────────────────────────
        proba = model_loader.predict_proba(feature_vector)
        fraud_probability = float(proba[0])

        # ── 3. Risk classification ────────────────────────────────────────────
        risk_score = probability_to_score(fraud_probability)
        risk_level, action = classify_risk(risk_score)

        # ── 4. Explainability ─────────────────────────────────────────────────
        risk_factors, mitigating_factors = explainer.explain(
            feature_vector, feature_names, top_n=5
        )
        if not risk_factors:
            risk_factors = ["Transaction pattern flagged by risk model"]

        # ── 5. Logging ────────────────────────────────────────────────────────
        logger.info(
            "Prediction complete",
            extra={
                "transaction_id": transaction_id,
                "risk_score": risk_score,
                "risk_level": risk_level.value,
                "action": action.value,
                "is_demo": is_demo,
            },
        )

        return PredictionResponse(
            transaction_id=transaction_id,
            fraud_probability=round(fraud_probability, 4),
            risk_score=risk_score,
            risk_level=risk_level,
            action=action,
            risk_factors=risk_factors,
            mitigating_factors=mitigating_factors,
            model_version=model_loader.model_type,
            is_demo=is_demo,
            timestamp=datetime.utcnow(),
        )


prediction_service = PredictionService()
