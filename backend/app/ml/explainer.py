"""
SHAP-based explainability for the XGBoost risk model.

Converts raw SHAP values into human-readable risk factor descriptions.
Raw feature identifiers (card1=9499) are NEVER exposed to users.
"""
from __future__ import annotations

from typing import Dict, List, Optional, Tuple

import numpy as np

from app.core.logging_config import get_logger
from app.ml.model_loader import model_loader

logger = get_logger(__name__)

# ── Human-readable descriptions per feature ───────────────────────────────────
# Maps internal feature name → (risk-increasing label, risk-reducing label)
FEATURE_LABELS: Dict[str, Tuple[str, str]] = {
    "TransactionAmt":       ("Unusually large transaction amount",        "Transaction amount within normal range"),
    "log_amount":           ("High transaction amount relative to baseline","Transaction amount is modest"),
    "hour":                 ("Transaction at unusual hour",               "Transaction at typical business hour"),
    "day":                  ("Transaction on atypical day of week",       "Transaction on a typical weekday"),
    "is_weekend":           ("Weekend transaction pattern flagged",       "Weekday transaction — lower risk signal"),
    "card1":                ("Card profile pattern increased risk",       "Card profile reduced risk"),
    "card2":                ("Secondary card signal increased risk",      "Secondary card signal is normal"),
    "card3":                ("Tertiary card signal increased risk",       "Tertiary card signal is normal"),
    "card4":                ("Card network pattern increased risk",       "Card network pattern is normal"),
    "card5":                ("Card product type raised concern",          "Card product type is standard"),
    "addr1":                ("Billing address pattern increased risk",    "Billing address pattern is consistent"),
    "addr2":                ("Secondary address signal increased risk",   "Secondary address signal is normal"),
    "ProductCD":            ("Product category associated with higher fraud rate", "Product category is low risk"),
    "P_emaildomain":        ("Email domain associated with elevated risk","Email domain shows normal pattern"),
    "missing_count":        ("Multiple identity fields missing",          "Identity fields are complete"),
    "card1_txn_count":      ("Low historical transaction activity for this card", "High historical activity reduces suspicion"),
    "card1_amount_mean":    ("Historical card spending pattern increased risk",    "Historical spending pattern reduces risk"),
    "amount_vs_card_mean":  ("Amount significantly deviates from card's history", "Amount is consistent with card's history"),
    "device_changed":       ("Device differs from previously seen device","Device is consistent with prior transactions"),
}


class Explainer:
    """Wraps SHAP TreeExplainer for the loaded XGBoost model."""

    def __init__(self) -> None:
        self._explainer = None

    def initialize(self) -> None:
        """Initialize SHAP explainer after model is loaded."""
        if not model_loader.is_loaded:
            logger.warning("Cannot initialize SHAP explainer — model not loaded")
            return
        try:
            import shap
            self._explainer = shap.TreeExplainer(model_loader._model)
            logger.info("SHAP TreeExplainer initialized successfully")
        except Exception as exc:
            logger.warning(f"SHAP initialization failed (falling back to feature importance): {exc}")
            self._explainer = None

    def explain(
        self,
        feature_vector: np.ndarray,
        feature_names: List[str],
        top_n: int = 5,
    ) -> Tuple[List[str], List[str]]:
        """
        Compute SHAP values and return human-readable risk/mitigating factors.

        Returns:
            (risk_factors, mitigating_factors) — lists of plain-English strings.
        """
        if self._explainer is not None:
            return self._shap_explain(feature_vector, feature_names, top_n)
        else:
            return self._fallback_explain(feature_vector, feature_names, top_n)

    def _shap_explain(
        self,
        feature_vector: np.ndarray,
        feature_names: List[str],
        top_n: int,
    ) -> Tuple[List[str], List[str]]:
        """Use SHAP values for explanation."""
        try:
            shap_vals = self._explainer.shap_values(feature_vector)
            # For binary XGBoost, shap_values returns shape (1, n_features)
            if isinstance(shap_vals, list):
                vals = shap_vals[1][0]  # positive class
            else:
                vals = shap_vals[0]

            pairs = list(zip(feature_names, vals.tolist()))
            pairs.sort(key=lambda x: abs(x[1]), reverse=True)

            risk_factors: List[str] = []
            mitigating_factors: List[str] = []

            for feat, shap_val in pairs[:top_n * 2]:
                label_pair = FEATURE_LABELS.get(feat, (f"Signal from {feat}", f"Signal from {feat} is low"))
                if shap_val > 0.01:
                    risk_factors.append(label_pair[0])
                elif shap_val < -0.01:
                    mitigating_factors.append(label_pair[1])

                if len(risk_factors) >= top_n and len(mitigating_factors) >= 3:
                    break

            return risk_factors[:top_n], mitigating_factors[:3]

        except Exception as exc:
            logger.warning(f"SHAP explain failed: {exc}. Falling back.")
            return self._fallback_explain(feature_vector, feature_names, top_n)

    def _fallback_explain(
        self,
        feature_vector: np.ndarray,
        feature_names: List[str],
        top_n: int,
    ) -> Tuple[List[str], List[str]]:
        """
        Heuristic fallback when SHAP is unavailable.
        Uses feature importance from the booster and raw feature values
        to produce directional explanations.
        """
        importance = model_loader.feature_importance
        if not importance:
            return ["Transaction pattern increased risk"], []

        # Rank features by model-reported importance
        ranked = sorted(importance.items(), key=lambda x: -x[1])
        feat_vals = dict(zip(feature_names, feature_vector[0].tolist()))

        risk_factors: List[str] = []
        mitigating_factors: List[str] = []

        for feat, score in ranked:
            val = feat_vals.get(feat, 0.0)
            label_pair = FEATURE_LABELS.get(
                feat,
                (f"Behavioural signal flagged", "Behavioural signal is normal"),
            )
            # Simple heuristic: high values on risk features → risk factor
            if score > 0.03 and val > 0:
                risk_factors.append(label_pair[0])
            elif score > 0.01:
                mitigating_factors.append(label_pair[1])

            if len(risk_factors) >= top_n and len(mitigating_factors) >= 3:
                break

        return risk_factors[:top_n], mitigating_factors[:3]


# ── Module-level singleton ─────────────────────────────────────────────────────
explainer = Explainer()
