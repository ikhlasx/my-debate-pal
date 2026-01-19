from fastapi import Depends, HTTPException, status, Header
from typing import Optional
from supabase import Client

# We don't import get_supabase from main_supabase to avoid circular imports.
# Ideally, we should refactor get_supabase to a separate file (e.g., database.py),
# but for now we'll accept the client as an argument or re-instantiate if needed,
# OR simpler: main_supabase.py will pass the client to the dependency if we construct it carefully.
# ACTUALLY: Best pattern is to have a simple dependency that extracts the Token.
# Then the endpoint uses the global supabase client to verify.

async def get_token_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract token from Authorization header. Returns None if not provided (for demo mode)."""
    if not authorization:
        return None
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization Header Format. Use 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return authorization.split(" ")[1]

# Note: The actual verification logic will be inside main_supabase.py using the global `supabase` client
# to avoid circular dependency issues, OR we can define it here if we move `get_supabase` out.
# For minimal refactoring, we'll keep the logic in main_supabase.py but use this helper to get the token.
