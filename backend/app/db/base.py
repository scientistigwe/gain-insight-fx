"""
Database base configuration.
This module imports all models to ensure they are registered with SQLAlchemy.
"""
from sqlalchemy.ext.declarative import declarative_base

# Create declarative base for SQLAlchemy models
Base = declarative_base()

# Import all models here to ensure they are registered with SQLAlchemy
from app.models.user import User  # noqa
from app.models.currency import Currency, ExchangeRate  # noqa
from app.models.transaction import Transaction  # noqa
from app.models.wallet import Wallet  # noqa
from app.models.alert import Alert  # noqa
from app.models.audit import AuditLog  # noqa
from app.models.notification import Notification  # noqa