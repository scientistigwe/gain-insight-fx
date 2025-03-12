"""
User API endpoints.
This module contains endpoints for user operations.
"""
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, status

from app.api.v1.dependencies import CommonDependencies, CurrentUser
from app.core.security import get_password_hash, verify_password
from app.models.wallet import Wallet
from app.schemas.user import UserMeResponse, UserProfileUpdate, UserPasswordUpdate
from app.utils.audit import log_user_action

router = APIRouter()


@router.get("/me", response_model=UserMeResponse)
async def get_user_me(
    current_user: CurrentUser,
    db: CommonDependencies
) -> Any:
    """
    Get current user profile information.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Current user profile with wallets
    """
    # Get user's wallets
    wallets_result = await db.execute(
        Wallet.__table__.select().where(Wallet.user_id == current_user.id)
    )
    wallets = [wallet for wallet in wallets_result.scalars()]
    
    # Convert to response model
    response = UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
        wallets=wallets
    )
    
    return response


@router.put("/me/profile", response_model=UserMeResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: CurrentUser,
    db: CommonDependencies
) -> Any:
    """
    Update current user profile.
    
    Args:
        profile_update: Profile update data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated user profile
    """
    # Update user fields
    update_data = profile_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    
    # Log user action
    await log_user_action(
        db=db,
        user_id=current_user.id,
        action="update",
        entity_type="profile",
        entity_id=current_user.id,
        details=update_data
    )
    
    # Get user's wallets
    wallets_result = await db.execute(
        Wallet.__table__.select().where(Wallet.user_id == current_user.id)
    )
    wallets = [wallet for wallet in wallets_result.scalars()]
    
    # Convert to response model
    response = UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
        wallets=wallets
    )
    
    return response


@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_user_password(
    password_update: UserPasswordUpdate,
    current_user: CurrentUser,
    db: CommonDependencies
) -> None:
    """
    Update current user password.
    
    Args:
        password_update: Password update data
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: If the current password is incorrect
    """
    # Verify current password
    if not verify_password(password_update.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_update.new_password)
    await db.commit()
    
    # Log user action
    await log_user_action(
        db=db,
        user_id=current_user.id,
        action="update",
        entity_type="password",
        entity_id=current_user.id,
        details={"password_updated": True}
    )


@router.get("/me/wallets", response_model=List[Dict])
async def get_user_wallets(
    current_user: CurrentUser,
    db: CommonDependencies
) -> Any:
    """
    Get current user's wallets.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of user's wallets with currency information
    """
    # Join wallet with currency to get currency info
    query = """
    SELECT 
        w.id, w.user_id, w.balance, w.created_at, w.updated_at,
        c.id as currency_id, c.code as currency_code, c.name as currency_name, c.symbol as currency_symbol
    FROM wallets w
    JOIN currencies c ON w.currency_id = c.id
    WHERE w.user_id = :user_id
    """
    
    result = await db.execute(query, {"user_id": current_user.id})
    wallets = result.mappings().all()
    
    # Format response
    formatted_wallets = []
    for wallet in wallets:
        formatted_wallets.append({
            "id": wallet["id"],
            "balance": float(wallet["balance"]),
            "created_at": wallet["created_at"],
            "updated_at": wallet["updated_at"],
            "currency": {
                "id": wallet["currency_id"],
                "code": wallet["currency_code"],
                "name": wallet["currency_name"],
                "symbol": wallet["currency_symbol"]
            }
        })
    
    return formatted_wallets