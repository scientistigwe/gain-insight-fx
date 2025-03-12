"""
Exchange rate API integrations.
This module handles fetching exchange rate data from various providers.
"""
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.currency import Currency, ExchangeRate
from app.db.session import get_db_session

logger = logging.getLogger(__name__)

# API keys are loaded from environment variables via settings
EXCHANGERATE_API_KEY = settings.EXCHANGERATE_API_KEY  # For exchangerate-api.com
FIXER_API_KEY = settings.FIXER_API_KEY  # For fixer.io
OPENEXCHANGERATES_API_KEY = settings.OPENEXCHANGERATES_API_KEY  # For openexchangerates.org

# API endpoints
EXCHANGERATE_API_URL = f"https://v6.exchangerate-api.com/v6/{EXCHANGERATE_API_KEY}/latest/"
FIXER_API_URL = f"http://data.fixer.io/api/latest?access_key={FIXER_API_KEY}"
OPENEXCHANGERATES_API_URL = f"https://openexchangerates.org/api/latest.json?app_id={OPENEXCHANGERATES_API_KEY}"


async def fetch_from_exchangerate_api(base_currency: str) -> Optional[Dict[str, float]]:
    """
    Fetch exchange rates from exchangerate-api.com.
    
    Args:
        base_currency: ISO currency code for the base currency
        
    Returns:
        Dictionary of currency codes to exchange rates, or None if request failed
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{EXCHANGERATE_API_URL}{base_currency}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('result') == 'success':
                    return data.get('conversion_rates', {})
            
            logger.warning(f"ExchangeRate-API request failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error fetching from ExchangeRate-API: {e}")
        return None


async def fetch_from_fixer(base_currency: str) -> Optional[Dict[str, float]]:
    """
    Fetch exchange rates from fixer.io.
    Note: Free plan only supports EUR as base currency.
    
    Args:
        base_currency: ISO currency code for the base currency (ignored in free plan)
        
    Returns:
        Dictionary of currency codes to exchange rates, or None if request failed
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Note: Free plan only supports EUR as base
            response = await client.get(FIXER_API_URL)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    rates = data.get('rates', {})
                    
                    # If base_currency is not EUR, convert rates
                    if base_currency != 'EUR' and base_currency in rates and rates[base_currency] > 0:
                        eur_to_base = rates[base_currency]
                        return {curr: rate / eur_to_base for curr, rate in rates.items()}
                    
                    return rates
            
            logger.warning(f"Fixer.io request failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error fetching from Fixer.io: {e}")
        return None


async def fetch_from_openexchangerates(base_currency: str) -> Optional[Dict[str, float]]:
    """
    Fetch exchange rates from openexchangerates.org.
    Note: Free plan only supports USD as base currency.
    
    Args:
        base_currency: ISO currency code for the base currency (ignored in free plan)
        
    Returns:
        Dictionary of currency codes to exchange rates, or None if request failed
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Note: Free plan only supports USD as base
            response = await client.get(OPENEXCHANGERATES_API_URL)
            
            if response.status_code == 200:
                data = response.json()
                rates = data.get('rates', {})
                
                # If base_currency is not USD, convert rates
                if base_currency != 'USD' and base_currency in rates and rates[base_currency] > 0:
                    usd_to_base = rates[base_currency]
                    return {curr: rate / usd_to_base for curr, rate in rates.items()}
                
                return rates
            
            logger.warning(f"OpenExchangeRates request failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error fetching from OpenExchangeRates: {e}")
        return None


async def get_exchange_rates(base_currency: str) -> Tuple[Dict[str, float], str]:
    """
    Get exchange rates from multiple sources with fallback.
    
    Args:
        base_currency: ISO currency code for the base currency
        
    Returns:
        Tuple of (rates_dict, source) where rates_dict is exchange rates and source is the API used
    """
    # Try each API in succession
    exchangerate_data = await fetch_from_exchangerate_api(base_currency)
    if exchangerate_data:
        return exchangerate_data, "exchangerate-api.com"
    
    fixer_data = await fetch_from_fixer(base_currency)
    if fixer_data:
        return fixer_data, "fixer.io"
    
    openexchangerates_data = await fetch_from_openexchangerates(base_currency)
    if openexchangerates_data:
        return openexchangerates_data, "openexchangerates.org"
    
    logger.error("All exchange rate APIs failed to return data")
    return {}, "none"


async def fetch_and_store_exchange_rates(db: AsyncSession) -> bool:
    """
    Fetch latest exchange rates and store them in the database.
    
    Args:
        db: Database session
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Get all currencies from database
        currencies_result = await db.execute(Currency.__table__.select().where(Currency.is_active == True))
        currencies = currencies_result.scalars().all()
        
        if not currencies:
            logger.warning("No active currencies found in database")
            return False
        
        # Find NGN currency (assumed to be our main currency)
        ngn_currency = next((c for c in currencies if c.code == 'NGN'), None)
        if not ngn_currency:
            logger.warning("NGN currency not found in database")
            return False
        
        # Fetch USD rates as most APIs support USD as base
        usd_rates, source = await get_exchange_rates('USD')
        if not usd_rates:
            logger.error("Failed to fetch exchange rates from any source")
            return False
        
        # Current timestamp
        now = datetime.utcnow()
        
        # Create a mapping of currency codes to IDs for quick lookup
        currency_map = {c.code: c.id for c in currencies}
        
        # Prepare exchange rate records
        exchange_rates = []
        
        # Add NGN to USD rate
        if 'NGN' in usd_rates and usd_rates['NGN'] > 0:
            ngn_to_usd_rate = 1 / usd_rates['NGN']
            
            # Add base rate (NGN to USD)
            usd_currency_id = currency_map.get('USD')
            if usd_currency_id:
                ngn_to_usd = ExchangeRate(
                    base_currency_id=ngn_currency.id,
                    quote_currency_id=usd_currency_id,
                    rate=ngn_to_usd_rate,
                    source=source,
                    timestamp=now,
                    created_at=now
                )
                exchange_rates.append(ngn_to_usd)
            
            # Add all other currency rates against NGN
            for currency_code, usd_to_curr_rate in usd_rates.items():
                if currency_code in currency_map and currency_code != 'NGN' and currency_code != 'USD':
                    # NGN to currency rate = (NGN to USD) * (USD to currency)
                    ngn_to_curr_rate = ngn_to_usd_rate * usd_to_curr_rate
                    
                    rate = ExchangeRate(
                        base_currency_id=ngn_currency.id,
                        quote_currency_id=currency_map[currency_code],
                        rate=ngn_to_curr_rate,
                        source=source,
                        timestamp=now,
                        created_at=now
                    )
                    exchange_rates.append(rate)
        else:
            logger.error("NGN rate not found in API response")
            return False
        
        # Add all rates to database
        for rate in exchange_rates:
            db.add(rate)
        
        await db.commit()
        logger.info(f"Successfully stored {len(exchange_rates)} exchange rates from {source}")
        return True
    except Exception as e:
        await db.rollback()
        logger.error(f"Error storing exchange rates: {e}")
        return False


async def update_exchange_rates() -> bool:
    """
    Update exchange rates in the database.
    This function is designed to be called periodically.
    
    Returns:
        True if successful, False otherwise
    """
    try:
        async for db in get_db_session():
            return await fetch_and_store_exchange_rates(db)
        return False
    except Exception as e:
        logger.error(f"Error updating exchange rates: {e}")
        return False


async def get_historical_rates_for_currency_pair(
    db: AsyncSession,
    base_currency_id: int,
    quote_currency_id: int,
    days: int = 30
) -> List[Dict[str, Any]]:
    """
    Get historical exchange rates for a specific currency pair.
    
    Args:
        db: Database session
        base_currency_id: Base currency ID
        quote_currency_id: Quote currency ID
        days: Number of days to look back
        
    Returns:
        List of historical rates with timestamps
    """
    from sqlalchemy import select
    from datetime import datetime, timedelta
    
    # Calculate start date
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Query historical rates
    query = select(ExchangeRate).where(
        ExchangeRate.base_currency_id == base_currency_id,
        ExchangeRate.quote_currency_id == quote_currency_id,
        ExchangeRate.timestamp >= start_date
    ).order_by(ExchangeRate.timestamp.desc())
    
    result = await db.execute(query)
    rates = result.scalars().all()
    
    # Format as list of dictionaries
    formatted_rates = []
    for rate in rates:
        formatted_rates.append({
            "id": rate.id,
            "rate": float(rate.rate),
            "timestamp": rate.timestamp,
            "source": rate.source
        })
    
    return formatted_rates


async def get_current_rate(
    db: AsyncSession,
    base_currency_id: int,
    quote_currency_id: int
) -> Optional[float]:
    """
    Get the most recent exchange rate for a currency pair.
    
    Args:
        db: Database session
        base_currency_id: Base currency ID
        quote_currency_id: Quote currency ID
        
    Returns:
        Most recent exchange rate or None if not found
    """
    from sqlalchemy import select
    
    # Query for the most recent rate
    query = select(ExchangeRate).where(
        ExchangeRate.base_currency_id == base_currency_id,
        ExchangeRate.quote_currency_id == quote_currency_id
    ).order_by(ExchangeRate.timestamp.desc()).limit(1)
    
    result = await db.execute(query)
    rate = result.scalar_one_or_none()
    
    if rate:
        return float(rate.rate)
    return None


async def get_all_current_rates(db: AsyncSession, base_currency_code: str = 'NGN') -> List[Dict[str, Any]]:
    """
    Get all current exchange rates for a base currency.
    
    Args:
        db: Database session
        base_currency_code: Base currency code
        
    Returns:
        List of current rates for all currencies
    """
    from sqlalchemy import select
    
    # Get base currency ID
    base_query = select(Currency).where(Currency.code == base_currency_code)
    base_result = await db.execute(base_query)
    base_currency = base_result.scalar_one_or_none()
    
    if not base_currency:
        logger.error(f"Base currency {base_currency_code} not found")
        return []
    
    # Get all active currencies
    currencies_query = select(Currency).where(Currency.is_active == True)
    currencies_result = await db.execute(currencies_query)
    currencies = currencies_result.scalars().all()
    
    current_rates = []
    
    # Get the most recent rate for each pair
    for quote_currency in currencies:
        # Skip same currency
        if quote_currency.id == base_currency.id:
            continue
        
        # Get most recent rate
        rate_value = await get_current_rate(db, base_currency.id, quote_currency.id)
        if rate_value is not None:
            current_rates.append({
                "base_currency": {
                    "id": base_currency.id,
                    "code": base_currency.code,
                    "name": base_currency.name,
                    "symbol": base_currency.symbol
                },
                "quote_currency": {
                    "id": quote_currency.id,
                    "code": quote_currency.code,
                    "name": quote_currency.name,
                    "symbol": quote_currency.symbol
                },
                "rate": rate_value,
                "timestamp": datetime.utcnow()
            })
    
    return current_rates