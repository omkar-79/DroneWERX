from sqlalchemy import text
from db_service import engine


def create_user_profile_table():

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS user_profile (
    user_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    );
    """
    with engine.connect() as conn:
        conn.execute(text(create_table_sql))
        conn.commit()


def create_file_object_table():
    create_table_sql = """
    -- 1) Ensure the uuid-ossp extension is installed so uuid_generate_v4() exists
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- 2) Create the file_object table if it doesn’t already exist
    CREATE TABLE IF NOT EXISTS file_object (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        original_name TEXT       NOT NULL,
        content_type  TEXT       NOT NULL,
        size_bytes    BIGINT     NOT NULL,
        storage_path  TEXT       NOT NULL,
        uploaded_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        uploaded_by   UUID       NULL  -- foreign key to a users table if you have one
    );

    -- 3) Create an index on uploaded_at for faster “recent first” queries
    CREATE INDEX IF NOT EXISTS idx_file_uploaded_at 
        ON file_object (uploaded_at DESC);
    """
    with engine.connect() as conn:
        conn.execute(text(create_table_sql))
        conn.commit()
