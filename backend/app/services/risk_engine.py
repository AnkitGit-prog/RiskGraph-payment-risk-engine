"""
Risk engine — policy layer that converts ML output to business decisions.

IMPORTANT: These thresholds are product-policy decisions for this demo platform.
They are NOT Razorpay's internal production risk thresholds.
"""
from __future__ import annotations

from app.models.schemas import RiskAction, RiskLevel

# ── Policy thresholds ──────────────────────────────────────────────────────────
# Score range → Risk level → Recommended action
# These are independently configurable; do not couple them to the ML model.
RISK_THRESHOLDS = [
    (0,  29,  RiskLevel.LOW,      RiskAction.APPROVE),
    (30, 69,  RiskLevel.MEDIUM,   RiskAction.REVIEW),
    (70, 84,  RiskLevel.HIGH,     RiskAction.VERIFY),
    (85, 100, RiskLevel.CRITICAL, RiskAction.BLOCK),
]


def probability_to_score(fraud_probability: float) -> int:
    """
    Convert fraud probability [0, 1] to risk score [0, 100].
    Uses a simple linear scaling; can be replaced with a calibrated
    mapping without touching inference code.
    """
    score = round(fraud_probability * 100)
    return max(0, min(100, score))


def classify_risk(risk_score: int) -> tuple[RiskLevel, RiskAction]:
    """
    Map a risk score [0–100] to (RiskLevel, RiskAction) using policy thresholds.

    Args:
        risk_score: integer between 0 and 100

    Returns:
        (RiskLevel, RiskAction)
    """
    for low, high, level, action in RISK_THRESHOLDS:
        if low <= risk_score <= high:
            return level, action
    # Fallback — should not be reached with a valid score
    return RiskLevel.CRITICAL, RiskAction.BLOCK


def get_threshold_summary() -> list[dict]:
    """Return the policy threshold table as a list of dicts (for API docs)."""
    return [
        {
            "score_min": low,
            "score_max": high,
            "risk_level": level.value,
            "action": action.value,
        }
        for low, high, level, action in RISK_THRESHOLDS
    ]
