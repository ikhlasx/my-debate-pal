from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta
import json
import re

from database import SessionLocal, engine, Base
from models import DebateSession, Notification
from schemas import (
    SessionCreate, SessionResponse, SessionUpdate,
    NotificationCreate, NotificationResponse,
    WeeklyStats, MonthlyStats, AnalyticsStats
)
from analytics import calculate_analytics

# Create tables
Base.metadata.create_all(bind=engine)

# Run migration to add partner_id column if needed
try:
    from migrate_db import migrate_database
    migrate_database()
except Exception as e:
    print(f"Migration warning: {e}")

app = FastAPI(title="Debate Tracker API", version="1.0.0")

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

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back or handle client messages
            await websocket.send_json({"type": "pong", "data": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Health check
@app.get("/")
async def root():
    return {"message": "Debate Tracker API", "status": "running"}

# Session endpoints
@app.post("/api/sessions", response_model=SessionResponse)
async def create_session(
    session: SessionCreate,
    db: Session = Depends(get_db)
):
    db_session = DebateSession(
        partner_id=None,  # No authentication, single user
        partner=session.partner,
        start_time=session.start_time,
        end_time=session.end_time,
        duration=session.duration
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    # Broadcast notification to all connected clients
    await manager.broadcast({
        "type": "session_created",
        "data": {
            "id": db_session.id,
            "partner": db_session.partner,
            "action": "start" if not session.end_time else "end",
            "timestamp": datetime.utcnow().isoformat()
        }
    })
    
    return db_session

@app.get("/api/sessions", response_model=List[SessionResponse])
async def get_sessions(
    partner: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DebateSession)
    
    if partner:
        query = query.filter(DebateSession.partner == partner)
    
    if start_date:
        query = query.filter(DebateSession.start_time >= parse_iso_date(start_date))
    
    if end_date:
        query = query.filter(DebateSession.start_time <= parse_iso_date(end_date))
    
    sessions = query.order_by(DebateSession.start_time.desc()).all()
    return sessions

@app.get("/api/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = db.query(DebateSession).filter(
        DebateSession.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.put("/api/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: int,
    session_update: SessionUpdate,
    db: Session = Depends(get_db)
):
    db_session = db.query(DebateSession).filter(
        DebateSession.id == session_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session_update.end_time is not None:
        db_session.end_time = session_update.end_time
    if session_update.duration is not None:
        db_session.duration = session_update.duration
    
    db.commit()
    db.refresh(db_session)
    
    # Broadcast update
    await manager.broadcast({
        "type": "session_updated",
        "data": {
            "id": db_session.id,
            "partner": db_session.partner,
            "timestamp": datetime.utcnow().isoformat()
        }
    })
    
    return db_session

@app.delete("/api/sessions/{session_id}")
async def delete_session(
    session_id: int,
    db: Session = Depends(get_db)
):
    db_session = db.query(DebateSession).filter(
        DebateSession.id == session_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(db_session)
    db.commit()
    
    await manager.broadcast({
        "type": "session_deleted",
        "data": {"id": session_id}
    })
    
    return {"message": "Session deleted"}

# Notification endpoints
@app.post("/api/notifications", response_model=NotificationResponse)
async def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db)
):
    db_notification = Notification(
        partner_id=None,  # No authentication, single user
        type=notification.type,
        title=notification.title,
        message=notification.message,
        partner=notification.partner,
        data=notification.data
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    # Broadcast to all connected clients
    await manager.broadcast({
        "type": "notification",
        "data": {
            "id": db_notification.id,
            "type": db_notification.type,
            "title": db_notification.title,
            "message": db_notification.message,
            "partner": db_notification.partner,
            "timestamp": db_notification.created_at.isoformat()
        }
    })
    
    return db_notification

@app.get("/api/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    partner: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    
    if partner:
        query = query.filter(Notification.partner == partner)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    return notifications

# Analytics endpoints
@app.get("/api/analytics/weekly", response_model=WeeklyStats)
async def get_weekly_stats(
    week_start: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if week_start:
        start_date = parse_iso_date(week_start).date()
    else:
        # Default to current week (Monday)
        today = date.today()
        start_date = today - timedelta(days=today.weekday())
    
    end_date = start_date + timedelta(days=6)
    
    return calculate_analytics.get_weekly_stats(db, start_date, end_date, [])

@app.get("/api/analytics/monthly", response_model=MonthlyStats)
async def get_monthly_stats(
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    return calculate_analytics.get_monthly_stats(db, year, month, [])

@app.get("/api/analytics/stats", response_model=AnalyticsStats)
async def get_analytics_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    start = parse_iso_date(start_date).date() if start_date else None
    end = parse_iso_date(end_date).date() if end_date else None
    
    return calculate_analytics.get_general_stats(db, [], start, end)

@app.get("/api/analytics/daily/{date_str}")
async def get_daily_stats(
    date_str: str,
    db: Session = Depends(get_db)
):
    target_date = parse_iso_date(date_str).date()
    return calculate_analytics.get_daily_stats(db, target_date, [])

@app.get("/api/analytics/heatmap")
async def get_heatmap_data(
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db)
):
    start = parse_iso_date(start_date).date()
    end = parse_iso_date(end_date).date()
    return calculate_analytics.get_heatmap_data(db, start, end, [])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

