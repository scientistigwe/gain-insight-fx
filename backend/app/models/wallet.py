"""
Wallet database model.
This module defines the Wallet model for storing user currency balances.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


class Wallet(Base):
    """
    Wallet model for storing user currency balances.
    """
    __tablename__ = "wallets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=False, index=True)
    balance = Column(Numeric(precision=18, scale=6), default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Unique constraint to ensure a user can have only one wallet per currency
    __table_args__ = (
        UniqueConstraint('user_id', 'currency_id', name='unique_user_currency'),
    )
    
    # Relationships
    user = relationship("User", back_populates="wallets")
    currency = relationship("Currency", back_populates="wallets")