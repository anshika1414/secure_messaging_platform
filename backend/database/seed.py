import os
import sys
from datetime import datetime, timedelta
import random

# Ensure root backend module is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.database.database import engine, Base, SessionLocal
from backend.models import User, Session as SessionModel, Contact, Conversation, ConversationMember, Group, Message, MessageReceipt
from backend.utils.auth import hash_password

def ensure_demo_users(db: SessionLocal):
    default_pwd = hash_password("password123")
    users_data = [
        {"username": "alice", "display_name": "Alice Smith", "phone": "+14155550101", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=alice"},
        {"username": "bob", "display_name": "Bob Jones", "phone": "+14155550102", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=bob"},
        {"username": "charlie", "display_name": "Charlie Brown", "phone": "+14155550103", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=charlie"},
        {"username": "diana", "display_name": "Diana Prince", "phone": "+14155550104", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=diana"},
        {"username": "eve", "display_name": "Eve Adams", "phone": "+14155550105", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=eve"},
        {"username": "frank", "display_name": "Frank Castle", "phone": "+14155550106", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=frank"},
        {"username": "grace", "display_name": "Grace Hopper", "phone": "+14155550107", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=grace"},
    ]

    users = {}
    for u in users_data:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            user = User(
                username=u["username"],
                display_name=u["display_name"],
                phone=u["phone"],
                password_hash=default_pwd,
                avatar_url=u["avatar_url"],
                is_online=False,
                last_seen=datetime.utcnow() - timedelta(minutes=random.randint(5, 120))
            )
            db.add(user)
            db.flush()
            users[u["username"]] = user
        else:
            existing.password_hash = default_pwd
            users[u["username"]] = existing

    db.commit()
    return users

def seed_database():
    print("[Seed] Initializing Database Schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("[Seed] Seeding Users...")
        users = ensure_demo_users(db)

        print("[Seed] Seeding Contacts...")
        # Alice's contacts: Bob, Charlie, Diana
        db.add(Contact(user_id=users["alice"].id, contact_user_id=users["bob"].id))
        db.add(Contact(user_id=users["alice"].id, contact_user_id=users["charlie"].id))
        db.add(Contact(user_id=users["alice"].id, contact_user_id=users["diana"].id))
        # Bob's contacts: Alice, Charlie, Eve
        db.add(Contact(user_id=users["bob"].id, contact_user_id=users["alice"].id))
        db.add(Contact(user_id=users["bob"].id, contact_user_id=users["charlie"].id))

        db.commit()

        print("[Seed] Seeding Direct Conversations...")
        now = datetime.utcnow()

        # 1. Direct Conversation: Alice ↔ Bob
        conv_ab = Conversation(type="DIRECT", last_activity_at=now - timedelta(minutes=2))
        db.add(conv_ab)
        db.flush()

        m_ab1 = ConversationMember(conversation_id=conv_ab.id, user_id=users["alice"].id, role="MEMBER")
        m_ab2 = ConversationMember(conversation_id=conv_ab.id, user_id=users["bob"].id, role="MEMBER")
        db.add(m_ab1)
        db.add(m_ab2)

        messages_ab = [
            (users["alice"].id, "Hey Bob! Did you review the Signal architecture proposal?", now - timedelta(hours=2)),
            (users["bob"].id, "Hey Alice! Yes, the layer design looks super clean.", now - timedelta(hours=1, minutes=45)),
            (users["alice"].id, "Great! I've enabled SQLite WAL mode for concurrency.", now - timedelta(hours=1, minutes=30)),
            (users["bob"].id, "Awesome, that prevents database locks during active WebSocket writes.", now - timedelta(minutes=2)),
        ]

        last_msg_id = None
        for sender_id, text, t in messages_ab:
            msg = Message(conversation_id=conv_ab.id, sender_id=sender_id, content=text, created_at=t)
            db.add(msg)
            db.flush()
            last_msg_id = msg.id

            recipient_id = users["bob"].id if sender_id == users["alice"].id else users["alice"].id
            db.add(MessageReceipt(message_id=msg.id, user_id=recipient_id, status="READ", read_at=t + timedelta(seconds=30)))

        conv_ab.last_message_id = last_msg_id
        m_ab1.last_read_message_id = last_msg_id
        m_ab2.last_read_message_id = last_msg_id

        # 2. Direct Conversation: Alice ↔ Charlie
        conv_ac = Conversation(type="DIRECT", last_activity_at=now - timedelta(hours=5))
        db.add(conv_ac)
        db.flush()

        m_ac1 = ConversationMember(conversation_id=conv_ac.id, user_id=users["alice"].id, role="MEMBER")
        m_ac2 = ConversationMember(conversation_id=conv_ac.id, user_id=users["charlie"].id, role="MEMBER")
        db.add(m_ac1)
        db.add(m_ac2)

        msg_c1 = Message(conversation_id=conv_ac.id, sender_id=users["charlie"].id, content="Alice, let's sync up on the Next.js dark theme styling.", created_at=now - timedelta(hours=5))
        db.add(msg_c1)
        db.flush()

        db.add(MessageReceipt(message_id=msg_c1.id, user_id=users["alice"].id, status="DELIVERED", delivered_at=now - timedelta(hours=4, minutes=55)))
        conv_ac.last_message_id = msg_c1.id
        m_ac2.last_read_message_id = msg_c1.id  # Alice hasn't read this yet (unread count = 1 for Alice)

        print("[Seed] Seeding Group Conversation...")
        # 3. Group Conversation: Signal Core Engineering (Alice [ADMIN], Bob, Charlie, Grace)
        conv_grp = Conversation(type="GROUP", name="Signal Core Engineering", last_activity_at=now - timedelta(minutes=10))
        db.add(conv_grp)
        db.flush()

        grp_meta = Group(conversation_id=conv_grp.id, name="Signal Core Engineering", created_by=users["alice"].id)
        db.add(grp_meta)

        db.add(ConversationMember(conversation_id=conv_grp.id, user_id=users["alice"].id, role="ADMIN"))
        db.add(ConversationMember(conversation_id=conv_grp.id, user_id=users["bob"].id, role="MEMBER"))
        db.add(ConversationMember(conversation_id=conv_grp.id, user_id=users["charlie"].id, role="MEMBER"))
        db.add(ConversationMember(conversation_id=conv_grp.id, user_id=users["grace"].id, role="MEMBER"))

        # Group messages
        grp_messages = [
            (users["alice"].id, "Welcome team to the Signal Core Engineering group!", "SYSTEM", now - timedelta(days=1)),
            (users["alice"].id, "Let's ensure zero N+1 queries in the conversation sidebar.", "TEXT", now - timedelta(hours=4)),
            (users["grace"].id, "Agreed! Maintaining last_message_id and last_activity_at makes queries blazing fast.", "TEXT", now - timedelta(hours=3)),
            (users["bob"].id, "All real-time typing indicators are routed purely in-memory via WebSocketManager.", "TEXT", now - timedelta(minutes=10)),
        ]

        last_grp_msg_id = None
        for sender_id, text, m_type, t in grp_messages:
            msg = Message(conversation_id=conv_grp.id, sender_id=sender_id, content=text, message_type=m_type, created_at=t)
            db.add(msg)
            db.flush()
            last_grp_msg_id = msg.id

        conv_grp.last_message_id = last_grp_msg_id
        db.commit()

        print("[OK] Database successfully seeded!")
        print("\nDemo User Credentials:")
        print("Username: alice | Password: password123")
        print("Username: bob   | Password: password123")
        print("Username: charlie | Password: password123")
        print("Username: grace | Password: password123")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
