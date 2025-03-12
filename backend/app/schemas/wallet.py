from pydantic import BaseModel


class WalletBase(BaseModel):
    user_id: str
    currency_code: str
    balance: float


class WalletCreate(WalletBase):
    pass


class WalletUpdate(BaseModel):
    balance: float


class Wallet(WalletBase):
    id: str

"""
Wallet schemas.
This module defines Pydantic models for wallet data validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.currency import CurrencyResponse


class WalletBase(BaseModel):
    """Base wallet schema with common attributes"""
    user_id: int
    currency_id: int
    balance: float = Field(default=0, ge=0)


class WalletCreate(WalletBase):
    """Schema for creating a new wallet"""
    pass


class WalletUpdate(BaseModel):
    """Schema for updating a wallet"""
    balance: Optional[float] = Field(None, ge=0)


class WalletResponse(BaseModel):
    """Schema for returning wallet data"""
    id: int
    user_id: int
    currency_id: int
    balance: float
    created_at: datetime
    updated_at: datetime

    class Config:
        """Configuration for the Pydantic model"""
        from_attributes = True


class WalletWithCurrency(WalletResponse):
    """Schema for returning wallet data with related currency data"""
    currency: CurrencyResponse

    class Config:
        """Configuration for the Pydantic model"""
        from_attributes = True


class WalletTransaction(BaseModel):
    """Schema for wallet transactions (deposit/withdraw)"""
    amount: float = Field(..., gt=0)
    description: Optional[str] = None