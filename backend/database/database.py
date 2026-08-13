import os
import sys

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///./"):
    # Convert relative sqlite path to absolute path relative to backend root
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    rel_path = db_url.replace("sqlite:///./", "")
    abs_db_path = os.path.join(backend_dir, rel_path)
    os.makedirs(os.path.dirname(abs_db_path), exist_ok=True)
    db_url = f"sqlite:///{abs_db_path.replace(os.sep, '/')}"

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {},
    echo=False
)

# Enable Foreign Keys and WAL Mode on every SQLite connection
if db_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
