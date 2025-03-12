import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings
import os

def initialize_firebase_app():
    """Initialize Firebase app with credentials"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
    except ValueError:
        # If running in production with environment variable
        if os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
            cred = credentials.ApplicationDefault()
        # If private key is provided in environment variables
        elif settings.FIREBASE_PRIVATE_KEY and settings.FIREBASE_CLIENT_EMAIL:
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "client_id": settings.FIREBASE_CLIENT_ID,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": settings.FIREBASE_CLIENT_CERT_URL
            })
        # Default to application config for development
        else:
            # For development or client-side only authentication
            firebase_config = {
                "apiKey": settings.FIREBASE_API_KEY,
                "authDomain": settings.FIREBASE_AUTH_DOMAIN,
                "projectId": settings.FIREBASE_PROJECT_ID,
                "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
                "messagingSenderId": settings.FIREBASE_MESSAGING_SENDER_ID,
                "appId": settings.FIREBASE_APP_ID,
            }
            
            if settings.FIREBASE_MEASUREMENT_ID:
                firebase_config["measurementId"] = settings.FIREBASE_MEASUREMENT_ID
                
            cred = credentials.Certificate(firebase_config)
        
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

# Initialize Firestore client
db = initialize_firebase_app()

# Collection references
users_collection = db.collection('users')
currencies_collection = db.collection('currencies')
exchange_rates_collection = db.collection('exchange_rates')
transactions_collection = db.collection('transactions')
wallets_collection = db.collection('wallets')
alerts_collection = db.collection('alerts')
audit_logs_collection = db.collection('audit_logs')