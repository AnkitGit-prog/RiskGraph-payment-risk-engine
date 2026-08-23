"""
Feature pipeline — preprocessing and feature assembly.

This is the SINGLE source of truth for feature order and encoding.
No other module should replicate the feature list.
"""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from app.core.logging_config import get_logger
from app.ml.model_loader import model_loader

logger = get_logger(__name__)

MISSING_SENTINEL = "__MISSING__"


def _get_feature_config() -> Dict:
    cfg = model_loader.feature_config
    if cfg is None:
        raise RuntimeError("Feature config is not loaded. Model must be initialised first.")
    return cfg


def _encode_categorical(value: Optional[str], feature_name: str) -> float:
    """
    Encode a categorical feature as a float using ordinal encoding
    consistent with how training handled categories.

    Returns the ordinal index of the value within the known category list,
    or 0.0 for __MISSING__ / unknown values.
    """
    cfg = _get_feature_config()
    cat_map: Dict[str, Dict] = cfg.get("categorical_features", {})

    if feature_name not in cat_map:
        # Not a categorical feature — return as-is or 0
        return 0.0

    known_values: List[str] = cat_map[feature_name]["values"]
    default = cat_map[feature_name].get("default", MISSING_SENTINEL)

    if value is None or value == "":
        resolved = default
    else:
        resolved = value.strip()

    if resolved == MISSING_SENTINEL or resolved not in known_values:
        return 0.0

    return float(known_values.index(resolved) + 1)  # 1-indexed; 0 = missing


def build_feature_vector(raw: Dict[str, Any]) -> np.ndarray:
    """
    Convert a validated request dict into the exact feature vector
    expected by the XGBoost model.

    Feature order is always read from feature_config.json — never hardcoded here.

    Args:
        raw: Dict of input fields (from TransactionRequest.model_dump())

    Returns:
        np.ndarray of shape (1, n_features) with dtype float32
    """
    cfg = _get_feature_config()
    feature_order: List[str] = cfg["feature_order"]
    cat_features: Dict = cfg.get("categorical_features", {})

    # ── Derived features ──────────────────────────────────────────────────────
    transaction_amt = float(raw["TransactionAmt"])
    log_amount = math.log1p(transaction_amt)
    is_weekend = 1 if int(raw.get("day", 0)) >= 5 else 0

    card1_amount_mean = float(raw.get("card1_amount_mean", 0.0))
    if card1_amount_mean > 0:
        amount_vs_card_mean = transaction_amt / card1_amount_mean
    else:
        amount_vs_card_mean = 1.0  # neutral ratio when no history

    derived = {
        "log_amount": log_amount,
        "is_weekend": is_weekend,
        "amount_vs_card_mean": amount_vs_card_mean,
    }

    # ── Assemble feature vector in canonical order ────────────────────────────
    row: List[float] = []
    for feat in feature_order:
        if feat in derived:
            row.append(float(derived[feat]))
        elif feat in cat_features:
            row.append(_encode_categorical(raw.get(feat), feat))
        else:
            val = raw.get(feat, 0.0)
            if val is None:
                val = 0.0
            row.append(float(val))

    arr = np.array(row, dtype=np.float32).reshape(1, -1)
    logger.debug(f"Feature vector assembled: shape={arr.shape}")
    return arr


def get_feature_names() -> List[str]:
    """Return the canonical feature order."""
    return _get_feature_config()["feature_order"]
