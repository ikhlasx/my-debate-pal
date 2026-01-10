"""
Supabase Database Adapter
Replaces SQLAlchemy with Supabase for centralized database storage
"""
from supabase import create_client, Client
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import os
from functools import wraps
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Demo user ID - single user for the application
DEMO_USER_ID = "demo-user-12345"

class SupabaseDB:
    """Database adapter that mimics SQLAlchemy session interface"""
    
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set.\n"
                "Get these from your Supabase project settings:\n"
                "1. Go to https://app.supabase.com\n"
                "2. Select your project\n"
                "3. Go to Settings > API\n"
                "4. Copy the URL and anon/public key\n"
                "5. Update your .env file with these values"
            )
        
        # Check if placeholder values are still being used
        if "your-project-id" in supabase_url or "your-anon-key" in supabase_key:
            raise ValueError(
                "⚠️  Please update your .env file with actual Supabase credentials!\n\n"
                "Your .env file still contains placeholder values.\n"
                "Get your credentials from:\n"
                "1. https://app.supabase.com\n"
                "2. Select your project\n"
                "3. Settings > API\n"
                "4. Copy the Project URL and anon public key\n"
                "5. Update backend/.env with these values"
            )
        
        try:
            self.client: Client = create_client(supabase_url, supabase_key)
        except Exception as e:
            error_msg = str(e)
            if "Invalid API key" in error_msg or "Invalid" in error_msg:
                raise ValueError(
                    f"❌ Invalid Supabase credentials: {error_msg}\n\n"
                    "Please verify:\n"
                    "1. SUPABASE_URL is correct (should be like: https://xxxxx.supabase.co)\n"
                    "2. SUPABASE_ANON_KEY is the 'anon public' key (not service_role)\n"
                    "3. Both values are in your backend/.env file\n"
                    "4. No extra spaces or quotes around the values"
                ) from e
            raise
        
        self.demo_user_id = DEMO_USER_ID
    
    def ensure_demo_user(self):
        """Ensure demo user exists in the database"""
        try:
            # Check if demo user exists
            result = self.client.table("users").select("partner_id").eq("partner_id", self.demo_user_id).execute()
            
            if not result.data:
                # Create demo user
                self.client.table("users").insert({
                    "partner_id": self.demo_user_id,
                    "email": "demo@debatepal.com",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }).execute()
                print(f"[OK] Demo user created: {self.demo_user_id}")
            else:
                print(f"[OK] Demo user already exists: {self.demo_user_id}")
        except Exception as e:
            print(f"[WARNING] Error ensuring demo user: {e}")
            # User might not exist yet, that's okay
    
    def query(self, table_name: str):
        """Create a query builder for a table"""
        return QueryBuilder(self.client, table_name, self.demo_user_id)
    
    def add(self, table_name: str, data: Dict[str, Any]):
        """Add a new record"""
        # Always add demo user ID to data
        if "partner_id" not in data or data["partner_id"] is None:
            data["partner_id"] = self.demo_user_id
        
        result = self.client.table(table_name).insert(data).execute()
        return result.data[0] if result.data else None
    
    def commit(self):
        """No-op for Supabase (auto-commits)"""
        pass
    
    def refresh(self, table_name: str, record_id: int):
        """Refresh a record from database"""
        result = self.client.table(table_name).select("*").eq("id", record_id).eq("partner_id", self.demo_user_id).execute()
        return result.data[0] if result.data else None
    
    def delete(self, table_name: str, record_id: int):
        """Delete a record"""
        self.client.table(table_name).delete().eq("id", record_id).eq("partner_id", self.demo_user_id).execute()
    
    def update(self, table_name: str, record_id: int, data: Dict[str, Any]):
        """Update a record"""
        result = self.client.table(table_name).update(data).eq("id", record_id).eq("partner_id", self.demo_user_id).execute()
        return result.data[0] if result.data else None


class QueryBuilder:
    """Query builder that mimics SQLAlchemy query interface"""
    
    def __init__(self, client: Client, table_name: str, demo_user_id: str):
        self.client = client
        self.table_name = table_name
        self.demo_user_id = demo_user_id
        self.query = client.table(table_name).select("*")
        self.filters = []
        self.order_by_field = None
        self.order_desc = True
        self.limit_count = None
    
    def filter(self, condition):
        """Add a filter condition"""
        # Parse SQLAlchemy-like conditions
        if hasattr(condition, 'left') and hasattr(condition, 'right'):
            # Handle column comparisons
            column = condition.left.key if hasattr(condition.left, 'key') else str(condition.left)
            value = condition.right.value if hasattr(condition.right, 'value') else condition.right
            
            if hasattr(condition, 'operator'):
                op = condition.operator.__name__ if hasattr(condition.operator, '__name__') else str(condition.operator)
                if op == 'eq' or op == '__eq__':
                    self.query = self.query.eq(column, value)
                elif op == 'ne' or op == '__ne__':
                    self.query = self.query.neq(column, value)
                elif op == 'ge' or op == '__ge__':
                    self.query = self.query.gte(column, value)
                elif op == 'le' or op == '__le__':
                    self.query = self.query.lte(column, value)
                elif op == 'gt' or op == '__gt__':
                    self.query = self.query.gt(column, value)
                elif op == 'lt' or op == '__lt__':
                    self.query = self.query.lt(column, value)
            else:
                self.query = self.query.eq(column, value)
        elif hasattr(condition, 'left') and hasattr(condition, 'right') and hasattr(condition, 'operator'):
            # Handle isnot(None) conditions
            if 'isnot' in str(condition) or 'is_not' in str(condition):
                column = condition.left.key if hasattr(condition.left, 'key') else str(condition.left)
                self.query = self.query.not_.is_(column, 'null')
        else:
            # Direct column comparison
            if 'partner_id' in str(condition):
                # Always filter by demo user
                pass  # Already handled
            elif 'partner' in str(condition):
                # Extract partner value if present
                pass
        
        return self
    
    def eq(self, column: str, value: Any):
        """Add equality filter"""
        self.query = self.query.eq(column, value)
        return self
    
    def filter_by_partner_id(self, partner_ids: List[str]):
        """Filter by partner IDs (always uses demo user)"""
        self.query = self.query.eq("partner_id", self.demo_user_id)
        return self
    
    def order_by(self, column, desc: bool = True):
        """Order results"""
        self.order_by_field = column.key if hasattr(column, 'key') else str(column)
        self.order_desc = desc
        if desc:
            self.query = self.query.order(column.key if hasattr(column, 'key') else str(column), desc=True)
        else:
            self.query = self.query.order(column.key if hasattr(column, 'key') else str(column), desc=False)
        return self
    
    def limit(self, count: int):
        """Limit results"""
        self.limit_count = count
        self.query = self.query.limit(count)
        return self
    
    def all(self):
        """Execute query and return all results"""
        # Always filter by demo user
        result = self.query.eq("partner_id", self.demo_user_id).execute()
        return [RecordWrapper(row, self.table_name) for row in result.data]
    
    def first(self):
        """Execute query and return first result"""
        results = self.all()
        return results[0] if results else None


class RecordWrapper:
    """Wraps a database record to mimic SQLAlchemy model behavior"""
    
    def __init__(self, data: Dict[str, Any], table_name: str):
        self._data = data
        self._table_name = table_name
        # Make all keys accessible as attributes
        for key, value in data.items():
            setattr(self, key, value)
    
    def __getattr__(self, name):
        """Fallback for missing attributes"""
        return self._data.get(name)
    
    def __repr__(self):
        return f"<{self._table_name} {self._data}>"


# Global Supabase instance
_db_instance: Optional[SupabaseDB] = None

def get_supabase_db() -> SupabaseDB:
    """Get or create Supabase database instance"""
    global _db_instance
    if _db_instance is None:
        _db_instance = SupabaseDB()
        _db_instance.ensure_demo_user()
    return _db_instance
