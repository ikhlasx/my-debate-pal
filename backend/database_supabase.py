"""
Supabase Database Adapter - Simplified version
Provides SQLAlchemy-like interface for Supabase
"""
from supabase import create_client, Client
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime
import os

# Demo user ID - single user for the application
DEMO_USER_ID = "demo-user-12345"

class SupabaseSession:
    """Session-like object that mimics SQLAlchemy Session"""
    
    def __init__(self, client: Client, demo_user_id: str):
        self.client = client
        self.demo_user_id = demo_user_id
        self._pending_inserts = []
        self._pending_updates = []
        self._pending_deletes = []
    
    def query(self, model_class):
        """Create a query for a model"""
        table_name = model_class.__tablename__
        return SupabaseQuery(self.client, table_name, self.demo_user_id, model_class)
    
    def add(self, instance):
        """Add an instance to be inserted"""
        self._pending_inserts.append(instance)
    
    def commit(self):
        """Commit pending changes"""
        # Insert pending records
        for instance in self._pending_inserts:
            table_name = instance.__class__.__tablename__
            data = self._instance_to_dict(instance)
            if "partner_id" not in data or data["partner_id"] is None:
                data["partner_id"] = self.demo_user_id
            self.client.table(table_name).insert(data).execute()
        
        # Update pending records
        for instance, updates in self._pending_updates:
            table_name = instance.__class__.__tablename__
            self.client.table(table_name).update(updates).eq("id", instance.id).eq("partner_id", self.demo_user_id).execute()
        
        # Delete pending records
        for instance in self._pending_deletes:
            table_name = instance.__class__.__tablename__
            self.client.table(table_name).delete().eq("id", instance.id).eq("partner_id", self.demo_user_id).execute()
        
        self._pending_inserts.clear()
        self._pending_updates.clear()
        self._pending_deletes.clear()
    
    def delete(self, instance):
        """Mark instance for deletion"""
        self._pending_deletes.append(instance)
    
    def refresh(self, instance):
        """Refresh instance from database"""
        table_name = instance.__class__.__tablename__
        result = self.client.table(table_name).select("*").eq("id", instance.id).eq("partner_id", self.demo_user_id).execute()
        if result.data:
            data = result.data[0]
            for key, value in data.items():
                setattr(instance, key, value)
    
    def _instance_to_dict(self, instance):
        """Convert model instance to dictionary"""
        data = {}
        for column in instance.__table__.columns:
            value = getattr(instance, column.name, None)
            if value is not None:
                if isinstance(value, datetime):
                    data[column.name] = value.isoformat()
                else:
                    data[column.name] = value
        return data


class SupabaseQuery:
    """Query builder that mimics SQLAlchemy Query"""
    
    def __init__(self, client: Client, table_name: str, demo_user_id: str, model_class):
        self.client = client
        self.table_name = table_name
        self.demo_user_id = demo_user_id
        self.model_class = model_class
        self._query = client.table(table_name).select("*")
        self._filters = []
        self._order_by = None
        self._limit_val = None
    
    def filter(self, *conditions):
        """Add filter conditions"""
        for condition in conditions:
            self._apply_filter(condition)
        return self
    
    def _apply_filter(self, condition):
        """Apply a single filter condition"""
        # Handle column comparisons
        if hasattr(condition, 'left') and hasattr(condition, 'right'):
            column = condition.left.key if hasattr(condition.left, 'key') else str(condition.left)
            value = condition.right.value if hasattr(condition.right, 'value') else condition.right
            
            # Handle isnot(None) - check for None comparison
            if value is None and ('isnot' in str(condition) or 'is_not' in str(condition)):
                self._query = self._query.not_.is_(column, 'null')
            elif value is None:
                self._query = self._query.is_(column, 'null')
            else:
                # Default to equality
                self._query = self._query.eq(column, value)
        
        # Always filter by demo user
        self._query = self._query.eq("partner_id", self.demo_user_id)
    
    def order_by(self, column, desc: bool = True):
        """Order results"""
        column_name = column.key if hasattr(column, 'key') else str(column)
        self._order_by = (column_name, desc)
        self._query = self._query.order(column_name, desc=desc)
        return self
    
    def limit(self, count: int):
        """Limit results"""
        self._limit_val = count
        self._query = self._query.limit(count)
        return self
    
    def all(self):
        """Execute and return all results"""
        result = self._query.execute()
        return [self._dict_to_instance(row) for row in result.data]
    
    def first(self):
        """Execute and return first result"""
        results = self.all()
        return results[0] if results else None
    
    def _dict_to_instance(self, data: Dict[str, Any]):
        """Convert dictionary to model instance"""
        instance = self.model_class()
        for key, value in data.items():
            # Convert ISO strings to datetime
            if isinstance(value, str) and ('time' in key.lower() or 'date' in key.lower() or 'created_at' in key or 'updated_at' in key):
                try:
                    value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass
            setattr(instance, key, value)
        return instance


# Global Supabase client
_supabase_client: Optional[Client] = None
_demo_user_id = DEMO_USER_ID

def get_supabase_client() -> Client:
    """Get or create Supabase client"""
    global _supabase_client
    if _supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set.\n"
                "Get these from your Supabase project settings:\n"
                "1. Go to https://app.supabase.com\n"
                "2. Select your project\n"
                "3. Go to Settings > API\n"
                "4. Copy the URL and anon/public key"
            )
        
        _supabase_client = create_client(supabase_url, supabase_key)
        
        # Ensure demo user exists
        ensure_demo_user(_supabase_client)
    
    return _supabase_client


def ensure_demo_user(client: Client):
    """Ensure demo user exists"""
    try:
        result = client.table("users").select("partner_id").eq("partner_id", _demo_user_id).execute()
        
        if not result.data:
            client.table("users").insert({
                "partner_id": _demo_user_id,
                "email": "demo@debatepal.com",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).execute()
            print(f"✅ Demo user created: {_demo_user_id}")
    except Exception as e:
        print(f"⚠️  Note: {e}")
        print("⚠️  Make sure you've run the SQL migration in Supabase SQL Editor")


def get_db():
    """Dependency function for FastAPI - returns a session-like object"""
    client = get_supabase_client()
    return SupabaseSession(client, _demo_user_id)
