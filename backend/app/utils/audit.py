"""
Audit utilities.
This module provides utilities for logging user actions for auditing purposes.
"""
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.firebase import audit_logs_collection
from app.models.audit import AuditLog

logger = logging.getLogger(__name__)


async def log_audit_action(
    db: AsyncSession,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
) -> None:
    """
    Log an action for auditing purposes.
    
    Args:
        db: Database session
        user_id: ID of the user who performed the action (None for system actions)
        action: Action performed (create, update, delete, login, etc.)
        entity_type: Type of entity affected (user, currency, transaction, etc.)
        entity_id: ID of the affected entity
        details: Additional details about the action
        request: Request object for extracting client IP
    """
    try:
        # Get client IP if request is provided
        ip_address = None
        if request:
            if "X-Forwarded-For" in request.headers:
                ip_address = request.headers["X-Forwarded-For"].split(",")[0].strip()
            else:
                ip_address = request.client.host
        
        # Create audit log entry
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            created_at=datetime.utcnow(),
        )
        
        # Add to database
        db.add(audit_log)
        await db.commit()
        
        # Also log to Firebase if using hybrid approach
        audit_log_data = {
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details,
            "ip_address": ip_address,
            "created_at": datetime.utcnow(),
        }
        audit_logs_collection.add(audit_log_data)
        
    except Exception as e:
        logger.error(f"Error logging audit action: {e}")
        # Don't re-raise the exception to avoid disrupting the main flow


async def log_user_action(
    db: AsyncSession,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
) -> None:
    """
    Log a user action for auditing purposes.
    
    Args:
        db: Database session
        user_id: ID of the user who performed the action
        action: Action performed (create, update, delete, login, etc.)
        entity_type: Type of entity affected (user, currency, transaction, etc.)
        entity_id: ID of the affected entity
        details: Additional details about the action
        request: Request object for extracting client IP
    """
    await log_audit_action(
        db=db,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        request=request,
    )


async def log_admin_action(
    db: AsyncSession,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
) -> None:
    """
    Log an admin action for auditing purposes.
    
    Args:
        db: Database session
        user_id: ID of the admin who performed the action
        action: Action performed (create, update, delete, etc.)
        entity_type: Type of entity affected (user, currency, transaction, etc.)
        entity_id: ID of the affected entity
        details: Additional details about the action
        request: Request object for extracting client IP
    """
    # Add admin marker to details
    if details is None:
        details = {}
    details["admin_action"] = True
    
    await log_audit_action(
        db=db,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        request=request,
    )


async def log_system_action(
    db: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log a system action for auditing purposes.
    
    Args:
        db: Database session
        action: Action performed (create, update, delete, etc.)
        entity_type: Type of entity affected (user, currency, transaction, etc.)
        entity_id: ID of the affected entity
        details: Additional details about the action
    """
    # Add system marker to details
    if details is None:
        details = {}
    details["system_action"] = True
    
    await log_audit_action(
        db=db,
        user_id=None,  # None for system actions
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        request=None,
    )