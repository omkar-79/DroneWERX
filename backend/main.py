# main.py
import os
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

# Already‐correct absolute imports:
from db_service import get_db, engine
from models import create_user_profile_table

app = FastAPI(title="Dronewerx Backend")

# Create the table on startup (raw SQL inside models.py)
create_user_profile_table()


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Wrap the raw string in text(...)
        db.execute(text("SELECT 1"))
        return {"status": "ok", "detail": "Database connected"}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=503, detail=f"DB error: {e!r}")


@app.get("/profiles")
def list_profiles(db: Session = Depends(get_db)):
    """
    Returns all rows from 'user_profile' (user_id, user_name, created_at).
    """
    # Wrap the SELECT in text(...) as well:
    rows = db.execute(
        text("SELECT user_id, user_name, created_at FROM user_profile;")
    ).fetchall()

    return [
        {"user_id": r[0], "user_name": r[1], "created_at": r[2].isoformat()}
        for r in rows
    ]
