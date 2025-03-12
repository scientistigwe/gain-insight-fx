"""
Notification service.
This module handles sending notifications to users.
"""
import logging
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Any, Optional
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db_session
from app.models.user import User
from app.db.firebase import db as firebase_db

logger = logging.getLogger(__name__)


async def get_user_email(db: AsyncSession, user_id: int) -> Optional[str]:
    """
    Get user's email address.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        User's email address or None if user not found
    """
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    
    if user and user.email:
        return user.email
    
    return None


async def send_email_notification(email: str, subject: str, html_content: str) -> bool:
    """
    Send an email notification.
    
    Args:
        email: Recipient email address
        subject: Email subject
        html_content: Email content in HTML format
        
    Returns:
        True if email was sent successfully, False otherwise
    """
    if not settings.SMTP_HOST or not settings.SMTP_PORT:
        logger.warning("SMTP settings not configured")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = settings.EMAILS_FROM_EMAIL
        message["To"] = email
        
        # Add HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            
            server.sendmail(settings.EMAILS_FROM_EMAIL, email, message.as_string())
        
        logger.info(f"Email notification sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Error sending email notification: {e}")
        return False


async def send_firebase_notification(user_id: int, notification_data: Dict[str, Any]) -> bool:
    """
    Send a notification through Firebase.
    
    Args:
        user_id: User ID
        notification_data: Notification data
        
    Returns:
        True if notification was sent successfully, False otherwise
    """
    try:
        # Add notification to Firebase
        notification_ref = firebase_db.collection('notifications').document()
        notification_ref.set({
            'user_id': user_id,
            'data': notification_data,
            'read': False,
            'created_at': datetime.utcnow()
        })
        
        logger.info(f"Firebase notification sent to user {user_id}")
        return True
    except Exception as e:
        logger.error(f"Error sending Firebase notification: {e}")
        return False


async def store_notification_in_db(
    db: AsyncSession, 
    user_id: int, 
    notification_type: str,
    notification_data: Dict[str, Any]
) -> bool:
    """
    Store a notification in the database.
    
    Args:
        db: Database session
        user_id: User ID
        notification_type: Type of notification
        notification_data: Notification data
        
    Returns:
        True if notification was stored successfully, False otherwise
    """
    try:
        # Create notification entry in database
        from app.models.notification import Notification
        
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            data=notification_data,
            is_read=False,
            created_at=datetime.utcnow()
        )
        
        db.add(notification)
        await db.commit()
        
        logger.info(f"Database notification stored for user {user_id}")
        return True
    except Exception as e:
        await db.rollback()
        logger.error(f"Error storing notification in database: {e}")
        return False


async def format_alert_email(notification_data: Dict[str, Any]) -> str:
    """
    Format an alert notification as HTML email.
    
    Args:
        notification_data: Alert notification data
        
    Returns:
        HTML formatted email content
    """
    currency_pair = notification_data.get("currency_pair", "")
    threshold = notification_data.get("threshold", 0)
    current_rate = notification_data.get("current_rate", 0)
    direction = notification_data.get("direction", "")
    
    # Format as percent difference
    percent_diff = abs(current_rate - threshold) / threshold * 100
    
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #007bff; margin-top: 0;">GainSight FX Alert</h2>
                <p>Your exchange rate alert has been triggered!</p>
                
                <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3 style="margin-top: 0;">Alert Details</h3>
                    <p><strong>Currency Pair:</strong> {currency_pair}</p>
                    <p><strong>Alert Condition:</strong> Rate goes {direction} {threshold}</p>
                    <p><strong>Current Rate:</strong> {current_rate:.4f}</p>
                    <p><strong>Difference:</strong> {percent_diff:.2f}%</p>
                </div>
                
                <p>This may be a good time to make a transaction!</p>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                    <p>This is an automated alert from GainSight FX. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
    </html>
    """


async def send_alert_notification(notification_data: Dict[str, Any]) -> bool:
    """
    Send an alert notification through all available channels.
    
    Args:
        notification_data: Alert notification data
        
    Returns:
        True if at least one notification method succeeded, False otherwise
    """
    user_id = notification_data.get("user_id")
    if user_id is None:
        logger.error("User ID missing from notification data")
        return False
    
    success = False
    
    # Get user's email
    async for db in get_db_session():
        try:
            # Store notification in database
            db_success = await store_notification_in_db(
                db=db,
                user_id=user_id,
                notification_type="alert",
                notification_data=notification_data
            )
            success = success or db_success
            
            # Send Firebase notification
            firebase_success = await send_firebase_notification(
                user_id=user_id,
                notification_data=notification_data
            )
            success = success or firebase_success
            
            # Send email notification if SMTP is configured
            if settings.SMTP_HOST and settings.SMTP_PORT:
                email = await get_user_email(db, user_id)
                if email:
                    # Format email content
                    html_content = await format_alert_email(notification_data)
                    
                    # Send email
                    currency_pair = notification_data.get("currency_pair", "")
                    email_success = await send_email_notification(
                        email=email,
                        subject=f"GainSight FX Alert: {currency_pair} Rate Alert Triggered",
                        html_content=html_content
                    )
                    success = success or email_success
        except Exception as e:
            logger.error(f"Error sending alert notification: {e}")
    
    return success