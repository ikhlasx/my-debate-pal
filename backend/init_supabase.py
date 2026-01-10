"""
Initialize Supabase Database
Creates demo user and ensures database is set up correctly
"""
import os
from dotenv import load_dotenv
from supabase_db import get_supabase_db, DEMO_USER_ID
from datetime import datetime, timedelta
import random

# Load environment variables from .env file
load_dotenv()

def init_demo_data():
    """Initialize demo user and optionally add sample data"""
    db = get_supabase_db()
    
    print("[INFO] Initializing Supabase database...")
    print(f"[INFO] Demo User ID: {DEMO_USER_ID}")
    
    # Ensure demo user exists
    db.ensure_demo_user()
    
    # Optionally add some sample data for demonstration
    add_sample_data = os.getenv("ADD_SAMPLE_DATA", "false").lower() == "true"
    
    if add_sample_data:
        print("[INFO] Adding sample data...")
        add_demo_sessions(db)
        print("[OK] Sample data added!")
    else:
        print("[INFO] Skipping sample data. Set ADD_SAMPLE_DATA=true to add sample data.")
    
    print("[OK] Database initialization complete!")


def add_demo_sessions(db):
    """Add some sample debate sessions for demonstration"""
    try:
        # Get existing sessions count
        existing = db.client.table("debate_sessions").select("id", count="exact").eq("partner_id", DEMO_USER_ID).execute()
        
        if existing.count and existing.count > 0:
            print(f"[INFO] Found {existing.count} existing sessions. Skipping sample data.")
            return
        
        # Generate sample sessions for the last 30 days
        base_date = datetime.utcnow() - timedelta(days=30)
        sessions = []
        
        for day in range(30):
            current_date = base_date + timedelta(days=day)
            
            # Randomly decide if there are sessions on this day
            if random.random() > 0.3:  # 70% chance of having sessions
                # Husband session
                if random.random() > 0.4:  # 60% chance
                    start_h = current_date.replace(hour=random.randint(9, 20), minute=random.randint(0, 59))
                    duration_h = random.randint(300, 3600)  # 5 min to 1 hour
                    end_h = start_h + timedelta(seconds=duration_h)
                    
                    sessions.append({
                        "partner_id": DEMO_USER_ID,
                        "partner": "husband",
                        "start_time": start_h.isoformat(),
                        "end_time": end_h.isoformat(),
                        "duration": duration_h
                    })
                
                # Wife session
                if random.random() > 0.4:  # 60% chance
                    start_w = current_date.replace(hour=random.randint(9, 20), minute=random.randint(0, 59))
                    duration_w = random.randint(300, 3600)
                    end_w = start_w + timedelta(seconds=duration_w)
                    
                    sessions.append({
                        "partner_id": DEMO_USER_ID,
                        "partner": "wife",
                        "start_time": start_w.isoformat(),
                        "end_time": end_w.isoformat(),
                        "duration": duration_w
                    })
        
        # Insert sessions in batches
        batch_size = 50
        for i in range(0, len(sessions), batch_size):
            batch = sessions[i:i + batch_size]
            db.client.table("debate_sessions").insert(batch).execute()
        
        print(f"[OK] Added {len(sessions)} sample sessions")
        
    except Exception as e:
        print(f"[ERROR] Error adding sample data: {e}")


if __name__ == "__main__":
    init_demo_data()
