"""
Authentication endpoints with cookie support.
This module defines the API routes for authentication operations.
"""
from typing import Any
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status, Depends, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services.auth import (
    authenticate_user,
    create_user_with_email_password,
    refresh_token as refresh_firebase_token,
    get_user_data
)
from app.schemas.auth import (
    Token,
    LoginResponse,
    Registration,
    RefreshToken,
    PasswordReset,
    PasswordResetConfirm,
    UserInfo
)
from app.schemas.user import UserCreate
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=LoginResponse)
async def register_user(registration: Registration, response: Response):
    """
    Register a new user and set authentication cookies.
    """
    # Check if passwords match (already validated in schema but double check)
    if registration.password != registration.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )

    # Create user in Firebase
    user_create = UserCreate(
        email=registration.email,
        password=registration.password,
        full_name=registration.full_name
    )

    user_data, error = create_user_with_email_password(user_create)

    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {error}"
        )

    # Authenticate the new user to return tokens
    auth_result = authenticate_user(registration.email, registration.password)

    if not auth_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User created but authentication failed"
        )

    # Get user info
    user_id = auth_result.get("user_id")
    user_info = UserInfo(
        id=user_id,
        email=registration.email,
        full_name=registration.full_name,
        is_active=True,
        is_superuser=False
    )

    # Set cookies
    _set_auth_cookies(response, auth_result)

    # Return login response without tokens in the body (they're in cookies now)
    return LoginResponse(
        access_token="",  # Empty as it's in cookies now
        token_type="bearer",
        user=user_info,
        expires_in=auth_result.get("expires_in")
    )

@router.post("/login", response_model=LoginResponse)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    response: Response = None
):
    """
    OAuth2 compatible token login, get an access token via cookies.
    """
    auth_result = authenticate_user(form_data.username, form_data.password)

    if not auth_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user info from Firebase
    user_data, error = get_user_data(auth_result.get("firebase_token"))

    if error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user data: {error}"
        )

    # Create user info object
    user_info = UserInfo(
        id=auth_result.get("user_id"),
        email=user_data.get("email", form_data.username),
        full_name=user_data.get("displayName", ""),
        is_active=not user_data.get("disabled", False),
        is_superuser=user_data.get("email") == settings.ADMIN_EMAIL
    )

    # Set cookies
    _set_auth_cookies(response, auth_result)

    # Return login response without tokens in the body (they're in cookies now)
    return LoginResponse(
        access_token="",  # Empty as it's in cookies now
        token_type="bearer",
        user=user_info,
        expires_in=auth_result.get("expires_in")
    )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str = Cookie(None),
    response: Response = None
):
    """
    Refresh access token using refresh token cookie.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )

    new_tokens, error = refresh_firebase_token(refresh_token)

    if error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Token refresh failed: {error}"
        )

    # Set new cookies
    auth_result = {
        "access_token": new_tokens.get("id_token"),
        "refresh_token": new_tokens.get("refresh_token"),
        "firebase_token": new_tokens.get("id_token"),
        "expires_in": int(new_tokens.get("expires_in", 3600))
    }
    _set_auth_cookies(response, auth_result)

    # Return token response without actual tokens (they're in cookies now)
    return Token(
        access_token="",  # Empty as it's in cookies now
        token_type="bearer",
        expires_in=int(new_tokens.get("expires_in", 3600))
    )

@router.post("/logout")
async def logout(response: Response):
    """
    Logout by clearing authentication cookies.
    """
    _clear_auth_cookies(response)
    return {"detail": "Successfully logged out"}

@router.get("/verify")
async def verify_auth(current_user: UserInfo = Depends(get_current_user)):
    """
    Verify authentication status.
    Returns 200 if authenticated, 401 if not.
    """
    return {"authenticated": True, "user_id": current_user.id}

@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def request_password_reset(reset_data: PasswordReset):
    """
    Request a password reset email.
    This will be implemented to send a password reset email through Firebase
    """
    # Firebase password reset functionality would be implemented here
    # For now, just return a success status
    return {"message": "Password reset email sent if the account exists"}

@router.post("/verify-password-reset", status_code=status.HTTP_204_NO_CONTENT)
async def verify_password_reset(reset_data: PasswordResetConfirm):
    """
    Verify password reset token and set new password.
    This will be implemented to verify the token and set the new password through Firebase
    """
    # Firebase password reset confirmation would be implemented here
    # For now, just return a success status
    return {"message": "Password reset successful"}

def _set_auth_cookies(response: Response, auth_result: dict):
    """
    Set authentication cookies.
    """
    # Calculate expiration time
    expires = datetime.utcnow() + timedelta(seconds=auth_result.get("expires_in", 3600))

    # Set access token cookie
    response.set_cookie(
        key="access_token",
        value=auth_result.get("access_token", ""),
        httponly=True,
        secure=settings.COOKIES_SECURE,  # True in production
        samesite=settings.COOKIES_SAMESITE,  # 'lax' or 'strict' in production
        expires=expires.strftime("%a, %d %b %Y %H:%M:%S GMT"),
        max_age=auth_result.get("expires_in", 3600),
        path="/"
    )

    # Set refresh token cookie if available
    if auth_result.get("refresh_token"):
        # Refresh tokens typically last longer
        refresh_expires = datetime.utcnow() + timedelta(days=7)
        response.set_cookie(
            key="refresh_token",
            value=auth_result.get("refresh_token", ""),
            httponly=True,
            secure=settings.COOKIES_SECURE,
            samesite=settings.COOKIES_SAMESITE,
            expires=refresh_expires.strftime("%a, %d %b %Y %H:%M:%S GMT"),
            max_age=60 * 60 * 24 * 7,  # 7 days
            path="/"
        )

    # Set Firebase token cookie if needed for client-side operations
    # Note: This is NOT httponly because client JS needs to access it
    if auth_result.get("firebase_token"):
        response.set_cookie(
            key="firebase_token",
            value=auth_result.get("firebase_token", ""),
            secure=settings.COOKIES_SECURE,
            samesite=settings.COOKIES_SAMESITE,
            expires=expires.strftime("%a, %d %b %Y %H:%M:%S GMT"),
            max_age=auth_result.get("expires_in", 3600),
            path="/"
        )

def _clear_auth_cookies(response: Response):
    """
    Clear authentication cookies.
    """
    # Clear all auth cookies
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="firebase_token", path="/")