"""
Firebase database operations using a simple in-memory or SQLite database instead of Firestore.
"""
import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

# Determine if using in-memory database or SQLite file
DB_PATH = os.environ.get("SQLITE_DB_PATH", ":memory:")

# Initialize database connection
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
conn.row_factory = sqlite3.Row


def init_db():
    """Initialize database tables"""
    cursor = conn.cursor()

    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        is_superuser BOOLEAN NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        preferences TEXT
    )
    ''')

    # Create currencies table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS currencies (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        symbol TEXT,
        is_active BOOLEAN NOT NULL DEFAULT 1
    )
    ''')

    # Create exchange_rates table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS exchange_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        base_currency TEXT NOT NULL,
        target_currency TEXT NOT NULL,
        rate REAL NOT NULL,
        timestamp TEXT NOT NULL,
        UNIQUE(base_currency, target_currency, timestamp)
    )
    ''')

    # Create transactions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        description TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # Create wallets table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        currency TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        UNIQUE(user_id, currency),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # Create alerts table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        base_currency TEXT NOT NULL,
        target_currency TEXT NOT NULL,
        threshold REAL NOT NULL,
        condition TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # Create audit_logs table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        timestamp TEXT NOT NULL,
        details TEXT
    )
    ''')

    conn.commit()


# Initialize the database
init_db()


# User operations
def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()

    if not row:
        return None

    user_dict = dict(row)

    # Parse JSON fields
    if user_dict.get('preferences'):
        user_dict['preferences'] = json.loads(user_dict['preferences'])
    else:
        user_dict['preferences'] = {}

    return user_dict


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()

    if not row:
        return None

    user_dict = dict(row)

    # Parse JSON fields
    if user_dict.get('preferences'):
        user_dict['preferences'] = json.loads(user_dict['preferences'])
    else:
        user_dict['preferences'] = {}

    return user_dict


def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new user"""
    cursor = conn.cursor()

    # Prepare data for insertion
    now = datetime.now().isoformat()
    preferences_json = json.dumps(user_data.get('preferences', {}))

    cursor.execute(
        "INSERT INTO users (id, email, full_name, is_active, is_superuser, created_at, updated_at, preferences) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            user_data.get('id'),
            user_data.get('email'),
            user_data.get('full_name', ''),
            user_data.get('is_active', True),
            user_data.get('is_superuser', False),
            user_data.get('created_at', now),
            user_data.get('updated_at', now),
            preferences_json
        )
    )

    conn.commit()
    return get_user(user_data.get('id'))


def update_user(user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update user data"""
    # Get current user data
    user = get_user(user_id)
    if not user:
        return None

    # Update fields
    update_data['updated_at'] = datetime.now().isoformat()

    # Handle preferences separately
    if 'preferences' in update_data:
        update_data['preferences'] = json.dumps(update_data['preferences'])

    # Construct SQL update statement
    fields = []
    values = []

    for key, value in update_data.items():
        if key in user:
            fields.append(f"{key} = ?")
            values.append(value)

    if not fields:
        return user

    # Add user_id at the end for WHERE clause
    values.append(user_id)

    cursor = conn.cursor()
    cursor.execute(
        f"UPDATE users SET {', '.join(fields)} WHERE id = ?",
        tuple(values)
    )

    conn.commit()
    return get_user(user_id)


# Similar functions for other collections (currencies, exchange_rates, etc.)
# These functions would implement the same operations as Firestore but with SQLite

# For compatibility with your existing code, create collection-like objects
class SQLiteCollection:
    def __init__(self, table_name):
        self.table_name = table_name

    # Implement methods that mimic Firestore collections as needed


# Collection references that mimic Firestore collections
users_collection = SQLiteCollection('users')
currencies_collection = SQLiteCollection('currencies')
exchange_rates_collection = SQLiteCollection('exchange_rates')
transactions_collection = SQLiteCollection('transactions')
wallets_collection = SQLiteCollection('wallets')
alerts_collection = SQLiteCollection('alerts')
audit_logs_collection = SQLiteCollection('audit_logs')


def get_user(user_id: str):
    """Get user by ID from SQLite database"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()

    if not row:
        return None

    user_dict = dict(row)

    # Parse JSON fields
    if user_dict.get('preferences'):
        user_dict['preferences'] = json.loads(user_dict['preferences'])
    else:
        user_dict['preferences'] = {}

    return user_dict