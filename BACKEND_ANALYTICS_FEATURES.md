# Backend & Analytics Features

## Overview

This document describes the new backend database system and comprehensive analytics dashboard that have been added to the Debate Tracker application.

## 🗄️ Backend Database System

### Architecture
- **FastAPI** - Modern Python web framework
- **SQLite** - Lightweight database for data persistence
- **WebSocket** - Real-time notifications to all connected clients
- **REST API** - Full CRUD operations for sessions and notifications

### Key Features

1. **Central Database**
   - All debate sessions are stored in a central SQLite database
   - Notifications are stored and can be retrieved
   - Data persists across sessions and devices

2. **Real-time Synchronization**
   - WebSocket server broadcasts session updates to all connected clients
   - When one person starts/ends a debate, both see the notification
   - Automatic synchronization when multiple devices are connected

3. **API Endpoints**
   - Session management (create, read, update, delete)
   - Notification management
   - Comprehensive analytics endpoints

## 📊 Analytics Dashboard

### Location
Access the Analytics Dashboard by clicking the chart icon (📊) in the header, or navigate to `/analytics`.

### Features

#### 1. Weekly View
- **Bar Chart Comparison**: Visual comparison of Husband vs Wife debate time
- **Session Counts**: Total sessions per person
- **Overlap Tracking**: Time when both were debating simultaneously
- **Average Duration**: Per-person average debate duration
- **Peak Day**: Day with most debate activity
- **7-Day Heat Map**: Visual representation of debate intensity over the week

#### 2. Monthly View
- **Monthly Comparison Charts**: Side-by-side statistics
- **Trend Analysis**: Daily trend line over the month
- **Calendar Heat Map**: Visual calendar with color-coded activity levels
- **Simultaneous Debate Statistics**: How often both participate together
- **Winner Determination**:
  - Based on least total debate time initiated
  - Based on fewest sessions started
  - Visual crown/badge for monthly winner
- **Peacekeeping Champion**: Most time NOT debating when partner was active

#### 3. Calendar Analytics Tab
- **Interactive Monthly Calendar**: Click any day for detailed breakdown
- **Daily Summaries**: Complete breakdown of each day's activity
- **Color-coded Activity Levels**: Visual intensity indicators
- **Mini Timeline View**: See all sessions for a selected day
- **Export Ready**: Data structure supports future export functionality

#### 4. Statistics Panel
- **Total Debates**: Individual + simultaneous counts
- **Longest Debate Session**: Per person and simultaneous
- **Most/Least Active Days**: Calendar-linked dates
- **Debate Frequency Patterns**: By day of week
- **Overlap Percentage**: How much time both were active together
- **Peaceful Days Count**: Days with zero debates
- **Streak Tracking**: 
  - Current consecutive days with debates
  - Longest streak record

## 🚀 Setup Instructions

### Backend Setup

1. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Start the backend server:**
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Create `.env` file in root directory:**
```env
VITE_API_URL=http://localhost:8000
VITE_USE_BACKEND=true
```

2. **Start the frontend:**
```bash
npm run dev
```

### Using Without Backend

If you want to use the app without the backend (localStorage only), set:
```env
VITE_USE_BACKEND=false
```

The app will automatically fall back to localStorage for data storage.

## 📡 Real-time Notifications

### How It Works

1. **Session Created**: When a debate session starts or ends, it's saved to the database
2. **Notification Sent**: A notification is created in the database
3. **WebSocket Broadcast**: All connected clients receive the notification in real-time
4. **Frontend Display**: Each client shows the notification using their local notification system

### Notification Types

- `debate_start` - When a partner starts a debate
- `debate_end` - When a partner ends a debate
- `both_active` - When both partners are debating simultaneously
- `milestone` - Time milestone reached (5, 15, 30 minutes)

## 🔧 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 📱 Multi-Device Support

The backend enables multi-device synchronization:
- Start a debate on one device, see it on another
- Real-time updates across all connected devices
- Centralized data storage

## 🎯 Analytics Use Cases

### Weekly Review
- Compare debate patterns between partners
- Identify peak debate times
- Track overlap periods

### Monthly Analysis
- Determine monthly "winner" (least debates)
- Track peacekeeping efforts
- Analyze trends over time

### Daily Insights
- Click any day to see detailed breakdown
- View session timeline
- Understand daily patterns

### Long-term Statistics
- Track streaks
- Identify peaceful periods
- Analyze frequency patterns

## 🔒 Data Privacy

- All data stored locally (SQLite database on your server)
- No external services or cloud storage
- Full control over your data
- Can be exported or backed up as needed

## 🛠️ Customization

### Backend Configuration
- Database location: `backend/debate_tracker.db`
- Port: Default 8000 (configurable)
- CORS: Configured for localhost development

### Frontend Configuration
- API URL: Set via `VITE_API_URL` environment variable
- Backend toggle: Set via `VITE_USE_BACKEND` environment variable

## 📝 Notes

- The backend is optional - the app works with localStorage only
- WebSocket connections automatically reconnect if disconnected
- Database is created automatically on first run
- All analytics calculations are performed server-side for accuracy

