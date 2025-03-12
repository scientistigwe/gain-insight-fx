from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.api import deps
from app.schemas.user import UserInDB
from app.schemas.transaction import Transaction, TransactionCreate
from app.schemas.wallet import Wallet
from app.services.transaction import create_transaction, get_user_transactions, get_transaction, delete_transaction, get_user_wallets

router = APIRouter()

@router.post("/", response_model=Transaction)
async def create_new_transaction(
    transaction_in: TransactionCreate,
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Create a new transaction.
    """
    # Ensure user can only create transactions for themselves
    if transaction_in.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create transactions for other users"
        )
    
    return await create_transaction(transaction_in)

@router.get("/", response_model=List[Transaction])
async def read_transactions(
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Get all transactions for the current user.
    """
    return await get_user_transactions(current_user.id)

@router.get("/{transaction_id}", response_model=Transaction)
async def read_transaction(
    transaction_id: str,
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Get a specific transaction by ID.
    """
    transaction = await get_transaction(transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Ensure user can only see their own transactions
    if transaction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this transaction"
        )
    
    return transaction

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction_endpoint(
    transaction_id: str,
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Delete a transaction.
    """
    transaction = await get_transaction(transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Ensure user can only delete their own transactions
    if transaction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this transaction"
        )
    
    success = await delete_transaction(transaction_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting transaction"
        )

@router.get("/wallets/", response_model=List[Wallet])
async def read_wallets(
    current_user: UserInDB = Depends(deps.get_current_active_user)
):
    """
    Get all wallets for the current user.
    """
    return await get_user_wallets(current_user.id)