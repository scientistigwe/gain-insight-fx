"""
Database initialization.
This module handles database initialization with default data.
"""
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.firebase import currencies_collection, users_collection
from app.db.session import SessionLocal
from app.models.currency import Currency
from app.models.user import User

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """
    Initialize the database with default data.
    
    This function creates default currencies and an admin user if they don't exist.
    """
    try:
        db = SessionLocal()
        
        # Initialize default currencies
        await init_currencies(db)
        
        # Initialize admin user
        await init_admin_user(db)
        
        await db.close()
        logger.info("Database initialized successfully")
    except SQLAlchemyError as e:
        logger.error(f"Error initializing database: {e}")
        raise


async def init_currencies(db) -> None:
    """
    Initialize default currencies in the database.
    
    Args:
        db: Database session
    """
    logger.info("Initializing default currencies")
    
    # Check if currencies already exist
    result = await db.execute(select(Currency).limit(1))
    if result.scalars().first() is not None:
        logger.info("Currencies already initialized")
        return
    
    # Default currencies
    default_currencies = [
        {
            "code": "NGN", 
            "name": "Nigerian Naira", 
            "symbol": "₦"
        },
        {
            "code": "USD", 
            "name": "United States Dollar", 
            "symbol": "$"
        },
        {
            "code": "EUR", 
            "name": "Euro", 
            "symbol": "€"
        },
        {
            "code": "GBP", 
            "name": "British Pound", 
            "symbol": "£"
        },
        {
            "code": "CAD", 
            "name": "Canadian Dollar", 
            "symbol": "C$"
        },
        {
            "code": "AUD", 
            "name": "Australian Dollar", 
            "symbol": "A$"
        },
        {
            "code": "CNY", 
            "name": "Chinese Yuan", 
            "symbol": "¥"
        },
        {
            "code": "JPY", 
            "name": "Japanese Yen", 
            "symbol": "¥"
        },
    ]
    
    # Add currencies to database
    now = datetime.utcnow()
    for currency_data in default_currencies:
        currency = Currency(
            code=currency_data["code"],
            name=currency_data["name"],
            symbol=currency_data["symbol"],
            is_active=True,
            created_at=now,
            updated_at=now
        )
        db.add(currency)
        
        # Also add to Firebase if using hybrid approach
        currencies_collection.document(currency_data["code"]).set({
            "code": currency_data["code"],
            "name": currency_data["name"],
            "symbol": currency_data["symbol"],
            "is_active": True,
            "created_at": now,
            "updated_at": now
        })
    
    await db.commit()
    logger.info("Default currencies initialized")


async def init_admin_user(db) -> None:
    """
    Initialize admin user in the database.
    
    Args:
        db: Database session
    """
    logger.info("Checking for admin user")
    
    # Check if admin user email is configured
    admin_email = getattr(settings, "ADMIN_EMAIL", "admin@gainsightfx.com")
    admin_password = getattr(settings, "ADMIN_PASSWORD", "admin123")  # Default password for development
    
    # Check if admin user already exists
    result = await db.execute(select(User).where(User.email == admin_email))
    if result.scalars().first() is not None:
        logger.info("Admin user already exists")
        return
    
    logger.info(f"Creating admin user: {admin_email}")
    
    # Create admin user
    now = datetime.utcnow()
    admin_user = User(
        email=admin_email,
        hashed_password=get_password_hash(admin_password),
        full_name="System Administrator",
        is_active=True,
        is_admin=True,
        created_at=now,
        updated_at=now
    )
    db.add(admin_user)
    await db.commit()
    await db.refresh(admin_user)
    
    # Also add to Firebase if using hybrid approach
    users_collection.document(str(admin_user.id)).set({
        "id": admin_user.id,
        "email": admin_email,
        "full_name": "System Administrator",
        "is_active": True,
        "is_admin": True,
        "created_at": now,
        "updated_at": now
    })
    
    logger.info(f"Admin user created with ID: {admin_user.id}")