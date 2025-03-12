from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class TransactionBase(BaseModel):
    user_id: str
    from_currency: str
    to_currency: str
    amount: float
    exchange_rate: float
    fees: Optional[float] = 0.0
    type: str  # "sent" or "received"
    description: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    pass


class Transaction(TransactionBase):
    id: str
    created_at: datetime


"""
Transaction schemas.
This module defines Pydantic models for transaction data validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.currency import CurrencyResponse


class TransactionBase(BaseModel):
    """Base transaction schema with common attributes"""
    from_currency_id: int
    to_currency_id: int
    from_amount: float = Field(..., gt=0)
    to_amount: float = Field(..., gt=0)
    exchange_rate: float = Field(..., gt=0)
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None
    source: Optional[str] = None
    reference: Optional[str] = None


class TransactionCreate(TransactionBase):
    """Schema for creating a new transaction"""
    user_id: Optional[int] = None  # Optional as it can be taken from current user


class TransactionCreateFromExchange(BaseModel):
    """Schema for creating a transaction from currency exchange"""
    from_currency_id: int
    to_currency_id: int
    from_amount: float = Field(..., gt=0)
    description: Optional[str] = None
    source: Optional[str] = None
    reference: Optional[str] = None


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction"""
    description: Optional[str] = None
    source: Optional[str] = None
    reference: Optional[str] = None


class TransactionResponse(TransactionBase):
    """Schema for returning transaction data"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Configuration for the Pydantic model"""
        from_attributes = True


class TransactionDetailResponse(TransactionResponse):
    """Schema for returning detailed transaction data with related data"""
    from_currency: CurrencyResponse
    to_currency: CurrencyResponse

    class Config:
        """Configuration for the Pydantic model"""
        from_attributes = True


class TransactionStats(BaseModel):
    """Schema for transaction statistics"""
    total_transactions: int
    total_volume_base: float
    average_rate: float
    total_profit_loss: Optional[float] = None