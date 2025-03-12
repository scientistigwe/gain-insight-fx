"""
Transaction database model.
This module defines the Transaction model for storing currency exchange transactions.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Transaction(Base):
    """
    Transaction model for storing currency exchange transactions.
    """
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    from_currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=False, index=True)
    to_currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=False, index=True)
    from_amount = Column(Numeric(precision=18, scale=6), nullable=False)
    to_amount = Column(Numeric(precision=18, scale=6), nullable=False)
    exchange_rate = Column(Numeric(precision=18, scale=6), nullable=False)
    transaction_date = Column(DateTime, nullable=False)
    description = Column(String)
    source = Column(String)  # Source of the transaction (e.g., bank, exchange)
    reference = Column(String)  # External reference number
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    from_currency = relationship(
        "Currency",
        foreign_keys=[from_currency_id],
        back_populates="from_transactions"
    )
    to_currency = relationship(
        "Currency",
        foreign_keys=[to_currency_id],
        back_populates="to_transactions"
    )