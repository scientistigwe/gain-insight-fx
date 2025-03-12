"""
Currency database model.
This module defines the Currency model for storing currency information.
"""
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Currency(Base):
    """
    Currency model for storing currency information.
    """
    __tablename__ = "currencies"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(3), unique=True, index=True, nullable=False)  # ISO 4217 currency code
    name = Column(String, nullable=False)
    symbol = Column(String)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    wallets = relationship("Wallet", back_populates="currency")
    from_transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.from_currency_id",
        back_populates="from_currency"
    )
    to_transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.to_currency_id",
        back_populates="to_currency"
    )
    base_rates = relationship(
        "ExchangeRate",
        foreign_keys="ExchangeRate.base_currency_id",
        back_populates="base_currency"
    )
    quote_rates = relationship(
        "ExchangeRate",
        foreign_keys="ExchangeRate.quote_currency_id",
        back_populates="quote_currency"
    )
    base_alerts = relationship(
        "Alert",
        foreign_keys="Alert.base_currency_id",
        back_populates="base_currency"
    )
    quote_alerts = relationship(
        "Alert",
        foreign_keys="Alert.quote_currency_id",
        back_populates="quote_currency"
    )


class ExchangeRate(Base):
    """
    Exchange Rate model for storing currency exchange rates.
    """
    __tablename__ = "exchange_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    base_currency_id = Column(Integer, nullable=False, index=True)
    quote_currency_id = Column(Integer, nullable=False, index=True)
    rate = Column("rate", nullable=False)
    source = Column(String, nullable=False)  # Source of the exchange rate data
    timestamp = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    base_currency = relationship(
        "Currency",
        foreign_keys=[base_currency_id],
        back_populates="base_rates"
    )
    quote_currency = relationship(
        "Currency",
        foreign_keys=[quote_currency_id],
        back_populates="quote_rates"
    )