"""
Application configuration.
This module defines the application settings loaded from environment variables.
"""
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, EmailStr, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    # Project info
    PROJECT_NAME: str = "GainSight FX"
    
    # API settings
    API_V1_STR: str = "/api/v1"
    
    # Security settings
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database settings
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: str = "5432"
    DATABASE_URI: Optional[PostgresDsn] = None
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []
    
    # Email settings
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Exchange rate API settings
    EXCHANGERATE_API_KEY: str = "54a9ddf83ef796a691c02a26"  # ExchangeRate-API key
    FIXER_API_KEY: str = "ebfcc408e05397c2e1d601dc23cb3cb2"  # Fixer.io API key
    OPENEXCHANGERATES_API_KEY: str = ""  # OpenExchangeRates API key (add your key)
    
    # Exchange rate update settings
    EXCHANGE_RATE_UPDATE_INTERVAL: int = 3600  # Update exchange rates every hour (in seconds)
    
    # Alert settings
    ALERT_CHECK_INTERVAL: int = 300  # Check alerts every 5 minutes (in seconds)
    
    # Prediction settings
    PREDICTION_WINDOW_DAYS: int = 30  # Number of days of historical data to use for predictions
    PREDICTION_HORIZON_DAYS: int = 7  # Number of days to predict into the future
    
    # Firebase settings (if using Firebase)
    FIREBASE_API_KEY: Optional[str] = None
    FIREBASE_AUTH_DOMAIN: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: Optional[str] = None
    FIREBASE_MESSAGING_SENDER_ID: Optional[str] = None
    FIREBASE_APP_ID: Optional[str] = None
    FIREBASE_PRIVATE_KEY: Optional[str] = None
    FIREBASE_PRIVATE_KEY_ID: Optional[str] = None
    FIREBASE_CLIENT_EMAIL: Optional[str] = None
    FIREBASE_CLIENT_ID: Optional[str] = None
    FIREBASE_CLIENT_CERT_URL: Optional[str] = None
    FIREBASE_MEASUREMENT_ID: Optional[str] = None

    # Admin user settings
    ADMIN_EMAIL: str = "admin@gainsightfx.com"
    ADMIN_PASSWORD: str = "admin123"  # Default password for development

    @field_validator("BACKEND_CORS_ORIGINS")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """
        Validate and convert CORS origins from comma-separated string to list.
        """
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @field_validator("DATABASE_URI")
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        """
        Construct database URI if not provided directly.
        """
        if isinstance(v, str):
            return v
        
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.data.get("POSTGRES_USER"),
            password=values.data.get("POSTGRES_PASSWORD"),
            host=values.data.get("POSTGRES_SERVER"),
            port=values.data.get("POSTGRES_PORT"),
            path=f"{values.data.get('POSTGRES_DB') or ''}",
        )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)


# Create settings instance
settings = Settings()