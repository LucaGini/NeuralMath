import sys
from sqlalchemy import text
from app.core.database import engine

def run_migrations():
    print("Starting cumulative database migrations...")
    migrations = [
        # Sprint 1
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS exercise_type VARCHAR DEFAULT 'free_text' NOT NULL;",
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS choices JSON;",
        
        # Sprint 2
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS error_type VARCHAR;",
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS misconception TEXT;",
        
        # Sprint 3
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS hint_level_used INTEGER DEFAULT 0 NOT NULL;",
        
        # Sprint 4
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS skill_tags JSON;",
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS time_to_answer_ms INTEGER;",
        
        # Sprint 6
        "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR DEFAULT 'practice' NOT NULL;",

        # Phase 2 RPG Themes & Teach-Back
        "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS theme VARCHAR DEFAULT 'standard' NOT NULL;",
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS protege_answer VARCHAR;",
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS protege_explanation TEXT;",
        "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS student_review TEXT;"
    ]
    
    with engine.begin() as conn:
        for migration in migrations:
            try:
                print(f"Executing: {migration}")
                conn.execute(text(migration))
            except Exception as e:
                print(f"Error executing migration: {e}")
                sys.exit(1)
    
    print("Database migrations applied successfully!")

if __name__ == "__main__":
    run_migrations()
