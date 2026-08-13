import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(backend_dir, "data")
os.makedirs(data_dir, exist_ok=True)
test_db_path = os.path.join(data_dir, "test.db").replace(os.sep, "/")

TEST_DATABASE_URL = f"sqlite:///{test_db_path}"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

from backend.database.database import Base, get_db
from backend.main import app

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    actual_path = os.path.join(data_dir, "test.db")
    if os.path.exists(actual_path):
        try:
            os.remove(actual_path)
        except Exception:
            pass

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    return TestClient(app)
