"""
FastAPI Main Application - Supabase Version
Uses Supabase as the centralized database with a demo user
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any

from datetime import datetime, date, timedelta
import re
import os
from dotenv import load_dotenv

from supabase import create_client, Client

# Load environment variables from .env file (only for local dev, Vercel uses env vars)
# Don't fail if .env doesn't exist (it won't in production)
try:
    # Explicitly load from backend directory
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(env_path)
except Exception:
    pass  # .env file not required in production
    pass  # .env file not required in production

import sys
# Add current directory to sys.path to ensure local imports work
# regardless of how the script is run (e.g. uvicorn root vs python script)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from auth_deps import get_token_header

from schemas import (
    SessionCreate, SessionResponse, SessionUpdate,
    NotificationCreate, NotificationResponse,
    WeeklyStats, MonthlyStats, AnalyticsStats
)

# Import analytics (lazy - only used in endpoints)
try:
    from analytics_supabase import calculate_analytics
except ImportError as e:
    print(f"[WARNING] Failed to import analytics_supabase: {e}")
    # Create a dummy calculate_analytics to prevent crashes
    class calculate_analytics:
        @staticmethod
        def get_weekly_stats(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Analytics module not available")
        @staticmethod
        def get_monthly_stats(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Analytics module not available")
        @staticmethod
        def get_general_stats(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Analytics module not available")
        @staticmethod
        def get_daily_stats(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Analytics module not available")
        @staticmethod
        def get_heatmap_data(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Analytics module not available")

# Demo user ID - single user for the application
# Demo user ID - fallback (will be replaced by real auth)
DEMO_USER_ID = "demo-user-12345"

# Auth Dependency
async def verify_user(token: str = Depends(get_token_header)) -> str:
    """
    Verify the JWT token with Supabase and return the user ID.
    """
    try:
        # Get the Supabase client
        client = get_supabase()
        
        # Verify user
        user_response = client.auth.get_user(token)
        
        if not user_response or not user_response.user:
           raise HTTPException(status_code=401, detail="Invalid token")
           
        return user_response.user.id
        
    except Exception as e:
        # Fallback for demo/local dev without full auth flow if needed, 
        # BUT for "Real User" request, we should enforce auth.
        # For now, if verification fails, we raise 401.
        print(f"Auth verification failed: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


# Initialize Supabase client
def get_supabase_client() -> Client:
    """Get Supabase client"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set in Vercel.\n"
            "For Vercel: Go to Dashboard → Project → Settings → Environment Variables\n"
            "Get these from your Supabase project settings:\n"
            "1. Go to https://app.supabase.com\n"
            "2. Select your project\n"
            "3. Go to Settings > API\n"
            "4. Copy the URL and anon/public key\n"
            "5. Add them to Vercel Environment Variables"
        )
    
    # Check if placeholder values are still being used
    if supabase_url and ("your-project-id" in supabase_url or supabase_url == ""):
        raise ValueError(
            "SUPABASE_URL contains placeholder or is empty. Please set the actual Supabase project URL in Vercel Environment Variables."
        )
    
    if supabase_key and ("your-anon-key" in supabase_key or supabase_key == ""):
        raise ValueError(
            "SUPABASE_ANON_KEY contains placeholder or is empty. Please set the actual Supabase anon public key in Vercel Environment Variables."
        )
    
    try:
        client = create_client(supabase_url, supabase_key)
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
    
    # Ensure demo user exists (only if tables exist, don't crash if they don't)
    try:
        result = client.table("users").select("partner_id").eq("partner_id", DEMO_USER_ID).execute()
        if not result.data:
            try:
                client.table("users").insert({
                    "partner_id": DEMO_USER_ID,
                    "email": "demo@debatepal.com",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }).execute()
                print(f"[OK] Demo user created: {DEMO_USER_ID}")
            except Exception as insert_error:
                # Table might not exist yet - that's okay, user can run migration
                print(f"[INFO] Could not create demo user (tables may not exist yet): {insert_error}")
    except Exception as e:
        # Don't crash if we can't check/create user - tables might not exist
        print(f"[INFO] Note: {e}")
        print("[INFO] Make sure you've run the SQL migration in Supabase SQL Editor")
    
    return client

# Initialize Supabase (lazy initialization for Vercel)
supabase = None
supabase_error = None

def get_supabase():
    """Get or initialize Supabase client (lazy loading for Vercel)"""
    global supabase, supabase_error
    if supabase is not None:
        return supabase
    
    if supabase_error is not None:
        raise HTTPException(
            status_code=500,
            detail=f"Database configuration error: {supabase_error}. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables in Vercel Dashboard → Settings → Environment Variables."
        )
    
    # Try to initialize
    try:
        supabase = get_supabase_client()
        return supabase
    except ValueError as e:
        # Configuration error - environment variables missing or invalid
        supabase_error = str(e)
        raise HTTPException(
            status_code=500,
            detail=f"Database configuration error: {e}. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables in Vercel Dashboard → Settings → Environment Variables."
        )
    except Exception as e:
        # Other errors
        supabase_error = f"Failed to connect to Supabase: {str(e)}"
        print(f"[ERROR] Failed to initialize Supabase: {e}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Database connection error: {e}. Please verify your Supabase credentials are correct and tables exist. Check Vercel Function Logs for details."
        )

app = FastAPI(title="Debate Tracker API (Supabase)", version="2.0.0")

# CORS middleware
# CORS middleware
# Configure CORS to allow the Vercel frontend and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://my-debate-pal.vercel.app",
        "https://my-debate-pal.onrender.com",
        "https://my-debate-pal-production.up.railway.app",  # Railway deployment
    ],
    allow_origin_regex="https://.*\.(vercel\.app|railway\.app)", # Allow all Vercel and Railway subdomains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "service": "debate-pal-backend", 
        "time": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    """Dedicated health check for Railway and monitoring"""
    return {
        "status": "healthy",
        "service": "debate-pal-backend",
        "timestamp": datetime.now().isoformat()
    }

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# Helper function to parse ISO date strings with 'Z' timezone
def parse_iso_date(date_str: str) -> datetime:
    """Parse ISO date string, handling 'Z' timezone indicator"""
    if not date_str:
        raise ValueError("Date string cannot be empty")
    # Replace 'Z' with '+00:00' for Python's fromisoformat
    date_str = re.sub(r'Z$', '+00:00', date_str)
    return datetime.fromisoformat(date_str)

def parse_datetime(dt_str: str) -> datetime:
    """Parse datetime string from Supabase"""
    if isinstance(dt_str, datetime):
        return dt_str
    try:
        return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
    except:
        return datetime.fromisoformat(dt_str)

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "pong", "data": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Health check - should work even if Supabase isn't configured
# Vercel auto-detects api/index.py and STRIPS /api prefix before passing to Mangum
# So /api/ request → Mangum receives / → FastAPI route / matches
@app.get("/")
async def root():
    """Health check endpoint - doesn't require Supabase connection"""
    global supabase, supabase_error
    
    db_status = "not_initialized"
    db_error = None
    
    if supabase is not None:
        db_status = "connected"
    elif supabase_error is not None:
        db_status = "error"
        db_error = supabase_error
    else:
        # Try to initialize (but don't fail the endpoint if it fails)
        try:
            test_supabase = get_supabase()
            db_status = "connected"
        except HTTPException:
            # HTTPException means we should show the error
            raise
        except Exception as e:
            db_status = "error"
            db_error = str(e)
    
    response = {
        "message": "Debate Tracker API (Supabase)",
        "status": "running",
        "demo_user_id": DEMO_USER_ID,
        "database": {
            "status": db_status,
        },
        "routes": {
            "root": "/",
            "sessions": "/sessions",
            "notifications": "/notifications",
            "analytics": "/analytics/*"
        },
        "note": "Routes are defined without /api prefix because Vercel strips it"
    }
    
    if db_error:
        response["database"]["error"] = db_error
        response["database"]["help"] = "Check SUPABASE_URL and SUPABASE_ANON_KEY in Vercel Environment Variables (Dashboard → Settings → Environment Variables)"
    
    return response

# Session endpoints
# Vercel strips /api prefix, so /api/sessions → Mangum receives /sessions → route /sessions matches
@app.post("/sessions", response_model=SessionResponse)
async def create_session(session: SessionCreate, user_id: str = Depends(verify_user)):
    # Prepare data for Supabase
    session_data = {
        "partner_id": user_id,
        "partner": session.partner,
        "start_time": session.start_time.isoformat() if isinstance(session.start_time, datetime) else session.start_time,
        "end_time": session.end_time.isoformat() if session.end_time and isinstance(session.end_time, datetime) else session.end_time,
        "duration": session.duration
    }
    
    # Insert into Supabase
    result = get_supabase().table("debate_sessions").insert(session_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create session")
    
    db_session = result.data[0]
    
    # Broadcast notification
    await manager.broadcast({
        "type": "session_created",
        "data": {
            "id": db_session["id"],
            "partner": db_session["partner"],
            "action": "start" if not session.end_time else "end",
            "timestamp": datetime.utcnow().isoformat()
        }
    })
    
    # Convert to response format
    return SessionResponse(
        id=db_session["id"],
        partner=db_session["partner"],
        start_time=parse_datetime(db_session["start_time"]),
        end_time=parse_datetime(db_session["end_time"]) if db_session.get("end_time") else None,
        duration=db_session.get("duration"),
        created_at=parse_datetime(db_session["created_at"]),
        updated_at=parse_datetime(db_session["updated_at"])
    )

@app.get("/sessions", response_model=List[SessionResponse])
async def get_sessions(
    partner: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(verify_user)
):
    query = get_supabase().table("debate_sessions").select("*").eq("partner_id", user_id)
    
    if partner:
        query = query.eq("partner", partner)
    
    if start_date:
        start_dt = parse_iso_date(start_date)
        query = query.gte("start_time", start_dt.isoformat())
    
    if end_date:
        end_dt = parse_iso_date(end_date)
        query = query.lte("start_time", end_dt.isoformat())
    
    query = query.order("start_time", desc=True)
    result = query.execute()
    
    sessions = []
    for row in result.data:
        sessions.append(SessionResponse(
            id=row["id"],
            partner=row["partner"],
            start_time=parse_datetime(row["start_time"]),
            end_time=parse_datetime(row["end_time"]) if row.get("end_time") else None,
            duration=row.get("duration"),
            created_at=parse_datetime(row["created_at"]),
            updated_at=parse_datetime(row["updated_at"])
        ))
    
    return sessions

@app.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: int, user_id: str = Depends(verify_user)):
    result = get_supabase().table("debate_sessions").select("*").eq("id", session_id).eq("partner_id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    row = result.data[0]
    return SessionResponse(
        id=row["id"],
        partner=row["partner"],
        start_time=parse_datetime(row["start_time"]),
        end_time=parse_datetime(row["end_time"]) if row.get("end_time") else None,
        duration=row.get("duration"),
        created_at=parse_datetime(row["created_at"]),
        updated_at=parse_datetime(row["updated_at"])
    )

@app.put("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(session_id: int, session_update: SessionUpdate, user_id: str = Depends(verify_user)):
    # Check if session exists
    check = get_supabase().table("debate_sessions").select("id").eq("id", session_id).eq("partner_id", user_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Prepare update data
    update_data = {}
    if session_update.end_time is not None:
        update_data["end_time"] = session_update.end_time.isoformat() if isinstance(session_update.end_time, datetime) else session_update.end_time
    if session_update.duration is not None:
        update_data["duration"] = session_update.duration
    
    if not update_data:
        # Return existing session
        result = get_supabase().table("debate_sessions").select("*").eq("id", session_id).eq("partner_id", user_id).execute()
        row = result.data[0]
    else:
        result = get_supabase().table("debate_sessions").update(update_data).eq("id", session_id).eq("partner_id", user_id).execute()
        row = result.data[0]
    
    # Broadcast update
    await manager.broadcast({
        "type": "session_updated",
        "data": {
            "id": row["id"],
            "partner": row["partner"],
            "timestamp": datetime.utcnow().isoformat()
        }
    })
    
    return SessionResponse(
        id=row["id"],
        partner=row["partner"],
        start_time=parse_datetime(row["start_time"]),
        end_time=parse_datetime(row["end_time"]) if row.get("end_time") else None,
        duration=row.get("duration"),
        created_at=parse_datetime(row["created_at"]),
        updated_at=parse_datetime(row["updated_at"])
    )

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: int, user_id: str = Depends(verify_user)):
    # Check if session exists
    check = get_supabase().table("debate_sessions").select("id").eq("id", session_id).eq("partner_id", user_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    get_supabase().table("debate_sessions").delete().eq("id", session_id).eq("partner_id", user_id).execute()
    
    await manager.broadcast({
        "type": "session_deleted",
        "data": {"id": session_id}
    })
    
    return {"message": "Session deleted"}

# Notification endpoints
@app.post("/notifications", response_model=NotificationResponse)
async def create_notification(notification: NotificationCreate, user_id: str = Depends(verify_user)):
    notification_data = {
        "partner_id": user_id,
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "partner": notification.partner,
        "data": notification.data
    }
    
    result = get_supabase().table("notifications").insert(notification_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create notification")
    
    db_notification = result.data[0]
    
    # Broadcast to all connected clients
    await manager.broadcast({
        "type": "notification",
        "data": {
            "id": db_notification["id"],
            "type": db_notification["type"],
            "title": db_notification["title"],
            "message": db_notification["message"],
            "partner": db_notification.get("partner"),
            "timestamp": db_notification["created_at"]
        }
    })
    
    return NotificationResponse(
        id=db_notification["id"],
        type=db_notification["type"],
        title=db_notification["title"],
        message=db_notification["message"],
        partner=db_notification.get("partner"),
        data=db_notification.get("data"),
        created_at=parse_datetime(db_notification["created_at"]),
        read=db_notification.get("read", 0)
    )

@app.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    partner: Optional[str] = None,
    limit: int = 50,
    user_id: str = Depends(verify_user)
):
    query = get_supabase().table("notifications").select("*").eq("partner_id", user_id)
    
    if partner:
        query = query.eq("partner", partner)
    
    query = query.order("created_at", desc=True).limit(limit)
    result = query.execute()
    
    notifications = []
    for row in result.data:
        notifications.append(NotificationResponse(
            id=row["id"],
            type=row["type"],
            title=row["title"],
            message=row["message"],
            partner=row.get("partner"),
            data=row.get("data"),
            created_at=parse_datetime(row["created_at"]),
            read=row.get("read", 0)
        ))
    
    return notifications

# Analytics endpoints
@app.get("/analytics/weekly", response_model=WeeklyStats)
async def get_weekly_stats(week_start: Optional[str] = None, user_id: str = Depends(verify_user)):
    if week_start:
        start_date = parse_iso_date(week_start).date()
    else:
        today = date.today()
        start_date = today - timedelta(days=today.weekday())
    
    end_date = start_date + timedelta(days=6)
    
    return calculate_analytics.get_weekly_stats(get_supabase(), user_id, start_date, end_date)

@app.get("/analytics/monthly", response_model=MonthlyStats)
async def get_monthly_stats(year: int, month: int, user_id: str = Depends(verify_user)):
    return calculate_analytics.get_monthly_stats(get_supabase(), user_id, year, month)

@app.get("/analytics/stats", response_model=AnalyticsStats)
async def get_analytics_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(verify_user)
):
    start = parse_iso_date(start_date).date() if start_date else None
    end = parse_iso_date(end_date).date() if end_date else None
    
    return calculate_analytics.get_general_stats(get_supabase(), user_id, start, end)

@app.get("/analytics/daily/{date_str}")
async def get_daily_stats(date_str: str, user_id: str = Depends(verify_user)):
    target_date = parse_iso_date(date_str).date()
    return calculate_analytics.get_daily_stats(get_supabase(), user_id, target_date)

@app.get("/analytics/heatmap")
async def get_heatmap_data(start_date: str, end_date: str, user_id: str = Depends(verify_user)):
    start = parse_iso_date(start_date).date()
    end = parse_iso_date(end_date).date()
    return calculate_analytics.get_heatmap_data(get_supabase(), user_id, start, end)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
