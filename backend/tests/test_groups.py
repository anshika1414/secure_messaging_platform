import pytest

def test_group_member_management(client):
    # 1. Register users: Alice (Admin), Bob (Member 1), Charlie (Member 2), Dave (Member 3)
    alice_reg = client.post("/api/v1/auth/register", json={"username": "alice_grp", "password": "pass123", "display_name": "Alice Smith"})
    assert alice_reg.status_code == 201
    alice_login = client.post("/api/v1/auth/login", json={"login": "alice_grp", "password": "pass123"}).json()
    alice_token = alice_login["access_token"]
    alice_id = alice_login["user_id"]
    alice_hdr = {"Authorization": f"Bearer {alice_token}"}

    bob_reg = client.post("/api/v1/auth/register", json={"username": "bob_grp", "password": "pass123", "display_name": "Bob Jones"})
    assert bob_reg.status_code == 201
    bob_login = client.post("/api/v1/auth/login", json={"login": "bob_grp", "password": "pass123"}).json()
    bob_token = bob_login["access_token"]
    bob_id = bob_login["user_id"]
    bob_hdr = {"Authorization": f"Bearer {bob_token}"}

    charlie_reg = client.post("/api/v1/auth/register", json={"username": "charlie_grp", "password": "pass123", "display_name": "Charlie Brown"})
    assert charlie_reg.status_code == 201
    charlie_login = client.post("/api/v1/auth/login", json={"login": "charlie_grp", "password": "pass123"}).json()
    charlie_token = charlie_login["access_token"]
    charlie_id = charlie_login["user_id"]
    charlie_hdr = {"Authorization": f"Bearer {charlie_token}"}

    # 2. Alice creates group "Engineering" with Bob
    create_res = client.post(
        "/api/v1/groups",
        json={"name": "Engineering", "member_ids": [bob_id]},
        headers=alice_hdr
    )
    assert create_res.status_code == 201
    grp_data = create_res.json()
    conv_id = grp_data["conversation_id"]
    group_id = grp_data["group_id"]

    # Verify initial members (Alice + Bob)
    conv_res = client.get(f"/api/v1/conversations/{conv_id}", headers=alice_hdr)
    assert conv_res.status_code == 200
    members = conv_res.json()["members"]
    member_uids = [m["user_id"] for m in members]
    assert alice_id in member_uids
    assert bob_id in member_uids
    assert len(members) == 2

    # 3. Test A — Add Charlie using conversation_id as group identifier
    add_res = client.post(
        f"/api/v1/groups/{conv_id}/members",
        json={"user_id": charlie_id, "role": "MEMBER"},
        headers=alice_hdr
    )
    assert add_res.status_code == 200

    # Verify Charlie appears in member list and can access conversation
    conv_res_charlie = client.get(f"/api/v1/conversations/{conv_id}", headers=charlie_hdr)
    assert conv_res_charlie.status_code == 200
    charlie_members = conv_res_charlie.json()["members"]
    assert len(charlie_members) == 3
    assert any(m["user_id"] == charlie_id for m in charlie_members)

    # 4. Test B — Prevent duplicate member addition
    add_dup_res = client.post(
        f"/api/v1/groups/{conv_id}/members",
        json={"user_id": charlie_id, "role": "MEMBER"},
        headers=alice_hdr
    )
    assert add_dup_res.status_code == 200
    # Re-verify member count is still 3
    conv_res_check = client.get(f"/api/v1/conversations/{conv_id}", headers=alice_hdr)
    assert len(conv_res_check.json()["members"]) == 3

    # 5. Test D — Authorization: Non-admin (Bob) attempts to add user -> 403 Forbidden
    dave_reg = client.post("/api/v1/auth/register", json={"username": "dave_grp", "password": "pass123", "display_name": "Dave Miller"})
    dave_id = dave_reg.json()["id"]

    unauth_add = client.post(
        f"/api/v1/groups/{conv_id}/members",
        json={"user_id": dave_id, "role": "MEMBER"},
        headers=bob_hdr
    )
    assert unauth_add.status_code == 403

    # Non-admin (Bob) attempts to remove Charlie -> 403 Forbidden
    unauth_rem = client.delete(
        f"/api/v1/groups/{conv_id}/members/{charlie_id}",
        headers=bob_hdr
    )
    assert unauth_rem.status_code == 403

    # 6. Test C — Remove member: Alice removes Charlie
    rem_res = client.delete(
        f"/api/v1/groups/{conv_id}/members/{charlie_id}",
        headers=alice_hdr
    )
    assert rem_res.status_code == 200

    # Verify Charlie disappeared from member list
    conv_res_after = client.get(f"/api/v1/conversations/{conv_id}", headers=alice_hdr)
    assert conv_res_after.status_code == 200
    after_uids = [m["user_id"] for m in conv_res_after.json()["members"]]
    assert charlie_id not in after_uids
    assert len(after_uids) == 2

    # Verify Charlie can no longer access conversation
    charlie_denied = client.get(f"/api/v1/conversations/{conv_id}", headers=charlie_hdr)
    assert charlie_denied.status_code == 403
