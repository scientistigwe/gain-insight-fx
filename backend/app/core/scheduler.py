"""
Background task scheduler.
This module sets up periodic tasks for the application.
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Callable, Dict, Set

from app.core.config import settings
from app.utils.exchange_apis import update_exchange_rates
from app.utils.prediction import run_prediction_analysis, check_alerts

logger = logging.getLogger(__name__)

# Store running tasks
running_tasks: Dict[str, asyncio.Task] = {}
scheduled_tasks: Set[str] = set()


async def periodic_task(name: str, coro: Callable, interval_seconds: int) -> None:
    """
    Run a coroutine periodically.
    
    Args:
        name: Task name for logging
        coro: Coroutine to run
        interval_seconds: Interval between runs in seconds
    """
    logger.info(f"Starting periodic task: {name}")
    
    while True:
        try:
            start_time = datetime.utcnow()
            logger.info(f"Running task {name}")
            
            await coro()
            
            end_time = datetime.utcnow()
            elapsed = (end_time - start_time).total_seconds()
            logger.info(f"Task {name} completed in {elapsed:.2f} seconds")
            
            # Sleep until next interval
            wait_time = max(0, interval_seconds - elapsed)
            await asyncio.sleep(wait_time)
        except asyncio.CancelledError:
            logger.info(f"Task {name} cancelled")
            break
        except Exception as e:
            logger.error(f"Error in task {name}: {e}")
            # Wait before retrying
            await asyncio.sleep(min(interval_seconds, 60))


async def start_scheduler() -> None:
    """
    Start the background task scheduler.
    """
    logger.info("Starting background task scheduler")
    
    # Define tasks with their intervals
    tasks = {
        "exchange_rate_update": (update_exchange_rates, settings.EXCHANGE_RATE_UPDATE_INTERVAL),
        "prediction_analysis": (run_prediction_analysis, 24 * 3600),  # Run once per day
        "alert_check": (check_alerts, settings.ALERT_CHECK_INTERVAL),
    }
    
    # Create and start tasks
    for name, (coro, interval) in tasks.items():
        if name not in scheduled_tasks:
            task = asyncio.create_task(periodic_task(name, coro, interval))
            running_tasks[name] = task
            scheduled_tasks.add(name)
    
    logger.info("Background tasks scheduled")


async def stop_scheduler() -> None:
    """
    Stop all running tasks.
    """
    logger.info("Stopping background task scheduler")
    
    for name, task in running_tasks.items():
        if not task.done():
            logger.info(f"Cancelling task: {name}")
            task.cancel()
            
            try:
                await task
            except asyncio.CancelledError:
                pass
    
    running_tasks.clear()
    scheduled_tasks.clear()
    logger.info("All background tasks stopped")