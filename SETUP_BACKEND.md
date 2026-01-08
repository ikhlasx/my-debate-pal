# Backend Setup Guide

This guide will help you set up the FastAPI backend for the Debate Tracker application.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. **Navigate to the backend directory:**
```bash
cd backend
```

2. **Create a virtual environment (recommended):**
```bash
python -m venv venv
```

3. **Activate the virtual environment:**
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

## Running the Backend

1. **Start the FastAPI server:**
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2. **The API will be available at:**
   - API: `http://localhost:8000`
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## Frontend Configuration

1. **Create a `.env` file in the root directory:**
```env
VITE_API_URL=http://localhost:8000
VITE_USE_BACKEND=true
```

2. **Start the frontend:**
```bash
npm run dev
```

## Database

The SQLite database (`debate_tracker.db`) will be created automatically in the `backend` directory when you first run the server.

## Features

- **REST API** for session and notification management
- **WebSocket** for real-time notifications
- **SQLite Database** for data persistence
- **Analytics Endpoints** for comprehensive statistics

## API Endpoints

### Sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/{id}` - Get a specific session
- `PUT /api/sessions/{id}` - Update a session
- `DELETE /api/sessions/{id}` - Delete a session

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
- `WS /ws` - WebSocket connection for real-time updates

## Troubleshooting

### Port Already in Use
If port 8000 is already in use, you can change it:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

Then update `VITE_API_URL` in your `.env` file accordingly.

### Database Issues
If you need to reset the database, simply delete `debate_tracker.db` and restart the server. A new database will be created automatically.

### CORS Issues
If you encounter CORS errors, make sure the frontend URL is added to the `allow_origins` list in `backend/main.py`.

