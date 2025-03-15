"""
Database model imports.
This module imports all models to ensure they are registered with SQLAlchemy.
"""

# Import all models here to ensure they are registered with SQLAlchemy
# The Base class is imported in the models from base.py, not from here

# Import all models
from app.models.user import User  # noqa
from app.models.currency import Currency, ExchangeRate  # noqa
from app.models.transaction import Transaction  # noqa
from app.models.wallet import Wallet  # noqa
from app.models.alert import Alert  # noqa
from app.models.audit import AuditLog  # noqa
from app.models.notification import Notification  # noqa

# This file should be imported by alembic or other modules
# that need to have all models imported