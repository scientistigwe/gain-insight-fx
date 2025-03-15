"""
API dependencies for all API versions.
This module provides common dependencies that can be used across all API versions.
"""
from typing import AsyncGenerator, Optional
from datetime import datetime

from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import ALGORITHM
from app.db.session import AsyncSessionLocal
from app.schemas.auth import TokenPayload, UserInfo
from app.db.firebase import get_user

# Keep OAuth2 scheme for backward compatibility
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Creates and yields a database session.

    Yields:
        AsyncSession: The database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_token_from_cookie_or_header(
    access_token_cookie: Optional[str] = Cookie(None),
    token_header: Optional[str] = Depends(oauth2_scheme)
) -> Optional[str]:
    """
    Tries to get the token from cookie first, then from header.

    Args:
        access_token_cookie: The JWT token from cookies
        token_header: The JWT token from Authorization header

    Returns:
        The JWT token or None if not found
    """
    # Prefer cookie-based authentication
    if access_token_cookie:
        return access_token_cookie

    # Fall back to header-based authentication
    return token_header


async def get_current_user(
    token: Optional[str] = Depends(get_token_from_cookie_or_header)
) -> UserInfo:
    """
    Gets the current authenticated user from the token.
    Works with both cookie and header-based authentication.

    Args:
        token: The JWT token from cookie or header

    Returns:
        The current authenticated user

    Raises:
        HTTPException: If the token is invalid or the user doesn't exist
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        # Decode the JWT token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = TokenPayload(**payload)

        if token_data.sub is None:
            raise credentials_exception

        # Check token expiration
        if token_data.exp and datetime.fromtimestamp(token_data.exp) < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # If firebase_token is in the payload, use it to get user info
        user_id = token_data.sub

    except JWTError:
        raise credentials_exception

    # Get user from database
    user = get_user(user_id)
    if user is None:
        raise credentials_exception

    return UserInfo(
        id=user_id,
        email=user.get('email'),
        full_name=user.get('full_name', ''),
        is_active=user.get('is_active', True),
        is_superuser=user.get('is_superuser', False)
    )


async def get_optional_current_user(
    token: Optional[str] = Depends(get_token_from_cookie_or_header)
) -> Optional[UserInfo]:
    """
    Gets the current authenticated user from the token if available.
    Works with both cookie and header-based authentication.

    Args:
        token: The JWT token from cookie or header

    Returns:
        The current authenticated user or None if no token is provided
    """
    if token is None:
        return None
    try:
        return await get_current_user(token=token)
    except HTTPException:
        return None


async def get_current_active_user(
    current_user: UserInfo = Depends(get_current_user)
) -> UserInfo:
    """
    Gets the current active user.

    Args:
        current_user: The current authenticated user

    Returns:
        The current active user

    Raises:
        HTTPException: If the user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


async def get_current_superuser(
    current_user: UserInfo = Depends(get_current_user)
) -> UserInfo:
    """
    Gets the current superuser.

    Args:
        current_user: The current authenticated user

    Returns:
        The current superuser

    Raises:
        HTTPException: If the user is not a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user