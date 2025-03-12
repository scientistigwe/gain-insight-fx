from datetime import datetime, timedelta
from typing import Dict, List, Any
import numpy as np

from app.services.transaction import get_user_transactions
from app.services.currency import get_historical_rates, get_currency_trend_analysis
from app.schemas.transaction import Transaction

async def analyze_profit_loss(user_id: str) -> Dict[str, Any]:
    """Analyze profit and loss from currency exchanges"""
    # Get all user transactions
    transactions = await get_user_transactions(user_id)
    
    if not transactions:
        return {
            "total_profit_loss": 0,
            "by_currency": {},
            "by_month": {}
        }
    
    # Initialize result structure
    result = {
        "total_profit_loss": 0,
        "by_currency": {},
        "by_month": {}
    }
    
    # Analyze each transaction
    for transaction in transactions:
        # Only consider currency exchange transactions
        if transaction.from_currency != "external" and transaction.from_currency != transaction.to_currency:
            # Calculate profit/loss in terms of the base currency (usually NGN)
            base_currency = "NGN"
            
            if transaction.from_currency == base_currency or transaction.to_currency == base_currency:
                # Direct exchange with base currency
                if transaction.from_currency == base_currency:
                    # NGN -> Foreign
                    amount_out = transaction.amount
                    theoretical_return = transaction.amount / transaction.exchange_rate
                    profit_loss = theoretical_return - amount_out
                else:
                    # Foreign -> NGN
                    amount_out = transaction.amount
                    theoretical_return = transaction.amount * transaction.exchange_rate
                    profit_loss = theoretical_return - amount_out
            else:
                # Cross-currency exchange, need to calculate in base currency
                # This is a simplification
                profit_loss = 0
            
            # Adjust for fees
            profit_loss -= transaction.fees or 0
            
            # Add to total
            result["total_profit_loss"] += profit_loss
            
            # Add to currency breakdown
            currency_pair = f"{transaction.from_currency}/{transaction.to_currency}"
            if currency_pair not in result["by_currency"]:
                result["by_currency"][currency_pair] = {
                    "transactions": 0,
                    "profit_loss": 0
                }
            result["by_currency"][currency_pair]["transactions"] += 1
            result["by_currency"][currency_pair]["profit_loss"] += profit_loss
            
            # Add to monthly breakdown
            month = transaction.created_at.strftime("%Y-%m")
            if month not in result["by_month"]:
                result["by_month"][month] = {
                    "transactions": 0,
                    "profit_loss": 0
                }
            result["by_month"][month]["transactions"] += 1
            result["by_month"][month]["profit_loss"] += profit_loss
    
    return result

async def get_transaction_statistics(user_id: str) -> Dict[str, Any]:
    """Get overall statistics about user transactions"""
    # Get all user transactions
    transactions = await get_user_transactions(user_id)
    
    if not transactions:
        return {
            "total_transactions": 0,
            "total_volume": 0,
            "avg_transaction_size": 0,
            "by_currency": {},
            "by_month": {}
        }
    
    # Initialize result
    result = {
        "total_transactions": len(transactions),
        "total_volume": 0,
        "avg_transaction_size": 0,
        "by_currency": {},
        "by_month": {}
    }
    
    # Calculate statistics
    for transaction in transactions:
        # Add to total volume
        result["total_volume"] += transaction.amount
        
        # Add to currency breakdown
        from_currency = transaction.from_currency
        if from_currency not in result["by_currency"]:
            result["by_currency"][from_currency] = {
                "sent": 0,
                "received": 0,
                "count": 0
            }
        
        to_currency = transaction.to_currency
        if to_currency not in result["by_currency"]:
            result["by_currency"][to_currency] = {
                "sent": 0,
                "received": 0,
                "count": 0
            }
        
        result["by_currency"][from_currency]["sent"] += transaction.amount
        result["by_currency"][from_currency]["count"] += 1
        
        result["by_currency"][to_currency]["received"] += transaction.amount * transaction.exchange_rate
        result["by_currency"][to_currency]["count"] += 1
        
        # Add to monthly breakdown
        month = transaction.created_at.strftime("%Y-%m")
        if month not in result["by_month"]:
            result["by_month"][month] = {
                "count": 0,
                "volume": 0
            }
        
        result["by_month"][month]["count"] += 1
        result["by_month"][month]["volume"] += transaction.amount
    
    # Calculate average transaction size
    if result["total_transactions"] > 0:
        result["avg_transaction_size"] = result["total_volume"] / result["total_transactions"]
    
    return result

async def get_currency_performance(user_id: str, days: int = 90) -> Dict[str, Any]:
    """Analyze the performance of different currencies over time"""
    result = {}
    
    for currency_code in ["USD", "GBP", "EUR"]:
        try:
            trend = await get_currency_trend_analysis(currency_code, days)
            performance = {
                "current_rate": trend.current_rate,
                "avg_rate": trend.avg_rate,
                "min_rate": trend.min_rate,
                "max_rate": trend.max_rate,
                "trend_direction": trend.trend_direction,
                "volatility": trend.volatility,
                "change_percent": ((trend.current_rate - trend.avg_rate) / trend.avg_rate) * 100,
                "predictions": trend.predictions
            }
            result[currency_code] = performance
        except Exception as e:
            print(f"Error analyzing {currency_code}: {e}")
    
    return result

async def find_best_opportunities(user_id: str) -> Dict[str, Any]:
    """Find the best currency exchange opportunities based on trends and thresholds"""
    opportunities = {
        "buy": [],
        "sell": [],
        "hold": []
    }
    
    for currency_code in ["USD", "GBP", "EUR"]:
        try:
            trend = await get_currency_trend_analysis(currency_code, 30)
            
            # Calculate scores for different actions
            buy_score = 0
            sell_score = 0
            hold_score = 50  # Neutral starting point
            
            # Buying is favorable when:
            # 1. Current rate is below average (undervalued)
            # 2. Trend is falling (may go lower)
            # 3. Volatility is low (stable prediction)
            if trend.current_rate < trend.avg_rate:
                # Undervalued
                undervalued_percent = ((trend.avg_rate - trend.current_rate) / trend.avg_rate) * 100
                buy_score += min(50, undervalued_percent * 5)  # Cap at 50 points
            
            if trend.trend_direction == "falling":
                buy_score += 30
            elif trend.trend_direction == "stable":
                buy_score += 15
            
            if trend.volatility < 0.02:  # Low volatility
                buy_score += 20
            
            # Selling is favorable when:
            # 1. Current rate is above average (overvalued)
            # 2. Trend is rising (may go higher)
            # 3. Volatility is low (stable prediction)
            if trend.current_rate > trend.avg_rate:
                # Overvalued
                overvalued_percent = ((trend.current_rate - trend.avg_rate) / trend.avg_rate) * 100
                sell_score += min(50, overvalued_percent * 5)  # Cap at 50 points
            
            if trend.trend_direction == "rising":
                sell_score += 30
            elif trend.trend_direction == "stable":
                sell_score += 15
            
            if trend.volatility < 0.02:  # Low volatility
                sell_score += 20
            
            # Holding is favorable when:
            # 1. Trend is stable or slightly rising
            # 2. Future predictions show improvement
            if trend.trend_direction == "stable":
                hold_score += 30
            elif trend.trend_direction == "rising":
                hold_score += 20
            
            if trend.predictions.get("30_day", 0) > trend.current_rate:
                hold_score += min(30, ((trend.predictions["30_day"] - trend.current_rate) / trend.current_rate) * 100)
            
            # Determine best action based on scores
            scores = {
                "buy": buy_score,
                "sell": sell_score,
                "hold": hold_score
            }
            best_action = max(scores, key=scores.get)
            
            # Add to opportunities list
            opportunity = {
                "currency_code": currency_code,
                "current_rate": trend.current_rate,
                "avg_rate": trend.avg_rate,
                "trend_direction": trend.trend_direction,
                "scores": scores,
                "best_action": best_action,
                "confidence": scores[best_action] / 100  # Convert to 0-1 scale
            }
            
            opportunities[best_action].append(opportunity)
        except Exception as e:
            print(f"Error analyzing opportunities for {currency_code}: {e}")
    
    # Sort each category by confidence (highest first)
    for action in opportunities:
        opportunities[action] = sorted(
            opportunities[action],
            key=lambda x: x["confidence"],
            reverse=True
        )
    
    return opportunities