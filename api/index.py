"""
Vercel Serverless Function for FastAPI
Handles all /api/* routes through Vercel's serverless functions
"""
import sys
import os

# Add backend directory to path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Load environment variables (Vercel provides these as env vars)
# No need for .env file in production

# Import Mangum first (required for Vercel)
from mangum import Mangum

# Import the FastAPI app (after path setup)
from main_supabase import app

# Create Mangum adapter for Vercel/API Gateway
# lifespan="off" because Vercel serverless doesn't support lifespan events
handler = Mangum(app, lifespan="off")

# Vercel expects a 'handler' export
__all__ = ["handler"]
