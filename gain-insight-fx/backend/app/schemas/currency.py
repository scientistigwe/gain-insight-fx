from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime


class CurrencyBase(BaseModel):
    code: str
    name: str
    symbol: Optional[str] = None


class CurrencyCreate(CurrencyBase):
    pass


class Currency(CurrencyBase):
    id: str
    created_at: datetime
    updated_at: datetime


class ExchangeRateBase(BaseModel):
    currency_code: str
    base_currency: str = "NGN"
    rate: float
    source: Optional[str] = None


class ExchangeRateCreate(ExchangeRateBase):
    pass


class ExchangeRate(ExchangeRateBase):
    id: str
    timestamp: datetime


class CurrencyTrend(BaseModel):
    currency_code: str
    currency_name: str
    current_rate: float
    min_rate: float
    max_rate: float
    avg_rate: float
    trend_direction: str  # "rising", "falling", "stable"
    volatility: float
    predictions: Dict[str, float]  # e.g., {"7_day": 450.5, "14_day": 455.0, "30_day": 460.2}
    data_points: int