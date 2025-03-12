"""
Audit database model.
This module defines the AuditLog model for tracking user actions.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class AuditLog(Base):
    """
    AuditLog model for tracking user actions.
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Nullable for system actions
    action = Column(String, nullable=False, index=True)  # create, update, delete, login, etc.
    entity_type = Column(String, nullable=False, index=True)  # user, currency, transaction, etc.
    entity_id = Column(Integer, nullable=True, index=True)  # ID of the affected entity
    details = Column(JSON, nullable=True)  # Additional details about the action
    ip_address = Column(String, nullable=True)  # IP address of the user
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")