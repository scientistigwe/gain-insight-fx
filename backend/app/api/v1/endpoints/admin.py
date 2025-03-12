"""
Admin API endpoints.
This module contains endpoints for admin operations.
"""
from typing import Any, List

from fastapi import APIRouter, HTTPException, status

from app.api.v1.dependencies import AdminUser, CommonDependencies
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.auth import create_user, delete_user
from app.utils.audit import log_admin_action

router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
async def get_users(
    db: CommonDependencies,
    current_user: AdminUser,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get all users.
    
    Args:
        db: Database session
        current_user: Current admin user
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of users
    """
    users = await db.execute(
        User.__table__.select().offset(skip).limit(limit)
    )
    return [UserResponse.model_validate(user) for user in users.scalars()]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    db: CommonDependencies,
    current_user: AdminUser,
    user_in: UserCreate
) -> Any:
    """
    Create a new user.
    
    Args:
        db: Database session
        current_user: Current admin user
        user_in: User creation data
        
    Returns:
        Created user
        
    Raises:
        HTTPException: If a user with the same email already exists
    """
    # Check if user already exists
    existing_user = await db.execute(
        User.__table__.select().where(User.email == user_in.email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # Create user
    user = await create_user(db=db, user_in=user_in, is_admin=user_in.is_admin)
    
    # Log admin action
    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="create",
        entity_type="user",
        entity_id=user.id,
        details={"email": user.email, "is_admin": user.is_admin}
    )
    
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: CommonDependencies,
    current_user: AdminUser
) -> Any:
    """
    Update a user.
    
    Args:
        user_id: User ID
        user_in: User update data
        db: Database session
        current_user: Current admin user
        
    Returns:
        Updated user
        
    Raises:
        HTTPException: If the user does not exist
    """
    # Check if user exists
    user_result = await db.execute(
        User.__table__.select().where(User.id == user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user fields
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    # Log admin action
    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="update",
        entity_type="user",
        entity_id=user.id,
        details=update_data
    )
    
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user(
    user_id: int,
    db: CommonDependencies,
    current_user: AdminUser
) -> None:
    """
    Delete a user.
    
    Args:
        user_id: User ID
        db: Database session
        current_user: Current admin user
        
    Raises:
        HTTPException: If the user does not exist or is the current user
    """
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own user account"
        )
    
    # Check if user exists
    user_result = await db.execute(
        User.__table__.select().where(User.id == user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user email for audit log
    user_email = user.email
    
    # Delete user
    deleted = await delete_user(db=db, user_id=user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user"
        )
    
    # Log admin action
    await log_admin_action(
        db=db,
        user_id=current_user.id,
        action="delete",
        entity_type="user",
        entity_id=user_id,
        details={"email": user_email}
    )


@router.get("/audit-logs", response_model=List[dict])
async def get_audit_logs(
    db: CommonDependencies,
    current_user: AdminUser,
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    action: str = None,
    entity_type: str = None
) -> Any:
    """
    Get audit logs with optional filtering.
    
    Args:
        db: Database session
        current_user: Current admin user
        skip: Number of records to skip
        limit: Maximum number of records to return
        user_id: Filter by user ID
        action: Filter by action type
        entity_type: Filter by entity type
        
    Returns:
        List of audit logs
    """
    from app.models.audit import AuditLog
    
    # Build query
    query = AuditLog.__table__.select()
    
    # Apply filters
    if user_id is not None:
        query = query.where(AuditLog.user_id == user_id)
    if action is not None:
        query = query.where(AuditLog.action == action)
    if entity_type is not None:
        query = query.where(AuditLog.entity_type == entity_type)
    
    # Apply pagination
    query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    audit_logs = result.mappings().all()
    
    return list(audit_logs)