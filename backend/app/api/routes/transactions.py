"""
Transaction list and detail routes.
GET /api/v1/transactions
GET /api/v1/transactions/{transaction_id}
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import TransactionListResponse, TransactionRecord
from app.services.transaction_service import (
    AsyncSessionLocal,
    get_transaction_by_id,
    get_transactions,
)

router = APIRouter()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.get(
    "/",
    response_model=TransactionListResponse,
    summary="List transactions",
    tags=["Transactions"],
)
async def list_transactions(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Results per page"),
    risk_level: Optional[str] = Query(default=None, description="Filter by risk level (LOW/MEDIUM/HIGH/CRITICAL)"),
    action: Optional[str] = Query(default=None, description="Filter by action (APPROVE/REVIEW/VERIFY/BLOCK)"),
    db: AsyncSession = Depends(get_db),
) -> TransactionListResponse:
    """Paginated list of assessed transactions with optional filtering."""
    return await get_transactions(db, page=page, page_size=page_size, risk_level=risk_level, action=action)


@router.get(
    "/{transaction_id}",
    response_model=TransactionRecord,
    summary="Get transaction details",
    tags=["Transactions"],
)
async def get_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
) -> TransactionRecord:
    """Retrieve full details for a single transaction by ID."""
    record = await get_transaction_by_id(db, transaction_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "NOT_FOUND", "message": f"Transaction {transaction_id!r} not found."},
        )
    return record
