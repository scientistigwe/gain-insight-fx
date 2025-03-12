"""
User schemas.
This module defines Pydantic models for user data validation.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, validator

from app.schemas.wallet import WalletResponse
from uuid import UUID

class UserBase(BaseModel):
    """Base user schema with common attributes"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_admin: bool = False

class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8)
    is_admin: bool = False
    email: EmailStr

class UserUpdate(BaseModel):
    """Schema for updating a user"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    id: str
    hashed_password: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class User(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime
    updated_at: datetime

class UserProfileUpdate(BaseModel):
    """Schema for updating a user's profile by themselves"""
    full_name: Optional[str] = None


class UserPasswordUpdate(BaseModel):
    """Schema for updating a user's password"""
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        """Validate that new_password and confirm_password match"""
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class UserResponse(UserBase):
    """Schema for returning user data"""
    id: int
    is_admin: bool
    created_at: datetime

    class Config:
        """Configuration for the Pydantic model"""
        from_attributes = True


class UserMeResponse(UserResponse):
    """Schema for returning authenticated user's data"""
    wallets: List[WalletResponse] = []