from datetime import datetime
from typing import List, Optional, Dict

from app.db.firebase import transactions_collection, wallets_collection
from app.schemas.transaction import Transaction, TransactionCreate
from app.schemas.wallet import Wallet

async def create_transaction(transaction_in: TransactionCreate) -> Transaction:
    """Create a new transaction and update wallet balances"""
    timestamp = datetime.utcnow()
    
    # Convert to dict for Firestore
    transaction_data = transaction_in.dict()
    transaction_data["created_at"] = timestamp
    
    # Create transaction document
    transaction_ref = transactions_collection.document()
    transaction_ref.set(transaction_data)
    
    # Update wallet balances
    await update_wallet_balances(transaction_in)
    
    # Return complete transaction
    transaction = Transaction(
        id=transaction_ref.id,
        **transaction_data
    )
    
    return transaction

async def get_user_transactions(user_id: str) -> List[Transaction]:
    """Get all transactions for a specific user"""
    transactions = transactions_collection.where(
        "user_id", "==", user_id
    ).order_by(
        "created_at", direction="DESCENDING"
    ).get()
    
    result = []
    for transaction_doc in transactions:
        transaction_data = transaction_doc.to_dict()
        transaction_data["id"] = transaction_doc.id
        result.append(Transaction(**transaction_data))
    
    return result

async def get_transaction(transaction_id: str) -> Optional[Transaction]:
    """Get a specific transaction by ID"""
    transaction_doc = transactions_collection.document(transaction_id).get()
    
    if not transaction_doc.exists:
        return None
    
    transaction_data = transaction_doc.to_dict()
    transaction_data["id"] = transaction_doc.id
    
    return Transaction(**transaction_data)

async def delete_transaction(transaction_id: str) -> bool:
    """Delete a transaction and update wallet balances"""
    transaction = await get_transaction(transaction_id)
    if not transaction:
        return False
    
    # Create an inverse transaction to undo the effect
    inverse_transaction = TransactionCreate(
        user_id=transaction.user_id,
        from_currency=transaction.to_currency,
        to_currency=transaction.from_currency,
        amount=transaction.amount * transaction.exchange_rate,
        exchange_rate=1/transaction.exchange_rate,
        fees=transaction.fees,
        type="reversal",
        description=f"Reversal of transaction {transaction_id}"
    )
    
    # Update wallet balances to undo the transaction
    await update_wallet_balances(inverse_transaction)
    
    # Delete the transaction
    transactions_collection.document(transaction_id).delete()
    
    return True

async def update_wallet_balances(transaction: TransactionCreate) -> Dict[str, Wallet]:
    """Update wallet balances based on a transaction"""
    user_id = transaction.user_id
    from_currency = transaction.from_currency
    to_currency = transaction.to_currency
    amount = transaction.amount
    exchange_rate = transaction.exchange_rate
    fees = transaction.fees
    
    updated_wallets = {}
    
    # Update "from" wallet (deduct amount)
    if from_currency != "external":  # Skip if external source
        from_wallet_ref = wallets_collection.where(
            "user_id", "==", user_id
        ).where(
            "currency_code", "==", from_currency
        ).limit(1).get()
        
        # Find or create the wallet
        from_wallet_doc = None
        for doc in from_wallet_ref:
            from_wallet_doc = doc
        
        if from_wallet_doc:
            # Update existing wallet
            wallet_data = from_wallet_doc.to_dict()
            current_balance = wallet_data.get("balance", 0)
            new_balance = current_balance - amount
            
            wallets_collection.document(from_wallet_doc.id).update({
                "balance": new_balance
            })
            
            updated_wallets[from_currency] = Wallet(
                id=from_wallet_doc.id,
                user_id=user_id,
                currency_code=from_currency,
                balance=new_balance
            )
        else:
            # Create new wallet with negative balance
            new_wallet_ref = wallets_collection.document()
            new_wallet_data = {
                "user_id": user_id,
                "currency_code": from_currency,
                "balance": -amount
            }
            new_wallet_ref.set(new_wallet_data)
            
            updated_wallets[from_currency] = Wallet(
                id=new_wallet_ref.id,
                **new_wallet_data
            )
    
    # Update "to" wallet (add amount converted)
    to_wallet_ref = wallets_collection.where(
        "user_id", "==", user_id
    ).where(
        "currency_code", "==", to_currency
    ).limit(1).get()
    
    # Calculate amount to add (minus fees)
    amount_to_add = amount * exchange_rate
    if fees:
        amount_to_add -= fees
    
    # Find or create the wallet
    to_wallet_doc = None
    for doc in to_wallet_ref:
        to_wallet_doc = doc
    
    if to_wallet_doc:
        # Update existing wallet
        wallet_data = to_wallet_doc.to_dict()
        current_balance = wallet_data.get("balance", 0)
        new_balance = current_balance + amount_to_add
        
        wallets_collection.document(to_wallet_doc.id).update({
            "balance": new_balance
        })
        
        updated_wallets[to_currency] = Wallet(
            id=to_wallet_doc.id,
            user_id=user_id,
            currency_code=to_currency,
            balance=new_balance
        )
    else:
        # Create new wallet
        new_wallet_ref = wallets_collection.document()
        new_wallet_data = {
            "user_id": user_id,
            "currency_code": to_currency,
            "balance": amount_to_add
        }
        new_wallet_ref.set(new_wallet_data)
        
        updated_wallets[to_currency] = Wallet(
            id=new_wallet_ref.id,
            **new_wallet_data
        )
    
    return updated_wallets

async def get_user_wallets(user_id: str) -> List[Wallet]:
    """Get all wallets for a specific user"""
    wallets = wallets_collection.where(
        "user_id", "==", user_id
    ).get()
    
    result = []
    for wallet_doc in wallets:
        wallet_data = wallet_doc.to_dict()
        wallet_data["id"] = wallet_doc.id
        result.append(Wallet(**wallet_data))
    
    return result