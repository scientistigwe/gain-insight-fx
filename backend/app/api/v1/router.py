from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, currencies, transactions, alerts, admin, analytics

api_router = APIRouter()

# Include available routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(currencies.router, prefix="/currencies", tags=["currencies"])
api_router.include_router(users.router, prefix="/users", tags=["users"])

api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])

api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])

api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
