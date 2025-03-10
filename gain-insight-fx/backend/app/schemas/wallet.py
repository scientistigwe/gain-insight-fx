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