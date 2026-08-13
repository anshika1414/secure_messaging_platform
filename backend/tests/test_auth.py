import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.database import Base, engine, SessionLocal

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_register_and_login():
    # 1. Register test user
    reg_payload = {
        "username": "testuser",
        "password": "Password123!",
        "display_name": "Test User",
        "phone": "+19998887777"
    }
    response = client.post("/api/v1/auth/register", json=reg_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert "password_hash" not in data

    # 2. Login
    login_payload = {
        "login": "testuser",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    login_data = response.json()
    assert "access_token" in login_data
    token = login_data["access_token"]

    # 3. Get /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "testuser"
