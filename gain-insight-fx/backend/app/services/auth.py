from typing import Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from pydantic import EmailStr

from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.db.firebase import users_collection
from app.schemas.user import UserCreate, UserInDB

from typing import Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from pydantic import EmailStr

from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.db.firebase import users_collection
from app.schemas.user import UserCreate, UserInDB, User

def get_user_by_email(email: str) -> Optional[UserInDB]:
    users = users_collection.where("email", "==", email).limit(1).get()
    for user in users:
        user_data = user.to_dict()
        user_data["id"] = user.id
        return UserInDB(**user_data)
    return None

def create_user(user_in: UserCreate) -> User:
    # Check if user exists
    existing_user = get_user_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create user document
    now = datetime.utcnow()
    user_data = {
        "email": user_in.email,
        "full_name": user_in.full_name,
        "hashed_password": get_password_hash(user_in.password),
        "is_active": True,
        "is_admin": user_in.is_admin,
        "created_at": now,
        "updated_at": now,
    }
    
    # Add user to Firestore
    new_user = users_collection.document()
    new_user.set(user_data)
    
    # Return user without hashed_password
    return User(
        id=new_user.id,
        email=user_in.email,
        full_name=user_in.full_name,
        is_active=True,
        is_admin=user_in.is_admin,
        created_at=now,
        updated_at=now,
    )

def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    user = get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_tokens_for_user(user_id: str):
    access_token = create_access_token(subject=user_id)
    refresh_token = create_refresh_token(subject=user_id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

def get_or_create_admin_user():
    """Ensure admin user exists or create if not"""
    admin_email = settings.DEFAULT_ADMIN_EMAIL
    admin = get_user_by_email(admin_email)
    
    if not admin:
        admin_user = UserCreate(
            email=admin_email,
            password=settings.DEFAULT_ADMIN_PASSWORD,
            full_name="Admin User",
            is_admin=True
        )
        admin = create_user(admin_user)
    
    return admin

