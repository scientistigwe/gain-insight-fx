from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class AlertBase(BaseModel):
    user_id: str
    currency_code: str
    buy_threshold: Optional[float] = None
    sell_threshold: Optional[float] = None


class AlertCreate(AlertBase):
    pass


class AlertUpdate(AlertBase):
    pass


class Alert(AlertBase):
    id: str
    created_at: datetime
    updated_at: datetime

"""
Alert schemas.
This module defines Pydantic models for alert data validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.currency import CurrencyResponse


class AlertBase(BaseModel):
    """Base alert schema with common attributes"""
    base_currency_id: int
    quote_currency_id: int
    threshold: float = Field(..., gt=0)
    is_above_threshold: bool = True  # True for alerts when rate goes above threshold, False for below
    is_active: bool = True


class AlertCreate(AlertBase):
    """Schema for creating a new alert"""
    user_id: Optional[int] = None  # Optional as it can be taken from current user


class AlertUpdate(BaseModel):
    """Schema for updating an alert"""
    threshold: Optional[float] = Field(None, gt=0)
    is_above_threshold: Optional[bool] = None
    is_active: Optional[bool] = None


class AlertResponse(AlertBase):
    """Schema for returning alert data"""
    id: int
    user_id: int
    is_triggered: bool
    last_triggered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        """Configuration for the Pydantic model"""
        from_attributes = True


class AlertDetailResponse(AlertResponse):
    """Schema for returning detailed alert data with related data"""
    base_currency: CurrencyResponse
    quote_currency: CurrencyResponse
    
    # Current exchange rate information
    current_rate: Optional[float] = None
    rate_difference: Optional[float] = None  # Difference between current rate and threshold
    
    class Config:
        """Configuration for the Pydantic model"""
        from_attributes = True


class AlertTriggeredNotification(BaseModel):
    """Schema for alert triggered notification"""
    alert_id: int
    user_id: int
    base_currency_code: str
    quote_currency_code: str
    threshold: float
    current_rate: float
    is_above_threshold: bool
    triggered_at: datetime