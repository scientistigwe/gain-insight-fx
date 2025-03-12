"""
Application event handlers.
This module contains functions for handling application lifecycle events.
"""
import logging
from typing import Callable

from fastapi import FastAPI

from app.db.init_db import init_db
from app.core.scheduler import start_scheduler, stop_scheduler

logger = logging.getLogger(__name__)


def create_start_app_handler(app: FastAPI) -> Callable:
    """
    Creates a function to handle application startup events.
    
    Args:
        app: The FastAPI application
        
    Returns:
        Function that will be called on application startup
    """
    async def start_app() -> None:
        """
        Initialize application on startup.
        """
        logger.info("Running startup initialization...")
        
        # Initialize database with default data
        await init_db()
        
        # Start background tasks
        await start_scheduler()
        
        logger.info("Startup initialization complete")
    
    return start_app


def create_stop_app_handler(app: FastAPI) -> Callable:
    """
    Creates a function to handle application shutdown events.
    
    Args:
        app: The FastAPI application
        
    Returns:
        Function that will be called on application shutdown
    """
    async def stop_app() -> None:
        """
        Clean up application resources on shutdown.
        """
        logger.info("Running shutdown cleanup...")
        
        # Stop background tasks
        await stop_scheduler()
        
        logger.info("Shutdown cleanup complete")
    
    return stop_app