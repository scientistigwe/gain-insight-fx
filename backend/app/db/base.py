"""
Database base configuration.
This module provides the Base class for SQLAlchemy models.
"""
# Import the Base class from session.py
from app.db.session import Base

# This file should only contain the Base import
# Model imports should be in base_class_imports.py to avoid circular imports