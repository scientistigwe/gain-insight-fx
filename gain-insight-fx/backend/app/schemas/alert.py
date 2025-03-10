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