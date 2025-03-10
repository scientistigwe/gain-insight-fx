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