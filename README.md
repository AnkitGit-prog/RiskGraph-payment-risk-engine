<div align="center">

# RISKGRAPH
### Context-Aware AI Payment Risk Engine

**Production-style AI fraud and risk detection platform — Razorpay AI Buildathon 2024**

![Status](https://img.shields.io/badge/status-production--demo-blue)
![Python](https://img.shields.io/badge/python-3.10+-blue)
![React](https://img.shields.io/badge/react-18-61dafb)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Overview

RISKGRAPH is a **production-style** AI-powered payment risk intelligence platform built for the Razorpay AI Buildathon. It demonstrates how a modern payment gateway could:

- **Assess** every transaction's fraud risk in real-time using a trained XGBoost model
- **Explain** exactly *why* a transaction received its risk score (SHAP-based)
- **Recommend** a clear action: APPROVE / REVIEW / VERIFY / BLOCK
- **Visualize** risk analytics through an enterprise-grade dashboard

> ⚠️ **Disclaimer**: This is an independent demonstration platform for the AI Buildathon. It is NOT affiliated with, endorsed by, or representative of Razorpay's internal systems, risk thresholds, or production infrastructure.

---

## Problem Statement

Traditional fraud detection systems suffer from two failure modes:
1. **Too aggressive** — they block legitimate customers, hurting conversion
2. **Too lenient** — they let fraudulent transactions through, causing losses

The key insight: **a transaction should not be judged in isolation**. Context matters:
- What is this card's historical spend pattern?
- Does the current amount deviate significantly from normal?
- Has the device changed?
- Are identity signals complete?

---

## Key Innovation

**Context-Aware Risk Intelligence**

```
Transaction Context
+  Historical Card Behaviour (card1_txn_count, card1_amount_mean)
+  Amount Deviation (amount_vs_card_mean)
+  Device Context (device_changed)
+  Identity Signals (missing_count, addr, email)
+  XGBoost ML Model
+  SHAP Explainability
═══════════════════════════
= Actionable Risk Decision with Human-Readable Explanation
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    RISKGRAPH Platform                    │
├───────────────────────┬─────────────────────────────────┤
│    Frontend (React)   │       Backend (FastAPI)          │
│                       │                                  │
│  ┌─────────────────┐  │  ┌──────────────────────────┐   │
│  │   Dashboard     │  │  │  Prediction Service       │   │
│  │   RiskAnalyzer  │◄─┼─►│  Risk Engine (Policy)    │   │
│  │   Transactions  │  │  │  SHAP Explainer           │   │
│  │   ReviewQueue   │  │  │  Feature Pipeline         │   │
│  │   ModelIntel    │  │  │  XGBoost Model Loader     │   │
│  └─────────────────┘  │  └──────────────────────────┘   │
│                       │             │                    │
│                       │  ┌──────────▼──────────────┐    │
│                       │  │   SQLite Database        │    │
│                       │  │   (PostgreSQL-ready)     │    │
│                       │  └─────────────────────────┘    │
└───────────────────────┴─────────────────────────────────┘
```

---

## ML Pipeline

### Model
- **Algorithm**: XGBoost (Gradient Boosted Trees)
- **Task**: Binary classification (fraud vs. genuine)
- **Training Data**: IEEE-CIS Fraud Detection dataset
- **Load mechanism**: XGBoost native `load_model()` — never pickle/joblib

### Feature Engineering (19 features)

| Feature | Type | Description |
|---------|------|-------------|
| `TransactionAmt` | Numeric | Transaction amount |
| `log_amount` | Derived | Log-transformed amount (reduces skew) |
| `hour` | Numeric | Hour of transaction (UTC) |
| `day` | Numeric | Day of week |
| `is_weekend` | Derived | 1 if weekend, 0 otherwise |
| `card1-5` | Numeric/Categorical | Card identifiers and network |
| `addr1`, `addr2` | Numeric | Billing address signals |
| `ProductCD` | Categorical | Product category |
| `P_emaildomain` | Categorical | Purchaser email domain |
| `missing_count` | Numeric | Missing identity fields count |
| `card1_txn_count` | Behavioural | Historical transaction count for card |
| `card1_amount_mean` | Behavioural | Historical average amount for card |
| `amount_vs_card_mean` | Derived | Current amount ÷ historical average |
| `device_changed` | Behavioural | Device differs from prior known device |

> **Note**: `card6` is explicitly excluded from the final model.

### Model Evaluation (Offline Validation Metrics)

| Metric | XGBoost Model | Logistic Baseline |
|--------|--------------|-------------------|
| PR-AUC | 0.2380 | 0.0459 |
| ROC-AUC | 0.7998 | 0.5801 |
| Precision | 0.1402 | — |
| Recall | 0.5930 | — |
| F1 | 0.2268 | — |

*These are offline validation metrics from development. Not live production metrics.*

---

## Risk Engine

Policy-layer thresholds (independent of the ML model):

| Score | Risk Level | Action |
|-------|-----------|--------|
| 0–29 | LOW | APPROVE |
| 30–69 | MEDIUM | REVIEW |
| 70–84 | HIGH | VERIFY |
| 85–100 | CRITICAL | BLOCK |

> These are demo platform thresholds — NOT Razorpay's production thresholds.

---

## Explainability

Every prediction includes human-readable explanations:

**Example output:**
```
Risk Score: 82 / 100    |   HIGH RISK   |   VERIFY PAYMENT

Why this transaction received this score:
▲ Amount significantly deviates from card's history
▲ Device differs from previously seen device
▲ Transaction at unusual hour
▲ Multiple identity fields missing

Mitigating factors:
▼ Card network pattern is normal
▼ Historical activity reduced suspicion
```

Raw feature identifiers (e.g., `card1 = 9499`) are NEVER shown to users.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ML Model | XGBoost 2.0 |
| Explainability | SHAP TreeExplainer |
| Backend API | FastAPI + Pydantic |
| Database | SQLite (aiosqlite + SQLAlchemy) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Routing | React Router v6 |

---

## Project Structure

```
RiskGraph/
├── backend/
│   ├── app/
│   │   ├── main.py                  FastAPI app + lifespan
│   │   ├── api/routes/
│   │   │   ├── health.py            GET /health
│   │   │   ├── risk.py              POST /api/v1/risk/predict
│   │   │   ├── transactions.py      GET /api/v1/transactions
│   │   │   └── model.py             GET /api/v1/model/info + /metrics
│   │   ├── core/
│   │   │   ├── config.py            Pydantic settings
│   │   │   └── logging_config.py    Structured logging
│   │   ├── models/schemas.py        All Pydantic schemas
│   │   ├── ml/
│   │   │   ├── model_loader.py      XGBoost native load_model()
│   │   │   ├── feature_pipeline.py  Centralized feature assembly
│   │   │   └── explainer.py         SHAP + fallback explanations
│   │   └── services/
│   │       ├── risk_engine.py       Policy thresholds
│   │       ├── prediction_service.py End-to-end orchestration
│   │       └── transaction_service.py SQLite CRUD
│   ├── model/
│   │   ├── final_risk_model.json    ← PLACE YOUR MODEL HERE (gitignored)
│   │   └── feature_config.json      Feature configuration
│   ├── tests/test_main.py           Comprehensive test suite
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── pages/                   5 dashboard pages
│       ├── components/              Reusable UI components
│       ├── services/api.ts          Typed API client
│       ├── types/                   TypeScript interfaces
│       └── data/demoTransactions.ts Synthetic demo data
│
├── .gitignore                       model/*.json excluded
└── README.md
```

---

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Your trained model files

### 1. Clone & Set Up

```bash
git clone <your-repo-url>
cd RiskGraph
```

### 2. Place Model Files

**This is required before starting the backend.**

```
backend/model/final_risk_model.json    ← Your trained XGBoost model
backend/model/feature_config.json      ← Already included in the repo
```

### 3. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173`

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
APP_NAME=RiskGraph
APP_VERSION=1.0.0
APP_ENV=development
DEBUG=true
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
MODEL_PATH=model/final_risk_model.json
FEATURE_CONFIG_PATH=model/feature_config.json
MODEL_VERSION=1.0.0
DATABASE_URL=sqlite+aiosqlite:///./riskgraph.db
LOG_LEVEL=INFO
```

Frontend environment (optional — create `frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```

---

## API Documentation

FastAPI automatic docs: **http://localhost:8000/docs**

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | System health check |
| POST | `/api/v1/risk/predict` | Assess transaction risk |
| GET | `/api/v1/transactions/` | List transactions (paginated) |
| GET | `/api/v1/transactions/{id}` | Transaction details |
| GET | `/api/v1/model/info` | Model metadata |
| GET | `/api/v1/metrics` | Validation metrics |

### Example Prediction Request

```bash
curl -X POST http://localhost:8000/api/v1/risk/predict \
  -H "Content-Type: application/json" \
  -d '{
    "TransactionAmt": 1250.00,
    "hour": 2,
    "day": 5,
    "card1": 7412,
    "card4": "visa",
    "card1_txn_count": 2,
    "card1_amount_mean": 88.0,
    "device_changed": 1,
    "missing_count": 6
  }'
```

### Example Response

```json
{
  "transaction_id": "TXN-AB12CD34EF56",
  "fraud_probability": 0.7821,
  "risk_score": 78,
  "risk_level": "HIGH",
  "action": "VERIFY",
  "risk_factors": [
    "Amount significantly deviates from card's history",
    "Device differs from previously seen device",
    "Transaction at unusual hour",
    "Low historical transaction activity for this card",
    "Multiple identity fields missing"
  ],
  "mitigating_factors": [
    "Card network pattern is normal"
  ],
  "model_version": "XGBoost (Gradient Boosted Trees)",
  "is_demo": false,
  "timestamp": "2024-08-23T13:00:00Z"
}
```

---

## Testing

```bash
cd backend
python -m pytest tests/ -v
```

Test coverage includes:
- ✅ Health endpoint (status, structure, fields)
- ✅ Risk engine unit tests (all 4 risk levels + boundaries)
- ✅ Schema validation (valid, missing required, invalid types)
- ✅ Predict endpoint (503 without model, 422 on bad input)
- ✅ Transaction 404 handling
- ✅ API docs availability
- ✅ Model loader failure modes

---

## Demo Transactions

The Risk Analyzer page includes 4 pre-built demo scenarios:

| Scenario | Risk | Amount | Key Signal |
|----------|------|--------|------------|
| Routine Purchase | LOW | $45.99 | Consistent history |
| Elevated Amount | MEDIUM | $389.00 | Above historical average |
| Behavioural Anomaly | HIGH | $1,250.00 | Device changed, late night |
| Suspected Fraud | CRITICAL | $4,999.99 | New card, all signals red |

All demo transactions are clearly labelled **DEMO TRANSACTION — Synthetic Data**.

---

## Security

- ✅ Pydantic input validation on all endpoints
- ✅ CORS configured via environment variables
- ✅ Structured error responses (no stack traces to clients)
- ✅ Secrets via environment variables only
- ✅ Model files excluded from Git via `.gitignore`
- ✅ No CVV, raw card numbers, or PCI-sensitive data stored
- ✅ Non-root Docker user

---

## Limitations

1. **Fraud rate**: The IEEE-CIS dataset is highly imbalanced (~3.5% fraud). Low precision is expected at high recall thresholds.
2. **Synthetic behavioural features**: `card1_txn_count`, `card1_amount_mean`, `device_changed` are pre-computed; a production system would compute these in real-time from a card transaction history store.
3. **No streaming**: Currently synchronous; a production system would use Kafka/Flink for real-time streaming.
4. **SQLite**: Suitable for development; swap for PostgreSQL for production scale.

---

## Future Improvements

- Velocity monitoring (N transactions in T seconds)
- Graph-based entity relationships (card → email → device)
- Merchant-level risk scoring
- Adaptive authentication triggers
- Real-time streaming (Kafka + Flink)
- Model drift monitoring
- Online learning / feedback loop from confirmed fraud
- Redis caching for card behaviour lookups
- PostgreSQL + connection pooling

---

## Buildathon Context

Built for the **Razorpay AI Buildathon**.

Demonstrates:
- Production ML model serving (XGBoost native format)
- Explainable AI (SHAP) for trust and regulatory compliance
- Behavioural context as a risk signal
- Clean fintech product design
- Full-stack integration from model → API → UI

---

*RiskGraph is an independent project and is not affiliated with or endorsed by Razorpay.*
