"""
Backend test suite for RiskGraph.
Tests health, risk engine, schemas, model loading, and API error handling.
"""
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client():
    """Sync test client (model may not be loaded — tests handle both states)."""
    from app.main import app
    with TestClient(app) as c:
        yield c


# ──────────────────────────────────────────────────────────────────────────────
# 1. Health endpoint
# ──────────────────────────────────────────────────────────────────────────────

def test_health_returns_200(client):
    resp = client.get("/health")
    assert resp.status_code == 200


def test_health_response_structure(client):
    resp = client.get("/health")
    data = resp.json()
    assert "status" in data
    assert "model_loaded" in data
    assert "version" in data
    assert "timestamp" in data


def test_health_status_is_string(client):
    resp = client.get("/health")
    assert isinstance(resp.json()["status"], str)


# ──────────────────────────────────────────────────────────────────────────────
# 2. Risk engine unit tests (no model needed)
# ──────────────────────────────────────────────────────────────────────────────

def test_risk_classify_low():
    from app.services.risk_engine import classify_risk
    from app.models.schemas import RiskLevel, RiskAction
    level, action = classify_risk(15)
    assert level == RiskLevel.LOW
    assert action == RiskAction.APPROVE


def test_risk_classify_medium():
    from app.services.risk_engine import classify_risk
    from app.models.schemas import RiskLevel, RiskAction
    level, action = classify_risk(50)
    assert level == RiskLevel.MEDIUM
    assert action == RiskAction.REVIEW


def test_risk_classify_high():
    from app.services.risk_engine import classify_risk
    from app.models.schemas import RiskLevel, RiskAction
    level, action = classify_risk(75)
    assert level == RiskLevel.HIGH
    assert action == RiskAction.VERIFY


def test_risk_classify_critical():
    from app.services.risk_engine import classify_risk
    from app.models.schemas import RiskLevel, RiskAction
    level, action = classify_risk(90)
    assert level == RiskLevel.CRITICAL
    assert action == RiskAction.BLOCK


def test_risk_score_boundaries():
    from app.services.risk_engine import probability_to_score
    assert probability_to_score(0.0) == 0
    assert probability_to_score(1.0) == 100
    assert probability_to_score(0.5) == 50
    assert 0 <= probability_to_score(0.3) <= 100


def test_risk_score_boundary_clamp():
    from app.services.risk_engine import probability_to_score
    # Should clamp, not crash
    assert probability_to_score(1.1) == 100
    assert probability_to_score(-0.1) == 0


# ──────────────────────────────────────────────────────────────────────────────
# 3. Schema validation
# ──────────────────────────────────────────────────────────────────────────────

def test_transaction_request_valid():
    from app.models.schemas import TransactionRequest
    req = TransactionRequest(
        TransactionAmt=150.0,
        hour=14,
        day=2,
        card1=9499.0,
    )
    assert req.TransactionAmt == 150.0


def test_transaction_request_missing_required_fields():
    from app.models.schemas import TransactionRequest
    import pydantic
    with pytest.raises(pydantic.ValidationError):
        TransactionRequest(hour=10, day=1, card1=1234)


def test_transaction_request_invalid_amount():
    from app.models.schemas import TransactionRequest
    import pydantic
    with pytest.raises(pydantic.ValidationError):
        TransactionRequest(TransactionAmt=-50.0, hour=10, day=1, card1=1234)


def test_transaction_request_invalid_hour():
    from app.models.schemas import TransactionRequest
    import pydantic
    with pytest.raises(pydantic.ValidationError):
        TransactionRequest(TransactionAmt=100.0, hour=25, day=1, card1=1234)


# ──────────────────────────────────────────────────────────────────────────────
# 4. Predict endpoint — model not loaded (503 expected)
# ──────────────────────────────────────────────────────────────────────────────

def test_predict_without_model_returns_503_or_prediction(client):
    """
    When model is not loaded, predict should return 503.
    When model is loaded, it should return 200 with a valid prediction.
    """
    payload = {
        "TransactionAmt": 150.0,
        "hour": 14,
        "day": 2,
        "card1": 9499.0,
        "card2": 321.0,
        "card3": 150.0,
        "card4": "visa",
        "card5": "226",
        "addr1": 315.0,
        "addr2": 87.0,
        "ProductCD": "W",
        "P_emaildomain": "gmail.com",
        "missing_count": 2.0,
        "card1_txn_count": 5.0,
        "card1_amount_mean": 120.0,
        "device_changed": 0,
    }
    resp = client.post("/api/v1/risk/predict", json=payload)
    # Either model loaded (200) or not (503)
    assert resp.status_code in (200, 503)


def test_predict_missing_required_field(client):
    """Missing TransactionAmt must return 422."""
    payload = {"hour": 14, "day": 2, "card1": 9499.0}
    resp = client.post("/api/v1/risk/predict", json=payload)
    assert resp.status_code == 422


def test_predict_invalid_data_type(client):
    """Non-numeric TransactionAmt must return 422."""
    payload = {
        "TransactionAmt": "not_a_number",
        "hour": 14,
        "day": 2,
        "card1": 9499.0,
    }
    resp = client.post("/api/v1/risk/predict", json=payload)
    assert resp.status_code == 422


# ──────────────────────────────────────────────────────────────────────────────
# 5. API error handling
# ──────────────────────────────────────────────────────────────────────────────

def test_404_on_unknown_transaction(client):
    resp = client.get("/api/v1/transactions/NONEXISTENT-TXN-ID")
    assert resp.status_code == 404


def test_docs_endpoint_accessible(client):
    resp = client.get("/docs")
    assert resp.status_code == 200


def test_openapi_schema_accessible(client):
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    schema = resp.json()
    assert "paths" in schema


# ──────────────────────────────────────────────────────────────────────────────
# 6. Model loading
# ──────────────────────────────────────────────────────────────────────────────

def test_model_loader_not_loaded_initially():
    """Fresh ModelLoader should not be loaded."""
    from app.ml.model_loader import ModelLoader
    fresh = ModelLoader()
    assert not fresh.is_loaded


def test_model_loader_missing_file_raises():
    from app.ml.model_loader import ModelLoader
    from pathlib import Path
    fresh = ModelLoader()
    # Load feature config first (it exists), then bogus model path
    with pytest.raises(FileNotFoundError):
        fresh.load(
            model_path=Path("nonexistent_model.json"),
            feature_config_path=Path("model/feature_config.json"),
        )
