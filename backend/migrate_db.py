"""
Database migration script to add partner_id column to debate_sessions table
"""
import sqlite3
import os

def migrate_database():
    db_path = "debate_tracker.db"
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found. Skipping migration.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if partner_id column exists
        cursor.execute("PRAGMA table_info(debate_sessions)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'partner_id' not in columns:
            print("Adding partner_id column to debate_sessions table...")
            cursor.execute("""
                ALTER TABLE debate_sessions 
                ADD COLUMN partner_id VARCHAR
            """)
            conn.commit()
            print("Migration completed successfully!")
        else:
            print("partner_id column already exists. No migration needed.")
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()

