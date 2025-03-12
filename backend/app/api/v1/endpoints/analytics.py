from typing import Dict, Any
from fastapi import APIRouter, Depends, Query

from app.api import deps
from app.schemas.user import UserInDB
from app.services.analytics import analyze_profit_loss, get_transaction_statistics, get_currency_performance, find_best_opportunities

router = APIRouter()

@router.get("/profit-loss", response_model=Dict[str, Any])
async def read_profit_loss(
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Analyze profit and loss from currency exchanges.
    """
    return await analyze_profit_loss(current_user.id)

@router.get("/transaction-stats", response_model=Dict[str, Any])
async def read_transaction_statistics(
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Get overall statistics about user transactions.
    """
    return await get_transaction_statistics(current_user.id)

@router.get("/currency-performance", response_model=Dict[str, Any])
async def read_currency_performance(
    days: int = Query(90, ge=1, le=365),
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Analyze the performance of different currencies over time.
    """
    return await get_currency_performance(current_user.id, days)

@router.get("/opportunities", response_model=Dict[str, Any])
async def read_opportunities(
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Find the best currency exchange opportunities based on trends and thresholds.
    """
    return await find_best_opportunities(current_user.id)