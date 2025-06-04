# main.py
import os
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from uuid import uuid4
import shutil
from datetime import datetime, timezone

# Already‐correct absolute imports:
from db_service import get_db, engine
from models import create_user_profile_table, create_file_object_table

app = FastAPI(title="Dronewerx Backend")


# Create the table on startup (raw SQL inside models.py)
@app.on_event("startup")
def on_startup():
    create_user_profile_table()
    create_file_object_table()


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
    rows = db.execute(
        text("SELECT user_id, user_name, created_at FROM user_profile;")
    ).fetchall()

    return [
        {"user_id": r[0], "user_name": r[1], "created_at": r[2].isoformat()}
        for r in rows
    ]


@app.get("/files")
def list_files(db: Session = Depends(get_db)):
    """
    Returns all rows from 'file_object' (id, original_name, content_type, size_bytes,
    storage_path, uploaded_at, uploaded_by). Uses raw SQL via text(...).
    """
    try:
        rows = db.execute(
            text(
                """
                SELECT
                    id,
                    original_name,
                    content_type,
                    size_bytes,
                    storage_path,
                    uploaded_at,
                    uploaded_by
                FROM file_object
                ORDER BY uploaded_at DESC;
            """
            )
        ).fetchall()
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Query error: {e!r}")

    return [
        {
            "id": r[0],
            "original_name": r[1],
            "content_type": r[2],
            "size_bytes": r[3],
            "storage_path": r[4],
            "uploaded_at": r[5].isoformat(),
            "uploaded_by": str(r[6]) if r[6] is not None else None,
        }
        for r in rows
    ]


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Handles file uploads:
    1. Saves file to uploads directory
    2. Stores metadata in database with UUID primary key
    """
    try:
        # 1) Generate a new UUID
        file_id = str(uuid4())
        ext = os.path.splitext(file.filename)[1]  # e.g. ".pdf"

        # 2) Build a date‐based subfolder, e.g. "2025/06/04"
        now = datetime.now(timezone.utc)
        year = now.year
        month = f"{now.month:02d}"
        day = f"{now.day:02d}"
        subfolder = os.path.join("uploads", str(year), month, day)

        # 3) Ensure that subfolder exists (mkdir -p)
        os.makedirs(subfolder, exist_ok=True)

        # 4) Construct the final storage path, e.g. "uploads/2025/06/04/550e8400-....pdf"
        storage_filename = f"{file_id}{ext}"
        storage_path = os.path.join(subfolder, storage_filename)

        # 5) Write the file to disk
        try:
            with open(storage_path, "wb") as buffer:
                contents = await file.read()  # read the upload into memory
                buffer.write(contents)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not save file: {e}")

        # Get file size after writing
        file_size = os.path.getsize(storage_path)

        # Insert metadata into database using the schema
        query = text(
            """
            INSERT INTO file_object 
                (id, original_name, content_type, size_bytes, storage_path, uploaded_at)
            VALUES 
                (:id, :original_name, :content_type, :size_bytes, :storage_path, :uploaded_at)
            RETURNING id, original_name, content_type, size_bytes, storage_path, uploaded_at
        """
        )

        result = db.execute(
            query,
            {
                "id": file_id,  # UUID string
                "original_name": file.filename,
                "content_type": file.content_type,
                "size_bytes": file_size,
                "storage_path": storage_path,
                "uploaded_at": datetime.now(
                    timezone.utc
                ),  # Use timezone-aware timestamp
            },
        )
        db.commit()

        # Get the inserted row
        row = result.fetchone()

        return {
            "id": str(row.id),  # Convert UUID to string for JSON response
            "original_name": row.original_name,
            "content_type": row.content_type,
            "size_bytes": row.size_bytes,
            "storage_path": row.storage_path,
            "uploaded_at": row.uploaded_at.isoformat(),
        }

    except SQLAlchemyError as e:
        # Clean up the file if database insert fails
        if os.path.exists(storage_path):
            os.remove(storage_path)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        # Clean up the file if any other error occurs
        if os.path.exists(storage_path):
            os.remove(storage_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    finally:
        await file.close()  # Always close the uploaded file
