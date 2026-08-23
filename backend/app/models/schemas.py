"""
Pydantic schemas for all API request/response models.
Kept in a single module for easy cross-reference.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


# ──────────────────────────────────────────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────────────────────────────────────────

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskAction(str, Enum):
    APPROVE = "APPROVE"
    REVIEW = "REVIEW"
    VERIFY = "VERIFY"
    BLOCK = "BLOCK"


class ProductCD(str, Enum):
    W = "W"
    H = "H"
    C = "C"
    S = "S"
    R = "R"


# ──────────────────────────────────────────────────────────────────────────────
# Request Schemas
# ──────────────────────────────────────────────────────────────────────────────

class TransactionRequest(BaseModel):
    """
    Input transaction for risk prediction.
    All fields must be provided; missing behavioural fields should use
    their sentinel/default values (e.g. card1_txn_count=0).
    """

    # ── Core transaction fields ────────────────────────────────────────────────
    TransactionAmt: float = Field(
        ...,
        gt=0,
        description="Transaction amount in USD (must be > 0)",
        examples=[150.00],
    )
    hour: int = Field(
        ...,
        ge=0,
        le=23,
        description="Hour of transaction (0-23 UTC)",
    )
    day: int = Field(
        ...,
        ge=0,
        le=6,
        description="Day of week (0=Monday … 6=Sunday)",
    )

    # ── Card identifiers (anonymised numerics from training data) ──────────────
    card1: float = Field(
        ...,
        description="Anonymised card identifier 1",
    )
    card2: float = Field(
        default=0.0,
        description="Anonymised card identifier 2 (use 0 if unknown)",
    )
    card3: float = Field(
        default=0.0,
        description="Anonymised card identifier 3 (use 0 if unknown)",
    )
    card4: Optional[str] = Field(
        default=None,
        description="Card network (visa / mastercard / american express / discover)",
    )
    card5: Optional[str] = Field(
        default=None,
        description="Card product type identifier",
    )

    # ── Address fields ────────────────────────────────────────────────────────
    addr1: float = Field(
        default=0.0,
        description="Billing address identifier 1",
    )
    addr2: float = Field(
        default=0.0,
        description="Billing address identifier 2",
    )

    # ── Product / email ───────────────────────────────────────────────────────
    ProductCD: Optional[str] = Field(
        default=None,
        description="Product code: W / H / C / S / R",
    )
    P_emaildomain: Optional[str] = Field(
        default=None,
        description="Purchaser email domain (e.g. gmail.com)",
    )

    # ── Engineered behavioural features ───────────────────────────────────────
    missing_count: float = Field(
        default=0.0,
        ge=0,
        description="Number of missing identity fields in this transaction",
    )
    card1_txn_count: float = Field(
        default=0.0,
        ge=0,
        description="Historical transaction count for this card",
    )
    card1_amount_mean: float = Field(
        default=0.0,
        ge=0,
        description="Historical average transaction amount for this card",
    )
    device_changed: int = Field(
        default=0,
        ge=0,
        le=1,
        description="1 if device changed from last known device for this card, 0 otherwise",
    )

    # Optional: transaction ID from the caller
    transaction_id: Optional[str] = Field(
        default=None,
        description="Caller-supplied transaction ID (auto-generated if omitted)",
    )
    is_demo: bool = Field(
        default=False,
        description="Flag indicating if transaction is a demo/synthetic transaction",
    )

    @field_validator("card4", mode="before")
    @classmethod
    def normalise_card4(cls, v):
        if v is None:
            return None
        return str(v).lower().strip()

    @field_validator("ProductCD", mode="before")
    @classmethod
    def normalise_product(cls, v):
        if v is None:
            return None
        return str(v).upper().strip()

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "TransactionAmt": 150.0,
                    "hour": 14,
                    "day": 2,
                    "card1": 9499,
                    "card2": 321,
                    "card3": 150,
                    "card4": "visa",
                    "card5": "226",
                    "addr1": 315,
                    "addr2": 87,
                    "ProductCD": "W",
                    "P_emaildomain": "gmail.com",
                    "missing_count": 2,
                    "card1_txn_count": 5,
                    "card1_amount_mean": 120.0,
                    "device_changed": 0,
                }
            ]
        }
    }


# ──────────────────────────────────────────────────────────────────────────────
# Response Schemas
# ──────────────────────────────────────────────────────────────────────────────

class RiskFactor(BaseModel):
    description: str
    direction: str = Field(description="'increased' or 'reduced'")
    magnitude: Optional[float] = None


class PredictionResponse(BaseModel):
    transaction_id: str
    fraud_probability: float = Field(ge=0, le=1)
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    action: RiskAction
    risk_factors: List[str]
    mitigating_factors: List[str]
    model_version: str
    is_demo: bool = False
    timestamp: datetime


class TransactionRecord(BaseModel):
    id: int
    transaction_id: str
    amount: float
    risk_score: int
    fraud_probability: float
    risk_level: RiskLevel
    action: RiskAction
    risk_factors: List[str]
    model_version: str
    is_demo: bool
    timestamp: datetime

    model_config = {"from_attributes": True}


class TransactionListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    transactions: List[TransactionRecord]


class ModelInfoResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_type: str
    model_version: str
    features_count: int
    features: List[str]
    is_loaded: bool
    load_timestamp: Optional[datetime]


class MetricsResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    """
    Validation/benchmark metrics from model development.
    These are offline evaluation metrics — not live production metrics.
    """
    model_version: str
    evaluation_note: str = (
        "Offline validation metrics from development. "
        "Not representative of live production performance."
    )
    pr_auc: float
    roc_auc: float
    precision: float
    recall: float
    f1_score: float
    baseline_pr_auc: float
    baseline_roc_auc: float
    feature_importance: Dict[str, float]


class HealthResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    status: str
    app_name: str
    version: str
    model_loaded: bool
    database_connected: bool
    timestamp: datetime


class ErrorResponse(BaseModel):
    error: str
    message: str
    detail: Optional[Any] = None
