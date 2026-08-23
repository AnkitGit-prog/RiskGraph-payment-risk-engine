"""
Transaction persistence service using SQLite + SQLAlchemy (async).
Designed so the data layer can be swapped for PostgreSQL without logic changes.
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, Boolean, select, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.models.schemas import PredictionResponse, TransactionRecord, TransactionListResponse

logger = get_logger(__name__)
settings = get_settings()


# ── ORM Models ────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


class TransactionORM(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String(64), unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    risk_score = Column(Integer, nullable=False)
    fraud_probability = Column(Float, nullable=False)
    risk_level = Column(String(16), nullable=False)
    action = Column(String(16), nullable=False)
    risk_factors = Column(Text, nullable=False, default="[]")   # JSON array
    model_version = Column(String(64), nullable=False)
    is_demo = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)


# ── Engine + Session factory ──────────────────────────────────────────────────

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def init_db() -> None:
    """Create tables if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialised")


# ── CRUD ──────────────────────────────────────────────────────────────────────

async def save_prediction(
    session: AsyncSession,
    prediction: PredictionResponse,
    amount: float,
) -> TransactionORM:
    """Persist a prediction result."""
    record = TransactionORM(
        transaction_id=prediction.transaction_id,
        amount=amount,
        risk_score=prediction.risk_score,
        fraud_probability=prediction.fraud_probability,
        risk_level=prediction.risk_level.value,
        action=prediction.action.value,
        risk_factors=json.dumps(prediction.risk_factors),
        model_version=prediction.model_version,
        is_demo=prediction.is_demo,
        timestamp=prediction.timestamp,
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record


async def get_transactions(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    risk_level: Optional[str] = None,
    action: Optional[str] = None,
) -> TransactionListResponse:
    """Paginated transaction list with optional filters."""
    query = select(TransactionORM).order_by(TransactionORM.timestamp.desc())

    if risk_level:
        query = query.where(TransactionORM.risk_level == risk_level.upper())
    if action:
        query = query.where(TransactionORM.action == action.upper())

    # Count total
    count_q = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_q)).scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    result = await session.execute(query.offset(offset).limit(page_size))
    rows = result.scalars().all()

    return TransactionListResponse(
        total=total,
        page=page,
        page_size=page_size,
        transactions=[_orm_to_schema(r) for r in rows],
    )


async def get_transaction_by_id(
    session: AsyncSession,
    transaction_id: str,
) -> Optional[TransactionRecord]:
    """Fetch a single transaction by ID."""
    result = await session.execute(
        select(TransactionORM).where(TransactionORM.transaction_id == transaction_id)
    )
    row = result.scalar_one_or_none()
    if row is None:
        return None
    return _orm_to_schema(row)


def _orm_to_schema(row: TransactionORM) -> TransactionRecord:
    from app.models.schemas import RiskLevel, RiskAction
    return TransactionRecord(
        id=row.id,
        transaction_id=row.transaction_id,
        amount=row.amount,
        risk_score=row.risk_score,
        fraud_probability=row.fraud_probability,
        risk_level=RiskLevel(row.risk_level),
        action=RiskAction(row.action),
        risk_factors=json.loads(row.risk_factors or "[]"),
        model_version=row.model_version,
        is_demo=row.is_demo,
        timestamp=row.timestamp,
    )
