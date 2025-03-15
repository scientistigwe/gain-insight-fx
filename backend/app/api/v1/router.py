"""
Main API router that includes all endpoint routers.
This module aggregates all API routes from different modules.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,         # Authentication endpoints
    users,        # User management
    currencies,   # Currency and exchange rates
    transactions, # User transactions
    alerts,       # User alerts
    admin,        # Admin operations
    analytics     # Analytics and insights
)

# Create the main API router
api_router = APIRouter()

# Authentication routes
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

# User routes
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

# Currency routes
api_router.include_router(
    currencies.router,
    prefix="/currencies",
    tags=["currencies"]
)

# Transaction routes
api_router.include_router(
    transactions.router,
    prefix="/transactions",
    tags=["transactions"]
)

# Alert routes
api_router.include_router(
    alerts.router,
    prefix="/alerts",
    tags=["alerts"]
)

# Admin routes
api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"]
)

# Analytics routes
api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["analytics"]
)