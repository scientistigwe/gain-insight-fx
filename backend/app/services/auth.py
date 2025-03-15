"""
Firebase authentication service using REST API instead of Admin SDK.
This module handles Firebase authentication operations via the REST API.
"""
import requests
import json
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.user import UserCreate, UserInDB

# Firebase Auth REST API endpoints
FIREBASE_AUTH_ENDPOINT = "https://identitytoolkit.googleapis.com/v1/accounts"
FIREBASE_REFRESH_ENDPOINT = "https://securetoken.googleapis.com/v1/token"


def sign_in_with_email_password(email: str, password: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Sign in a user with email and password via Firebase Auth REST API.

    Args:
        email: User's email
        password: User's password

    Returns:
        Tuple with user data and error message if any
    """
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }

    url = f"{FIREBASE_AUTH_ENDPOINT}:signInWithPassword?key={settings.FIREBASE_API_KEY}"

    try:
        response = requests.post(url, data=json.dumps(payload))
        data = response.json()

        if response.status_code != 200:
            return None, data.get("error", {}).get("message", "Authentication failed")

        # Successfully authenticated
        return data, None

    except Exception as e:
        return None, str(e)


def create_user_with_email_password(user_create: UserCreate) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Create a new user via Firebase Auth REST API.

    Args:
        user_create: User creation data

    Returns:
        Tuple with created user data and error message if any
    """
    payload = {
        "email": user_create.email,
        "password": user_create.password,
        "returnSecureToken": True
    }

    url = f"{FIREBASE_AUTH_ENDPOINT}:signUp?key={settings.FIREBASE_API_KEY}"

    try:
        response = requests.post(url, data=json.dumps(payload))
        data = response.json()

        if response.status_code != 200:
            return None, data.get("error", {}).get("message", "User creation failed")

        # Successfully created user
        return data, None

    except Exception as e:
        return None, str(e)


def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticate a user and create a JWT access token.

    Args:
        email: User email
        password: User password

    Returns:
        Dict with access_token and user info or None if authentication fails
    """
    user_data, error = sign_in_with_email_password(email, password)

    if error or not user_data:
        return None

    # Create application access token
    user_id = user_data.get("localId")
    firebase_token = user_data.get("idToken")
    expires_in = int(user_data.get("expiresIn", "3600"))

    access_token_expires = timedelta(seconds=expires_in)

    # Create our own JWT token with the user data
    access_token = create_access_token(
        subject=user_id,
        expires_delta=access_token_expires,
        data={"firebase_token": firebase_token}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "firebase_token": firebase_token,
        "user_id": user_id,
        "email": user_data.get("email"),
        "expires_in": expires_in
    }


def get_user_data(firebase_token: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Get user data from Firebase using an ID token.

    Args:
        firebase_token: Firebase ID token

    Returns:
        Tuple with user data and error message if any
    """
    payload = {
        "idToken": firebase_token
    }

    url = f"{FIREBASE_AUTH_ENDPOINT}:lookup?key={settings.FIREBASE_API_KEY}"

    try:
        response = requests.post(url, data=json.dumps(payload))
        data = response.json()

        if response.status_code != 200 or "users" not in data:
            return None, data.get("error", {}).get("message", "Failed to get user data")

        return data["users"][0], None

    except Exception as e:
        return None, str(e)


def refresh_token(refresh_token: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Refresh a Firebase authentication token.

    Args:
        refresh_token: Firebase refresh token

    Returns:
        Tuple with new tokens and error message if any
    """
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }

    url = f"{FIREBASE_REFRESH_ENDPOINT}?key={settings.FIREBASE_API_KEY}"

    try:
        response = requests.post(url, data=json.dumps(payload))
        data = response.json()

        if response.status_code != 200:
            return None, data.get("error", {}).get("message", "Failed to refresh token")

        return data, None

    except Exception as e:
        return None, str(e)


def create_or_update_user_in_db(firebase_user_data: Dict[str, Any], additional_data: Optional[Dict[str, Any]] = None) -> \
Dict[str, Any]:
    """
    Create or update user in database using Firebase user data.
    This function should interact with your database to store user information.
    You would implement this to work with your specific database (SQLite, PostgreSQL, etc.)

    Args:
        firebase_user_data: User data from Firebase
        additional_data: Any additional data to store

    Returns:
        Updated user data
    """
    # This would be implemented to work with your database
    # For this example, we'll just return a combined dict

    user_data = {
        "id": firebase_user_data.get("localId"),
        "email": firebase_user_data.get("email"),
        "is_active": True,
        "is_superuser": firebase_user_data.get("email") == settings.ADMIN_EMAIL,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

    if additional_data:
        user_data.update(additional_data)

    return user_data


def get_or_create_admin_user() -> Dict[str, Any]:
    """
    Get or create admin user.
    This is typically run during application startup.

    Returns:
        Admin user data
    """
    # Try to authenticate the admin user
    admin_auth = authenticate_user(settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD)

    if admin_auth:
        # Admin exists, return the user
        admin_user_data, _ = get_user_data(admin_auth.get("firebase_token"))
        if admin_user_data:
            return create_or_update_user_in_db(admin_user_data, {"is_superuser": True})

    # Admin doesn't exist, create it
    admin_create = UserCreate(
        email=settings.ADMIN_EMAIL,
        password=settings.ADMIN_PASSWORD,
        full_name="Admin User"
    )

    admin_data, error = create_user_with_email_password(admin_create)

    if error:
        # This could happen if admin already exists but password is wrong
        # or if there are Firebase-specific issues
        raise Exception(f"Failed to create admin user: {error}")

    return create_or_update_user_in_db(admin_data, {"is_superuser": True})