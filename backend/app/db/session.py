"""
Database session configuration.
This module sets up the database session for SQLAlchemy.
"""
import logging
from typing import Generator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Create engine for PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URI,
    pool_pre_ping=True,
    echo=False,
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

logger = logging.getLogger(__name__)


async def get_db_session() -> Generator[AsyncSession, None, None]:
    """
    Get a database session.
    
    Yields:
        AsyncSession: A database session
    """
    session = SessionLocal()
    try:
        yield session
    finally:
        await session.close()