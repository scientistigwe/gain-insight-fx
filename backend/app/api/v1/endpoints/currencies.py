from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api import deps
from app.schemas.user import UserInDB
from app.schemas.currency import ExchangeRate, CurrencyTrend
from app.services.currency import get_current_rates, get_historical_rates, get_currency_trend_analysis

router = APIRouter()

@router.get("/rates/current", response_model=List[ExchangeRate])
async def read_current_rates(
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Get current exchange rates for all tracked currencies.
    """
    return await get_current_rates()

@router.get("/rates/historical", response_model=List[ExchangeRate])
async def read_historical_rates(
    currency_code: str,
    days: int = Query(30, ge=1, le=365),
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Get historical exchange rates for a specific currency.
    """
    return await get_historical_rates(currency_code, days)

@router.get("/trends", response_model=CurrencyTrend)
async def read_currency_trends(
    currency_code: str,
    days: int = Query(30, ge=1, le=365),
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Get trend analysis for a specific currency.
    """
    return await get_currency_trend_analysis(currency_code, days)