from sqlalchemy import text
from db_service import engine


def create_user_profile_table():

    create_table_sql = """
    CREATE TABLE user_profile (
    user_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    );
    """
    with engine.connect() as conn:
        conn.execute(text(create_table_sql))
        conn.commit()
