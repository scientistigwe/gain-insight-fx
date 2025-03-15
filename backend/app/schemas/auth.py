"""
Authentication schemas.
This module defines Pydantic models for authentication data validation.
"""
from typing import Optional, Dict, Any

from pydantic import BaseModel, EmailStr, Field, validator


class Login(BaseModel):
    """Schema for login credentials"""
    email: EmailStr
    password: str = Field(..., min_length=6)


class TokenPayload(BaseModel):
    """Schema for JWT token payload"""
    sub: str  # Subject (user ID)
    exp: Optional[int] = None  # Expiration time
    firebase_token: Optional[str] = None  # Firebase ID token


class Token(BaseModel):
    """Schema for authentication token response"""
    access_token: str
    token_type: str = "bearer"
    firebase_token: Optional[str] = None  # Include Firebase token for client-side operations
    expires_in: Optional[int] = None  # Token expiration time in seconds


class UserInfo(BaseModel):
    """Basic user information returned from Firebase"""
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Schema for login response with token and user data"""
    access_token: str
    token_type: str = "bearer"
    firebase_token: Optional[str] = None
    user: UserInfo
    expires_in: Optional[int] = None


class PasswordReset(BaseModel):
    """Schema for password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation"""
    oob_code: str  # Firebase out-of-band code
    new_password: str = Field(..., min_length=8)

    @validator('new_password')
    def password_complexity(cls, v):
        """Validate password complexity"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        # Add more password complexity rules as needed
        return v


class Registration(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str
    full_name: Optional[str] = None

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        """Validate that passwords match"""
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

    @validator('password')
    def password_complexity(cls, v):
        """Validate password complexity"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        # Add more password complexity rules as needed
        return v


class RefreshToken(BaseModel):
    """Schema for refreshing an access token"""
    refresh_token: str


class EmailVerification(BaseModel):
    """Schema for email verification"""
    oob_code: str  # Firebase out-of-band code