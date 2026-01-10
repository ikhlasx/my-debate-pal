"""
Vercel Serverless Function for FastAPI
Handles all /api/* routes through Vercel's serverless functions
"""
from mangum import Mangum
import sys
import os

# Add backend directory to path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Load environment variables from .env if it exists (for local dev)
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
except ImportError:
    pass

# Import the FastAPI app
from main_supabase import app

# Create Mangum adapter for Vercel/API Gateway
handler = Mangum(app, lifespan="off")

# Export for Vercel
__all__ = ["handler"]
