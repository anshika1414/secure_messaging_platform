import pytest

def test_conversation_and_messaging_flow(client):
    # Register User 1
    u1_reg = client.post("/api/v1/auth/register", json={"username": "user1", "password": "pass123", "display_name": "User One"})
    assert u1_reg.status_code == 201
    u1_login = client.post("/api/v1/auth/login", json={"login": "user1", "password": "pass123"}).json()
    t1 = u1_login["access_token"]
    u1_id = u1_login["user_id"]

    # Register User 2
    u2_reg = client.post("/api/v1/auth/register", json={"username": "user2", "password": "pass123", "display_name": "User Two"})
    assert u2_reg.status_code == 201
    u2_login = client.post("/api/v1/auth/login", json={"login": "user2", "password": "pass123"}).json()
    t2 = u2_login["access_token"]

    # User 1 creates direct conversation with User 2
    h1 = {"Authorization": f"Bearer {t1}"}
    conv_resp = client.post("/api/v1/conversations", json={"target_user_id": u2_login["user_id"]}, headers=h1)
    assert conv_resp.status_code == 201
    conv_id = conv_resp.json()["id"]

    # User 1 sends message
    msg_resp = client.post(f"/api/v1/messages/conversations/{conv_id}", json={"content": "Hello World!"}, headers=h1)
    assert msg_resp.status_code == 201
    assert msg_resp.json()["content"] == "Hello World!"

    # User 2 gets messages
    h2 = {"Authorization": f"Bearer {t2}"}
    msgs_resp = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=h2)
    assert msgs_resp.status_code == 200
    m_list = msgs_resp.json()["messages"]
    assert len(m_list) == 1
    assert m_list[0]["content"] == "Hello World!"
