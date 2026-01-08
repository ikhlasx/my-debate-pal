from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(String, unique=True, index=True, nullable=False)  # UUID as string
    email = Column(String, nullable=True, index=True)
    password_hash = Column(String, nullable=True)  # Optional for unique code login
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    sessions = relationship("DebateSession", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class PartnerLink(Base):
    __tablename__ = "partner_links"
    
    id = Column(Integer, primary_key=True, index=True)
    partner1_id = Column(String, ForeignKey("users.partner_id"), nullable=False, index=True)
    partner2_id = Column(String, ForeignKey("users.partner_id"), nullable=False, index=True)
    invite_code = Column(String, unique=True, index=True, nullable=False)
    linked_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    partner1 = relationship("User", foreign_keys=[partner1_id])
    partner2 = relationship("User", foreign_keys=[partner2_id])

class DebateSession(Base):
    __tablename__ = "debate_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(String, ForeignKey("users.partner_id"), nullable=True, index=True)
    partner = Column(String, nullable=False, index=True)  # 'husband' or 'wife'
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # in seconds
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="sessions")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(String, ForeignKey("users.partner_id"), nullable=True, index=True)
    type = Column(String, nullable=False)  # 'debate_start', 'debate_end', 'both_active', etc.
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    partner = Column(String, nullable=True)  # 'husband', 'wife', or None for both
    data = Column(JSON, nullable=True)  # Additional data as JSON
    created_at = Column(DateTime, server_default=func.now(), index=True)
    read = Column(Integer, default=0)  # 0 = unread, 1 = read
    
    # Relationships
    user = relationship("User", back_populates="notifications")

