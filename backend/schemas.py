from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime, date

# Session schemas
class SessionBase(BaseModel):
    partner: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[int] = None

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    end_time: Optional[datetime] = None
    duration: Optional[int] = None

class SessionResponse(SessionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Notification schemas
class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    partner: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    created_at: datetime
    read: int
    
    class Config:
        from_attributes = True

# Analytics schemas
class PartnerStats(BaseModel):
    total_sessions: int
    total_time: int  # in seconds
    average_duration: float  # in seconds
    longest_session: int  # in seconds
    shortest_session: int  # in seconds

class OverlapStats(BaseModel):
    total_overlap_time: int  # in seconds
    overlap_sessions: int
    average_overlap_duration: float  # in seconds
    longest_overlap: int  # in seconds

class WeeklyStats(BaseModel):
    week_start: date
    week_end: date
    husband: PartnerStats
    wife: PartnerStats
    overlap: OverlapStats
    peak_day: Optional[str] = None
    peak_time: Optional[str] = None
    heatmap_data: List[Dict[str, Any]]

class MonthlyStats(BaseModel):
    year: int
    month: int
    husband: PartnerStats
    wife: PartnerStats
    overlap: OverlapStats
    trend_data: List[Dict[str, Any]]
    winner: Optional[str] = None  # 'husband', 'wife', or None
    winner_reason: Optional[str] = None
    peacekeeping_winner: Optional[str] = None
    calendar_heatmap: List[Dict[str, Any]]

class DailyBreakdown(BaseModel):
    date: date
    husband_sessions: int
    wife_sessions: int
    husband_time: int
    wife_time: int
    overlap_time: int
    sessions: List[SessionResponse]

class AnalyticsStats(BaseModel):
    total_debates: int
    total_simultaneous: int
    longest_debate_husband: int
    longest_debate_wife: int
    longest_simultaneous: int
    most_active_day: Optional[date] = None
    least_active_day: Optional[date] = None
    debate_frequency_pattern: Dict[str, Any]
    overlap_percentage: float
    peaceful_days_count: int
    current_streak: int
    longest_streak: int

# Auth schemas
class UserRegister(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    partner_id: str
    password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    partner_id: str

class UserResponse(BaseModel):
    partner_id: str
    email: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class InviteCreate(BaseModel):
    pass

class InviteResponse(BaseModel):
    invite_code: str
    expires_at: Optional[datetime] = None

class LinkRequest(BaseModel):
    invite_code: str

class LinkResponse(BaseModel):
    message: str
    linked_partner_id: str

