"""
Vercel Serverless Function for FastAPI
Handles all /api/* routes through Vercel's serverless functions
"""
import sys
import os
import traceback

# Add backend directory to path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Load environment variables (Vercel provides these as env vars)
# No need for .env file in production

# Import Mangum first (required for Vercel)
try:
    from mangum import Mangum
except ImportError as e:
    print(f"[CRITICAL] Mangum not installed: {e}")
    print("[CRITICAL] Make sure 'mangum>=0.17.0' is in api/requirements.txt")
    raise

# Import the FastAPI app (after path setup)
# This should work even if Supabase isn't configured - errors will show in endpoints
try:
    from main_supabase import app
    print("[OK] FastAPI app imported successfully")
except Exception as import_error:
    # If import fails, create error app
    print(f"[ERROR] Failed to import main_supabase: {import_error}")
    print(f"[ERROR] Traceback: {traceback.format_exc()}")
    
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    
    error_app = FastAPI(title="Debate Tracker API - Error")
    
    # Add CORS - allow Vercel frontend
    error_app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://my-debate-pal.vercel.app",
            "https://*.vercel.app",
            "https://*.vercel.sh",
            "http://localhost:5173",
            "http://localhost:8080",
            "http://localhost:8081",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    error_message = str(import_error)
    error_traceback = traceback.format_exc()
    
    @error_app.get("/")
    @error_app.get("/{path:path}")
    @error_app.post("/{path:path}")
    @error_app.put("/{path:path}")
    @error_app.delete("/{path:path}")
    async def error_handler(request: Request, path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Serverless function initialization failed",
                "message": error_message,
                "path": f"/api/{path}" if path else "/",
                "help": "Check Vercel Function Logs. Common issues:\n" +
                       "1. Missing SUPABASE_URL or SUPABASE_ANON_KEY in Vercel Environment Variables\n" +
                       "2. Missing dependencies in api/requirements.txt\n" +
                       "3. Import errors - check Vercel build logs",
                "traceback": error_traceback
            }
        )
    
    app = error_app

# Set up explicit mounting for Vercel
# This is the robust way to handle the /api prefix
# The request comes in as /api/sessions
# We mount the backend app at /api, so it handles the remainder (/sessions)
try:
    if app != error_app:
        # Create a wrapper app
        root_app = FastAPI()
        
        # Mount the backend app under /api
        root_app.mount("/api", app)
        
        # Use the wrapper app for Mangum
        handler = Mangum(root_app, lifespan="off")
    else:
        # If import failed, just use the error app directly (it accepts all paths)
        handler = Mangum(app, lifespan="off")
        
    print("[OK] Mangum handler created successfully with /api mount")
except Exception as e:
    print("[OK] Mangum handler created successfully")
except Exception as e:
    print(f"[CRITICAL] Failed to create Mangum handler: {e}")
    raise

# Vercel expects a 'handler' export
__all__ = ["handler"]
