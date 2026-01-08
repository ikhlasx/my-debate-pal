# Debate Tracker Backend API

FastAPI backend with SQLite database for the Debate Tracker application.

## Setup

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run the server:**
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### Sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions` - Get all sessions (with optional filters)
- `GET /api/sessions/{session_id}` - Get a specific session
- `PUT /api/sessions/{session_id}` - Update a session
- `DELETE /api/sessions/{session_id}` - Delete a session

### Notifications
- `POST /api/notifications` - Create a notification
- `GET /api/notifications` - Get all notifications

### Analytics
- `GET /api/analytics/weekly` - Get weekly statistics
- `GET /api/analytics/monthly?year={year}&month={month}` - Get monthly statistics
- `GET /api/analytics/stats` - Get general statistics
- `GET /api/analytics/daily/{date}` - Get daily breakdown
- `GET /api/analytics/heatmap` - Get heatmap data

### WebSocket
- `WS /ws` - WebSocket connection for real-time notifications

## Database

The database file `debate_tracker.db` will be created automatically in the backend directory.

## Environment Variables

- `DATABASE_URL` - Database connection string (default: `sqlite:///./debate_tracker.db`)

