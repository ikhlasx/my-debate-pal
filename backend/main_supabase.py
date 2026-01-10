"""
FastAPI Main Application - Supabase Version
Uses Supabase as the centralized database with a demo user
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime, date, timedelta
import re
import os
from dotenv import load_dotenv

from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()
from schemas import (
    SessionCreate, SessionResponse, SessionUpdate,
    NotificationCreate, NotificationResponse,
    WeeklyStats, MonthlyStats, AnalyticsStats
)
from analytics_supabase import calculate_analytics

# Demo user ID - single user for the application
DEMO_USER_ID = "demo-user-12345"

# Initialize Supabase client
def get_supabase_client() -> Client:
    """Get Supabase client"""
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
            "5. Update your backend/.env file with these values"
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
    
    # Ensure demo user exists
    try:
        result = client.table("users").select("partner_id").eq("partner_id", DEMO_USER_ID).execute()
        if not result.data:
            client.table("users").insert({
                "partner_id": DEMO_USER_ID,
                "email": "demo@debatepal.com",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).execute()
            print(f"[OK] Demo user created: {DEMO_USER_ID}")
    except Exception as e:
        print(f"[WARNING] Note: {e}")
        print("[WARNING] Make sure you've run the SQL migration in Supabase SQL Editor")
    
    return client

# Initialize Supabase (lazy initialization for Vercel)
supabase = None

def get_supabase():
    """Get or initialize Supabase client (lazy loading for Vercel)"""
    global supabase
    if supabase is None:
        supabase = get_supabase_client()
    return supabase

app = FastAPI(title="Debate Tracker API (Supabase)", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://192.168.56.1:8081",
        "http://192.168.1.28:8081",
        "http://172.29.128.1:8081",
        "https://*.vercel.app",  # Allow all Vercel deployments
        "https://*.vercel.sh",   # Allow Vercel preview deployments
        os.getenv("FRONTEND_URL", "*"),  # Allow custom frontend URL
        "*"  # Allow all for demo (production should restrict this)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

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

# Health check
@app.get("/")
async def root():
    return {
        "message": "Debate Tracker API (Supabase)",
        "status": "running",
        "demo_user_id": DEMO_USER_ID
    }

# Session endpoints
@app.post("/api/sessions", response_model=SessionResponse)
async def create_session(session: SessionCreate):
    # Prepare data for Supabase
    session_data = {
        "partner_id": DEMO_USER_ID,
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

@app.get("/api/sessions", response_model=List[SessionResponse])
async def get_sessions(
    partner: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = get_supabase().table("debate_sessions").select("*").eq("partner_id", DEMO_USER_ID)
    
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

@app.get("/api/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: int):
    result = get_supabase().table("debate_sessions").select("*").eq("id", session_id).eq("partner_id", DEMO_USER_ID).execute()
    
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

@app.put("/api/sessions/{session_id}", response_model=SessionResponse)
async def update_session(session_id: int, session_update: SessionUpdate):
    # Check if session exists
    check = get_supabase().table("debate_sessions").select("id").eq("id", session_id).eq("partner_id", DEMO_USER_ID).execute()
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
        result = get_supabase().table("debate_sessions").select("*").eq("id", session_id).eq("partner_id", DEMO_USER_ID).execute()
        row = result.data[0]
    else:
        result = get_supabase().table("debate_sessions").update(update_data).eq("id", session_id).eq("partner_id", DEMO_USER_ID).execute()
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

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: int):
    # Check if session exists
    check = get_supabase().table("debate_sessions").select("id").eq("id", session_id).eq("partner_id", DEMO_USER_ID).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    get_supabase().table("debate_sessions").delete().eq("id", session_id).eq("partner_id", DEMO_USER_ID).execute()
    
    await manager.broadcast({
        "type": "session_deleted",
        "data": {"id": session_id}
    })
    
    return {"message": "Session deleted"}

# Notification endpoints
@app.post("/api/notifications", response_model=NotificationResponse)
async def create_notification(notification: NotificationCreate):
    notification_data = {
        "partner_id": DEMO_USER_ID,
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

@app.get("/api/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    partner: Optional[str] = None,
    limit: int = 50
):
    query = get_supabase().table("notifications").select("*").eq("partner_id", DEMO_USER_ID)
    
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
@app.get("/api/analytics/weekly", response_model=WeeklyStats)
async def get_weekly_stats(week_start: Optional[str] = None):
    if week_start:
        start_date = parse_iso_date(week_start).date()
    else:
        today = date.today()
        start_date = today - timedelta(days=today.weekday())
    
    end_date = start_date + timedelta(days=6)
    
    return calculate_analytics.get_weekly_stats(get_supabase(), DEMO_USER_ID, start_date, end_date)

@app.get("/api/analytics/monthly", response_model=MonthlyStats)
async def get_monthly_stats(year: int, month: int):
    return calculate_analytics.get_monthly_stats(get_supabase(), DEMO_USER_ID, year, month)

@app.get("/api/analytics/stats", response_model=AnalyticsStats)
async def get_analytics_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    start = parse_iso_date(start_date).date() if start_date else None
    end = parse_iso_date(end_date).date() if end_date else None
    
    return calculate_analytics.get_general_stats(get_supabase(), DEMO_USER_ID, start, end)

@app.get("/api/analytics/daily/{date_str}")
async def get_daily_stats(date_str: str):
    target_date = parse_iso_date(date_str).date()
    return calculate_analytics.get_daily_stats(get_supabase(), DEMO_USER_ID, target_date)

@app.get("/api/analytics/heatmap")
async def get_heatmap_data(start_date: str, end_date: str):
    start = parse_iso_date(start_date).date()
    end = parse_iso_date(end_date).date()
    return calculate_analytics.get_heatmap_data(get_supabase(), DEMO_USER_ID, start, end)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
