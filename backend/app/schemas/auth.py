from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None


"""
Authentication schemas.
This module defines Pydantic models for authentication data validation.
"""
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserResponse


class Login(BaseModel):
    """Schema for login credentials"""
    email: EmailStr
    password: str = Field(..., min_length=6)


class TokenPayload(BaseModel):
    """Schema for JWT token payload"""
    sub: Optional[int] = None  # Subject (user ID)
    exp: Optional[int] = None  # Expiration time


class Token(BaseModel):
    """Schema for authentication token response"""
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    """Schema for login response with token and user data"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordReset(BaseModel):
    """Schema for password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation"""
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str


class Registration(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str
    full_name: Optional[str] = None