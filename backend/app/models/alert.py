"""
Alert database model.
This module defines the Alert model for storing exchange rate alerts.
"""
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Alert(Base):
    """
    Alert model for storing exchange rate alerts.
    """
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    base_currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=False, index=True)
    quote_currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=False, index=True)
    threshold = Column(Numeric(precision=18, scale=6), nullable=False)
    is_above_threshold = Column(Boolean, default=True, nullable=False)  # True for alerts when rate goes above threshold
    is_active = Column(Boolean, default=True, nullable=False)
    is_triggered = Column(Boolean, default=False, nullable=False)
    last_triggered_at = Column(DateTime, nullable=True)
    is_auto_generated = Column(Boolean, default=False, nullable=False)  # True for system-generated alerts
    description = Column(Text, nullable=True)  # Optional description or reason for the alert
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="alerts")
    base_currency = relationship(
        "Currency",
        foreign_keys=[base_currency_id],
        back_populates="base_alerts"
    )
    quote_currency = relationship(
        "Currency",
        foreign_keys=[quote_currency_id],
        back_populates="quote_alerts"
    )