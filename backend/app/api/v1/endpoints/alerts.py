from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.api import deps
from app.schemas.user import UserInDB
from app.schemas.alert import Alert, AlertCreate, AlertUpdate
from app.services.alert import create_alert, get_user_alerts, get_alert, update_alert, delete_alert

router = APIRouter()

@router.post("/", response_model=Alert)
async def create_new_alert(
    alert_in: AlertCreate,
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Create a new alert.
    """
    # Ensure user can only create alerts for themselves
    if alert_in.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create alerts for other users"
        )
    
    return await create_alert(alert_in)

@router.get("/", response_model=List[Alert])
async def read_alerts(
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Get all alerts for the current user.
    """
    return await get_user_alerts(current_user.id)

@router.get("/{alert_id}", response_model=Alert)
async def read_alert(
    alert_id: str,
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Get a specific alert by ID.
    """
    alert = await get_alert(alert_id)
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Ensure user can only see their own alerts
    if alert.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this alert"
        )
    
    return alert

@router.put("/{alert_id}", response_model=Alert)
async def update_alert_endpoint(
    alert_id: str,
    alert_in: AlertUpdate,
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Update a specific alert.
    """
    alert = await get_alert(alert_id)
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Ensure user can only update their own alerts
    if alert.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this alert"
        )
    
    updated_alert = await update_alert(alert_id, alert_in)
    
    if not updated_alert:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating alert"
        )
    
    return updated_alert

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert_endpoint(
    alert_id: str,
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Delete an alert.
    """
    alert = await get_alert(alert_id)
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Ensure user can only delete their own alerts
    if alert.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this alert"
        )
    
    success = await delete_alert(alert_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting alert"
        )