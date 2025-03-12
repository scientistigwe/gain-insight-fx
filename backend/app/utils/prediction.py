"""
Exchange rate prediction utilities.
This module provides algorithms for exchange rate prediction and analysis.
"""
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.currency import Currency, ExchangeRate
from app.models.alert import Alert
from app.services.notification import send_alert_notification

logger = logging.getLogger(__name__)


async def get_historical_rates(
    db: AsyncSession, 
    base_currency_id: int, 
    quote_currency_id: int, 
    days: int
) -> List[Dict[str, Any]]:
    """
    Get historical exchange rates for a currency pair.
    
    Args:
        db: Database session
        base_currency_id: ID of the base currency
        quote_currency_id: ID of the quote currency
        days: Number of days of historical data to retrieve
        
    Returns:
        List of exchange rate records
    """
    # Calculate start date
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Query for historical rates
    query = select(ExchangeRate).where(
        ExchangeRate.base_currency_id == base_currency_id,
        ExchangeRate.quote_currency_id == quote_currency_id,
        ExchangeRate.timestamp >= start_date
    ).order_by(ExchangeRate.timestamp.desc())
    
    result = await db.execute(query)
    rates = result.scalars().all()
    
    return [
        {
            "rate": float(rate.rate),
            "timestamp": rate.timestamp,
            "source": rate.source
        }
        for rate in rates
    ]


def calculate_statistics(rates: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate statistical metrics for a series of exchange rates.
    
    Args:
        rates: List of exchange rate records
        
    Returns:
        Dictionary of statistical metrics
    """
    if not rates:
        return {
            "mean": None,
            "median": None,
            "std_dev": None,
            "min": None,
            "max": None,
            "volatility": None,
            "trend": None
        }
    
    # Extract rate values
    rate_values = [r["rate"] for r in rates]
    
    # Calculate statistics
    mean_rate = np.mean(rate_values)
    median_rate = np.median(rate_values)
    std_dev = np.std(rate_values)
    min_rate = min(rate_values)
    max_rate = max(rate_values)
    
    # Calculate volatility (coefficient of variation)
    volatility = std_dev / mean_rate if mean_rate > 0 else 0
    
    # Calculate trend (simple linear regression slope)
    timestamps = [(r["timestamp"] - rates[-1]["timestamp"]).total_seconds() / 86400 for r in rates]  # Convert to days
    if len(timestamps) > 1 and len(set(timestamps)) > 1:
        slope, _ = np.polyfit(timestamps, rate_values, 1)
        # Normalize slope as percentage change per day
        trend = slope / mean_rate * 100
    else:
        trend = 0
    
    return {
        "mean": mean_rate,
        "median": median_rate,
        "std_dev": std_dev,
        "min": min_rate,
        "max": max_rate,
        "volatility": volatility,
        "trend": trend  # Percentage change per day
    }


def predict_future_rates(
    rates: List[Dict[str, Any]], 
    days_ahead: int = 7
) -> List[Dict[str, Any]]:
    """
    Predict future exchange rates using various algorithms.
    
    Args:
        rates: List of historical exchange rate records
        days_ahead: Number of days to predict ahead
        
    Returns:
        List of predicted rate values with confidence intervals
    """
    if not rates or len(rates) < 5:
        return []
    
    # Convert to pandas DataFrame for easier analysis
    df = pd.DataFrame([
        {"rate": r["rate"], "timestamp": r["timestamp"]} 
        for r in rates
    ])
    df = df.sort_values("timestamp")
    
    # Extract features (simple time index for now)
    df["time_index"] = range(len(df))
    
    # Calculate moving averages
    df["ma_3"] = df["rate"].rolling(window=3, min_periods=1).mean()
    df["ma_7"] = df["rate"].rolling(window=7, min_periods=1).mean()
    
    # Calculate simple exponential weighted moving average
    df["ewma"] = df["rate"].ewm(span=5, adjust=False).mean()
    
    # Simple linear regression
    X = df["time_index"].values.reshape(-1, 1)
    y = df["rate"].values
    
    if len(set(X.flatten())) > 1:  # Check if we have variation in X
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(X, y)
        
        # Generate future time indices
        future_time_indices = np.array(range(len(df), len(df) + days_ahead)).reshape(-1, 1)
        
        # Predict future rates
        future_rates_lr = model.predict(future_time_indices)
    else:
        # If we don't have enough data variation, use last value
        future_rates_lr = np.array([y[-1]] * days_ahead)
    
    # Attempt to fit ARIMA model if we have enough data
    try:
        from statsmodels.tsa.arima.model import ARIMA
        if len(df) >= 10:  # Need sufficient data for ARIMA
            # Fit ARIMA model (simple parameters for now)
            model = ARIMA(df["rate"].values, order=(1, 1, 0))
            model_fit = model.fit()
            
            # Forecast
            forecast = model_fit.forecast(steps=days_ahead)
            future_rates_arima = forecast
        else:
            future_rates_arima = future_rates_lr  # Fallback to linear regression
    except Exception as e:
        logger.warning(f"ARIMA model failed: {e}")
        future_rates_arima = future_rates_lr  # Fallback to linear regression
    
    # Average predictions from different models for robustness
    future_rates = (future_rates_lr + future_rates_arima) / 2
    
    # Calculate prediction error bounds (simple approach)
    std_dev = df["rate"].std()
    error_margin = std_dev * 1.96  # 95% confidence interval assuming normal distribution
    
    # Generate dates for predictions
    last_date = df["timestamp"].iloc[-1]
    future_dates = [last_date + timedelta(days=i+1) for i in range(days_ahead)]
    
    # Prepare prediction results
    predictions = []
    for i in range(days_ahead):
        predictions.append({
            "date": future_dates[i],
            "predicted_rate": float(future_rates[i]),
            "lower_bound": float(max(0, future_rates[i] - error_margin)),
            "upper_bound": float(future_rates[i] + error_margin),
            "confidence": 0.95  # 95% confidence interval
        })
    
    return predictions


def calculate_optimal_thresholds(
    rates: List[Dict[str, Any]], 
    statistics: Dict[str, Any], 
    predictions: List[Dict[str, Any]]
) -> Dict[str, float]:
    """
    Calculate optimal thresholds for buy/sell alerts.
    
    Args:
        rates: Historical exchange rates
        statistics: Statistical metrics
        predictions: Future rate predictions
        
    Returns:
        Dictionary with buy and sell thresholds
    """
    # Extract current rate
    current_rate = rates[0]["rate"] if rates else None
    if current_rate is None:
        return {"buy_threshold": 0, "sell_threshold": 0}
    
    # Extract statistical measures
    mean = statistics["mean"]
    std_dev = statistics["std_dev"]
    trend = statistics["trend"]
    
    # Default thresholds based on statistical measures
    default_buy_threshold = mean - std_dev  # Buy when rate is lower than average (good for buying foreign currency)
    default_sell_threshold = mean + std_dev  # Sell when rate is higher than average
    
    # Adjust thresholds based on trend
    trend_adjustment = trend * 5  # Scale trend impact
    
    buy_threshold = default_buy_threshold * (1 - trend_adjustment/100)  # Lower buy threshold if downward trend
    sell_threshold = default_sell_threshold * (1 + trend_adjustment/100)  # Raise sell threshold if upward trend
    
    # Consider predictions
    if predictions:
        # Calculate average predicted rate
        avg_predicted_rate = sum(p["predicted_rate"] for p in predictions) / len(predictions)
        
        # If prediction shows significant change, adjust thresholds
        predicted_change = (avg_predicted_rate - current_rate) / current_rate
        if abs(predicted_change) > 0.02:  # 2% change threshold
            # Adjust buy/sell thresholds based on predicted direction
            if predicted_change < 0:  # Predicted to decrease
                buy_threshold = avg_predicted_rate * 1.01  # Buy slightly above predicted low
            else:  # Predicted to increase
                sell_threshold = avg_predicted_rate * 0.99  # Sell slightly below predicted high
    
    return {
        "buy_threshold": max(0, buy_threshold),  # Ensure non-negative
        "sell_threshold": max(buy_threshold, sell_threshold)  # Ensure sell > buy
    }


async def generate_alerts_from_predictions(
    db: AsyncSession,
    base_currency_id: int,
    quote_currency_id: int,
    current_rate: float,
    thresholds: Dict[str, float]
) -> None:
    """
    Generate automatic alerts based on predicted thresholds.
    
    Args:
        db: Database session
        base_currency_id: Base currency ID
        quote_currency_id: Quote currency ID
        current_rate: Current exchange rate
        thresholds: Buy and sell thresholds
    """
    try:
        # Get currency details for better alert messages
        base_currency = await db.get(Currency, base_currency_id)
        quote_currency = await db.get(Currency, quote_currency_id)
        
        if not base_currency or not quote_currency:
            logger.error(f"Currency not found: {base_currency_id} or {quote_currency_id}")
            return
        
        currency_pair = f"{base_currency.code}/{quote_currency.code}"
        
        # Check for existing auto-generated alerts for this currency pair
        existing_alerts_query = select(Alert).where(
            Alert.base_currency_id == base_currency_id,
            Alert.quote_currency_id == quote_currency_id,
            Alert.is_auto_generated == True
        )
        existing_alerts_result = await db.execute(existing_alerts_query)
        existing_alerts = existing_alerts_result.scalars().all()
        
        # Delete old auto-generated alerts for this pair
        for alert in existing_alerts:
            await db.delete(alert)
        
        # Create new alerts based on thresholds
        buy_threshold = thresholds["buy_threshold"]
        sell_threshold = thresholds["sell_threshold"]
        
        # Only create alerts if thresholds are significantly different from current rate
        buy_delta = abs(current_rate - buy_threshold) / current_rate
        sell_delta = abs(sell_threshold - current_rate) / current_rate
        
        # Create buy alert if threshold is at least 2% away from current rate
        if buy_delta >= 0.02:
            buy_alert = Alert(
                base_currency_id=base_currency_id,
                quote_currency_id=quote_currency_id,
                threshold=buy_threshold,
                is_above_threshold=False,  # Alert when rate goes below threshold
                description=f"Auto-generated favorable buying opportunity for {currency_pair}",
                is_active=True,
                is_auto_generated=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(buy_alert)
        
        # Create sell alert if threshold is at least 2% away from current rate
        if sell_delta >= 0.02:
            sell_alert = Alert(
                base_currency_id=base_currency_id,
                quote_currency_id=quote_currency_id,
                threshold=sell_threshold,
                is_above_threshold=True,  # Alert when rate goes above threshold
                description=f"Auto-generated favorable selling opportunity for {currency_pair}",
                is_active=True,
                is_auto_generated=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(sell_alert)
        
        await db.commit()
        logger.info(f"Generated alerts for {currency_pair}: buy={buy_threshold}, sell={sell_threshold}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error generating alerts: {e}")


async def check_and_notify_triggered_alerts(db: AsyncSession) -> None:
    """
    Check all active alerts against current rates and send notifications if triggered.
    
    Args:
        db: Database session
    """
    try:
        # Get all active alerts
        alerts_query = select(Alert).where(Alert.is_active == True)
        alerts_result = await db.execute(alerts_query)
        alerts = alerts_result.scalars().all()
        
        if not alerts:
            return
        
        now = datetime.utcnow()
        
        # Process each alert
        for alert in alerts:
            # Get the latest exchange rate for this currency pair
            rate_query = select(ExchangeRate).where(
                ExchangeRate.base_currency_id == alert.base_currency_id,
                ExchangeRate.quote_currency_id == alert.quote_currency_id
            ).order_by(ExchangeRate.timestamp.desc()).limit(1)
            
            rate_result = await db.execute(rate_query)
            latest_rate = rate_result.scalar_one_or_none()
            
            if not latest_rate:
                continue
            
            # Check if alert is triggered
            rate_value = float(latest_rate.rate)
            threshold = float(alert.threshold)
            is_triggered = False
            
            if alert.is_above_threshold and rate_value >= threshold:
                is_triggered = True
            elif not alert.is_above_threshold and rate_value <= threshold:
                is_triggered = True
            
            # If alert is triggered
            if is_triggered:
                # Only notify if this is a new trigger or enough time has passed since last trigger
                should_notify = False
                
                if not alert.is_triggered:
                    # First time trigger
                    should_notify = True
                elif alert.last_triggered_at:
                    # Check if enough time has passed since last notification (24 hours)
                    time_since_last = now - alert.last_triggered_at
                    if time_since_last.total_seconds() > 24 * 3600:
                        should_notify = True
                else:
                    should_notify = True
                
                if should_notify:
                    # Get currency details for notification
                    base_currency = await db.get(Currency, alert.base_currency_id)
                    quote_currency = await db.get(Currency, alert.quote_currency_id)
                    
                    if base_currency and quote_currency:
                        # Prepare notification details
                        currency_pair = f"{base_currency.code}/{quote_currency.code}"
                        direction = "above" if alert.is_above_threshold else "below"
                        
                        notification_data = {
                            "alert_id": alert.id,
                            "user_id": alert.user_id,
                            "currency_pair": currency_pair,
                            "threshold": threshold,
                            "current_rate": rate_value,
                            "direction": direction,
                            "timestamp": now.isoformat()
                        }
                        
                        # Send notification
                        await send_alert_notification(notification_data)
                        
                        # Update alert status
                        alert.is_triggered = True
                        alert.last_triggered_at = now
                        
                        # For auto-generated alerts, deactivate after triggering
                        if alert.is_auto_generated:
                            alert.is_active = False
                        
                        await db.commit()
                        
                        logger.info(f"Alert {alert.id} triggered and notification sent")
            elif alert.is_triggered:
                # If was previously triggered but not anymore, reset trigger status
                if (alert.is_above_threshold and rate_value < threshold * 0.98) or \
                   (not alert.is_above_threshold and rate_value > threshold * 1.02):
                    alert.is_triggered = False
                    await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Error checking and notifying alerts: {e}")


async def run_prediction_analysis() -> None:
    """
    Run prediction analysis on all active currency pairs and generate alerts.
    This function should be called periodically from a background task.
    """
    logger.info("Starting prediction analysis run")
    
    async for db in get_db_session():
        try:
            # Get all active currencies
            currencies_query = select(Currency).where(Currency.is_active == True)
            currencies_result = await db.execute(currencies_query)
            currencies = currencies_result.scalars().all()
            
            if not currencies:
                logger.warning("No active currencies found")
                return
            
            # Find NGN currency (main currency for our system)
            ngn_currency = next((c for c in currencies if c.code == 'NGN'), None)
            if not ngn_currency:
                logger.warning("NGN currency not found")
                return
            
            # Run analysis for each currency pair with NGN as base
            for quote_currency in currencies:
                # Skip NGN to NGN
                if quote_currency.id == ngn_currency.id:
                    continue
                
                # Get historical rates
                historical_rates = await get_historical_rates(
                    db=db,
                    base_currency_id=ngn_currency.id,
                    quote_currency_id=quote_currency.id,
                    days=settings.PREDICTION_WINDOW_DAYS
                )
                
                if not historical_rates:
                    logger.warning(f"No historical rates for NGN/{quote_currency.code}")
                    continue
                
                # Calculate statistics
                stats = calculate_statistics(historical_rates)
                
                # Make predictions
                predictions = predict_future_rates(
                    rates=historical_rates,
                    days_ahead=settings.PREDICTION_HORIZON_DAYS
                )
                
                # Calculate optimal thresholds
                thresholds = calculate_optimal_thresholds(
                    rates=historical_rates,
                    statistics=stats,
                    predictions=predictions
                )
                
                # Generate alerts from predictions
                current_rate = historical_rates[0]["rate"] if historical_rates else 0
                await generate_alerts_from_predictions(
                    db=db,
                    base_currency_id=ngn_currency.id,
                    quote_currency_id=quote_currency.id,
                    current_rate=current_rate,
                    thresholds=thresholds
                )
                
                logger.info(f"Completed prediction analysis for NGN/{quote_currency.code}")
            
            logger.info("Prediction analysis run completed")
        except Exception as e:
            logger.error(f"Error in prediction analysis: {e}")


async def check_alerts() -> None:
    """
    Check all alerts against current rates and notify users if triggered.
    This function should be called periodically from a background task.
    """
    logger.info("Starting alert check run")
    
    async for db in get_db_session():
        try:
            await check_and_notify_triggered_alerts(db)
            logger.info("Alert check run completed")
        except Exception as e:
            logger.error(f"Error in alert check: {e}")