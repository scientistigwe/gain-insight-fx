"""
Currency schemas.
This module defines Pydantic models for currency data validation.
"""
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, field_validator


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



class CurrencyBase(BaseModel):
    """Base currency schema with common attributes"""
    code: str = Field(..., min_length=3, max_length=3)
    name: str
    symbol: Optional[str] = None
    is_active: bool = True


class CurrencyCreate(CurrencyBase):
    """Schema for creating a new currency"""
    
    @field_validator('code')
    def code_must_be_uppercase(cls, v):
        """Validate that currency code is uppercase"""
        return v.upper()


class CurrencyUpdate(BaseModel):
    """Schema for updating a currency"""
    name: Optional[str] = None
    symbol: Optional[str] = None
    is_active: Optional[bool] = None


class CurrencyResponse(CurrencyBase):
    """Schema for returning currency data"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Configuration for the Pydantic model"""
        from_attributes = True


class ExchangeRateBase(BaseModel):
    """Base exchange rate schema with common attributes"""
    base_currency_id: int
    quote_currency_id: int
    rate: float = Field(..., gt=0)
    source: str
    timestamp: datetime


class ExchangeRateCreate(ExchangeRateBase):
    """Schema for creating a new exchange rate"""
    pass


class ExchangeRateResponse(ExchangeRateBase):
    """Schema for returning exchange rate data"""
    id: int
    created_at: datetime
    
    # Include related currency data
    base_currency: CurrencyResponse
    quote_currency: CurrencyResponse

    class Config:
        """Configuration for the Pydantic model"""
        from_attributes = True


class CurrencyPairResponse(BaseModel):
    """Schema for currency pair with exchange rate"""
    base_currency: CurrencyResponse
    quote_currency: CurrencyResponse
    rate: float
    source: str
    timestamp: datetime


class CurrencyRateHistory(BaseModel):
    """Schema for historical exchange rates"""
    currency_pair: str
    rates: List[dict]  # List of {date, rate} objects