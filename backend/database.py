import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = "sqlite:///./survey.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    with engine.connect() as conn:
        # Check if recording_url column exists in survey_responses
        result = conn.execute(text(
            "SELECT COUNT(*) FROM pragma_table_info('survey_responses') WHERE name='recording_url'"
        ))
        exists = result.scalar() > 0

        if exists:
            logger.info("Migration: recording_url already exists")
        else:
            conn.execute(text(
                "ALTER TABLE survey_responses ADD COLUMN recording_url TEXT"
            ))
            conn.commit()
            logger.info("Migration: added recording_url column")
