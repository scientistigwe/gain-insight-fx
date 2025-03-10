from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import httpx
from fastapi import HTTPException
import numpy as np
from sklearn.linear_model import LinearRegression

from app.core.config import settings
from app.db.firebase import currencies_collection, exchange_rates_collection
from app.schemas.currency import Currency, ExchangeRate, CurrencyTrend

async def fetch_exchange_rates_from_api() -> Dict[str, float]:
    """Fetch latest exchange rates from external API"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            settings.EXCHANGE_RATE_API_URL,
            params={
                "base": settings.DEFAULT_BASE_CURRENCY,
                "symbols": ",".join(settings.TRACKED_CURRENCIES),
                "apikey": settings.EXCHANGE_RATE_API_KEY
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error fetching rates: {response.text}"
            )
        
        data = response.json()
        
        if not data.get("success"):
            raise HTTPException(
                status_code=500,
                detail="API returned unsuccessful response"
            )
        
        return data.get("rates", {})

async def update_exchange_rates():
    """Fetch and store latest exchange rates"""
    rates = await fetch_exchange_rates_from_api()
    timestamp = datetime.utcnow()
    
    batch = exchange_rates_collection.batch()
    
    for currency_code, rate in rates.items():
        # Get currency reference
        currency_ref = None
        currencies = currencies_collection.where("code", "==", currency_code).limit(1).get()
        
        for curr in currencies:
            currency_ref = curr.reference
        
        # If currency doesn't exist yet, create it
        if not currency_ref:
            currency_data = {
                "code": currency_code,
                "name": get_currency_name(currency_code),
                "symbol": get_currency_symbol(currency_code),
                "created_at": timestamp,
                "updated_at": timestamp
            }
            currency_ref = currencies_collection.document()
            batch.set(currency_ref, currency_data)
        
        # Add exchange rate
        rate_ref = exchange_rates_collection.document()
        rate_data = {
            "currency_code": currency_code,
            "base_currency": settings.DEFAULT_BASE_CURRENCY,
            "rate": rate,
            "source": "exchangerate.host",
            "timestamp": timestamp
        }
        batch.set(rate_ref, rate_data)
    
    # Commit the batch
    batch.commit()
    
    return rates

def get_currency_name(currency_code: str) -> str:
    """Get full currency name from code"""
    currency_names = {
        "USD": "US Dollar",
        "GBP": "British Pound",
        "EUR": "Euro",
        "NGN": "Nigerian Naira",
    }
    return currency_names.get(currency_code, currency_code)

def get_currency_symbol(currency_code: str) -> str:
    """Get currency symbol from code"""
    currency_symbols = {
        "USD": "$",
        "GBP": "£",
        "EUR": "€",
        "NGN": "₦",
    }
    return currency_symbols.get(currency_code, currency_code)

async def get_current_rates() -> List[ExchangeRate]:
    """Get the most recent exchange rates for all tracked currencies"""
    result = []
    
    for currency_code in settings.TRACKED_CURRENCIES:
        # Get the most recent rate for this currency
        rates = exchange_rates_collection.where(
            "currency_code", "==", currency_code
        ).order_by(
            "timestamp", direction="DESCENDING"
        ).limit(1).get()
        
        for rate_doc in rates:
            rate_data = rate_doc.to_dict()
            rate_data["id"] = rate_doc.id
            result.append(ExchangeRate(**rate_data))
    
    # If any rate is older than 1 hour, fetch new rates
    should_update = False
    if result:
        oldest_rate = min(result, key=lambda r: r.timestamp)
        if (datetime.utcnow() - oldest_rate.timestamp) > timedelta(hours=1):
            should_update = True
    else:
        should_update = True
        
    if should_update:
        await update_exchange_rates()
        # Get fresh rates
        return await get_current_rates()
        
    return result

async def get_historical_rates(currency_code: str, days: int = 30) -> List[ExchangeRate]:
    """Get historical exchange rates for a specific currency"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    rates = exchange_rates_collection.where(
        "currency_code", "==", currency_code
    ).where(
        "timestamp", ">=", start_date
    ).where(
        "timestamp", "<=", end_date
    ).order_by(
        "timestamp"
    ).get()
    
    result = []
    for rate_doc in rates:
        rate_data = rate_doc.to_dict()
        rate_data["id"] = rate_doc.id
        result.append(ExchangeRate(**rate_data))
    
    return result

async def get_currency_trend_analysis(currency_code: str, days: int = 30) -> CurrencyTrend:
    """Analyze trends for a specific currency"""
    rates = await get_historical_rates(currency_code, days)
    
    if not rates:
        raise HTTPException(
            status_code=404,
            detail=f"No rate data found for {currency_code} in the last {days} days"
        )
    
    # Extract rate values and timestamps
    rate_values = [r.rate for r in rates]
    timestamps = [(r.timestamp - rates[0].timestamp).total_seconds() / (24*3600) for r in rates]
    
    # Calculate basic statistics
    min_rate = min(rate_values)
    max_rate = max(rate_values)
    avg_rate = sum(rate_values) / len(rate_values)
    current_rate = rate_values[-1]
    
    # Calculate trend using linear regression
    X = np.array(timestamps).reshape(-1, 1)
    y = np.array(rate_values)
    
    model = LinearRegression()
    model.fit(X, y)
    
    slope = model.coef_[0]
    
    # Determine trend direction
    if abs(slope) < 0.01:  # Very small slope
        trend_direction = "stable"
    elif slope > 0:
        trend_direction = "rising"
    else:
        trend_direction = "falling"
    
    # Calculate volatility (standard deviation / average)
    volatility = np.std(rate_values) / avg_rate
    
    # Make predictions for future days
    future_days = [7, 14, 30]
    predictions = {}
    
    for day in future_days:
        future_x = np.array([[timestamps[-1] + day]])
        predicted_rate = model.predict(future_x)[0]
        predictions[f"{day}_day"] = max(0, predicted_rate)  # Ensure rate is positive
    
    return CurrencyTrend(
        currency_code=currency_code,
        currency_name=get_currency_name(currency_code),
        current_rate=current_rate,
        min_rate=min_rate,
        max_rate=max_rate,
        avg_rate=avg_rate,
        trend_direction=trend_direction,
        volatility=volatility,
        predictions=predictions,
        data_points=len(rates)
    )