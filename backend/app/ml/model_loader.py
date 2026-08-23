"""
XGBoost model loader.

Loads the model once at startup using XGBoost's native load_model().
Never uses pickle or joblib.
Exposes model metadata and a predict() method.
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from app.core.logging_config import get_logger

logger = get_logger(__name__)


class ModelLoader:
    """Singleton-style wrapper around the XGBoost model."""

    def __init__(self) -> None:
        self._model: Optional[Any] = None
        self._feature_config: Optional[Dict] = None
        self._load_timestamp: Optional[datetime] = None
        self._model_path: Optional[Path] = None

    # ── Loading ───────────────────────────────────────────────────────────────

    def load(self, model_path: Path, feature_config_path: Path) -> None:
        """Load XGBoost model and feature configuration from disk."""
        self._model_path = model_path

        # Load feature config first
        if not feature_config_path.exists():
            raise FileNotFoundError(
                f"Feature config not found: {feature_config_path}. "
                "Place feature_config.json in backend/model/"
            )
        with open(feature_config_path, "r") as f:
            self._feature_config = json.load(f)
        logger.info("Feature config loaded", extra={"path": str(feature_config_path)})

        # Load XGBoost model
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model file not found: {model_path}. "
                "Place final_risk_model.json in backend/model/"
            )

        try:
            import xgboost as xgb  # local import to keep startup fast on cold path
            self._model = xgb.Booster()
            self._model.load_model(str(model_path))
            self._load_timestamp = datetime.utcnow()
            logger.info(
                "XGBoost model loaded successfully",
                extra={"path": str(model_path), "timestamp": self._load_timestamp.isoformat()},
            )
        except Exception as exc:
            logger.error(f"Failed to load XGBoost model: {exc}")
            raise RuntimeError(f"Model load failed: {exc}") from exc

    # ── Inference ─────────────────────────────────────────────────────────────

    def predict_proba(self, feature_matrix: np.ndarray) -> np.ndarray:
        """
        Run inference on a (N, F) feature matrix.
        Returns fraud probability for each row.
        """
        if self._model is None:
            raise RuntimeError("Model is not loaded. Cannot run inference.")

        import xgboost as xgb

        dmatrix = xgb.DMatrix(feature_matrix, feature_names=self.feature_names)
        raw = self._model.predict(dmatrix)
        # XGBoost binary classification returns probability of positive class
        return raw.astype(float)

    # ── Properties ────────────────────────────────────────────────────────────

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def feature_names(self) -> List[str]:
        if self._feature_config is None:
            return []
        return self._feature_config.get("feature_order", [])

    @property
    def feature_config(self) -> Optional[Dict]:
        return self._feature_config

    @property
    def load_timestamp(self) -> Optional[datetime]:
        return self._load_timestamp

    @property
    def model_type(self) -> str:
        return "XGBoost (Gradient Boosted Trees)"

    @property
    def feature_importance(self) -> Dict[str, float]:
        """Return feature importance scores from the booster (weight-based)."""
        if self._model is None:
            return {}
        try:
            scores = self._model.get_score(importance_type="gain")
            total = sum(scores.values()) or 1.0
            return {k: round(v / total, 4) for k, v in sorted(scores.items(), key=lambda x: -x[1])}
        except Exception:
            return {}


# ── Module-level singleton ─────────────────────────────────────────────────────
model_loader = ModelLoader()
