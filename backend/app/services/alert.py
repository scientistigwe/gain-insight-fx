from datetime import datetime
from typing import List, Optional

from app.db.firebase import alerts_collection
from app.schemas.alert import Alert, AlertCreate, AlertUpdate

async def create_alert(alert_in: AlertCreate) -> Alert:
    """Create a new alert"""
    timestamp = datetime.utcnow()
    
    # Convert to dict for Firestore
    alert_data = alert_in.dict()
    alert_data["created_at"] = timestamp
    alert_data["updated_at"] = timestamp
    
    # Create alert document
    alert_ref = alerts_collection.document()
    alert_ref.set(alert_data)
    
    # Return complete alert
    alert = Alert(
        id=alert_ref.id,
        **alert_data
    )
    
    return alert

async def get_user_alerts(user_id: str) -> List[Alert]:
    """Get all alerts for a specific user"""
    alerts = alerts_collection.where(
        "user_id", "==", user_id
    ).get()
    
    result = []
    for alert_doc in alerts:
        alert_data = alert_doc.to_dict()
        alert_data["id"] = alert_doc.id
        result.append(Alert(**alert_data))
    
    return result

async def get_alert(alert_id: str) -> Optional[Alert]:
    """Get a specific alert by ID"""
    alert_doc = alerts_collection.document(alert_id).get()
    
    if not alert_doc.exists:
        return None
    
    alert_data = alert_doc.to_dict()
    alert_data["id"] = alert_doc.id
    
    return Alert(**alert_data)

async def update_alert(alert_id: str, alert_in: AlertUpdate) -> Optional[Alert]:
    """Update an existing alert"""
    alert = await get_alert(alert_id)
    
    if not alert:
        return None
    
    update_data = alert_in.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    # Update the alert
    alerts_collection.document(alert_id).update(update_data)
    
    # Return updated alert
    updated_alert = await get_alert(alert_id)
    return updated_alert

async def delete_alert(alert_id: str) -> bool:
    """Delete an alert"""
    alert = await get_alert(alert_id)
    
    if not alert:
        return False
    
    # Delete the alert
    alerts_collection.document(alert_id).delete()
    
    return True

async def check_alerts(user_id: str, current_rates: dict) -> List[dict]:
    """Check all alerts for a user against current exchange rates"""
    alerts = await get_user_alerts(user_id)
    triggered_alerts = []
    
    for alert in alerts:
        currency_code = alert.currency_code
        
        if currency_code not in current_rates:
            continue
        
        current_rate = current_rates[currency_code]
        
        # Check buy alert (when rate falls below threshold)
        if alert.buy_threshold and current_rate <= alert.buy_threshold:
            triggered_alerts.append({
                "id": alert.id,
                "type": "buy",
                "currency_code": currency_code,
                "threshold": alert.buy_threshold,
                "current_rate": current_rate,
                "message": f"Favorable rate to buy {currency_code}: Current rate ₦{current_rate:.2f} is below your threshold of ₦{alert.buy_threshold:.2f}"
            })
        
        # Check sell alert (when rate rises above threshold)
        if alert.sell_threshold and current_rate >= alert.sell_threshold:
            triggered_alerts.append({
                "id": alert.id,
                "type": "sell",
                "currency_code": currency_code,
                "threshold": alert.sell_threshold,
                "current_rate": current_rate,
                "message": f"Favorable rate to sell {currency_code}: Current rate ₦{current_rate:.2f} is above your threshold of ₦{alert.sell_threshold:.2f}"
            })
    
    return triggered_alerts