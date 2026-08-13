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

def ensure_demo_data(db: SessionLocal):
    users = ensure_demo_users(db)

    # Check if demo conversations already exist
    alice = users.get("alice")
    bob = users.get("bob")
    charlie = users.get("charlie")
    grace = users.get("grace")
    diana = users.get("diana")

    if not alice or not bob:
        return

    # Check contacts
    if not db.query(Contact).filter(Contact.user_id == alice.id, Contact.contact_user_id == bob.id).first():
        db.add(Contact(user_id=alice.id, contact_user_id=bob.id))
        db.add(Contact(user_id=bob.id, contact_user_id=alice.id))
    if charlie and not db.query(Contact).filter(Contact.user_id == alice.id, Contact.contact_user_id == charlie.id).first():
        db.add(Contact(user_id=alice.id, contact_user_id=charlie.id))
    if diana and not db.query(Contact).filter(Contact.user_id == alice.id, Contact.contact_user_id == diana.id).first():
        db.add(Contact(user_id=alice.id, contact_user_id=diana.id))

    db.commit()

    # Check Direct Conversation: Alice <-> Bob
    alice_conv_ids = [m.conversation_id for m in db.query(ConversationMember).filter(ConversationMember.user_id == alice.id).all()]
    bob_direct = db.query(ConversationMember).filter(
        ConversationMember.conversation_id.in_(alice_conv_ids),
        ConversationMember.user_id == bob.id
    ).first() if alice_conv_ids else None

    if not bob_direct:
        now = datetime.utcnow()
        conv_ab = Conversation(type="DIRECT", last_activity_at=now - timedelta(minutes=2))
        db.add(conv_ab)
        db.flush()

        m_ab1 = ConversationMember(conversation_id=conv_ab.id, user_id=alice.id, role="MEMBER")
        m_ab2 = ConversationMember(conversation_id=conv_ab.id, user_id=bob.id, role="MEMBER")
        db.add(m_ab1)
        db.add(m_ab2)

        messages_ab = [
            (alice.id, "Hey Bob! Did you review the Signal architecture proposal?", now - timedelta(hours=2)),
            (bob.id, "Hey Alice! Yes, the layer design looks super clean.", now - timedelta(hours=1, minutes=45)),
            (alice.id, "Great! I've enabled SQLite WAL mode for concurrency.", now - timedelta(hours=1, minutes=30)),
            (bob.id, "Awesome, that prevents database locks during active WebSocket writes.", now - timedelta(minutes=2)),
        ]

        last_msg_id = None
        for sender_id, text, t in messages_ab:
            msg = Message(conversation_id=conv_ab.id, sender_id=sender_id, content=text, created_at=t)
            db.add(msg)
            db.flush()
            last_msg_id = msg.id

            recipient_id = bob.id if sender_id == alice.id else alice.id
            db.add(MessageReceipt(message_id=msg.id, user_id=recipient_id, status="READ", read_at=t + timedelta(seconds=30)))

        conv_ab.last_message_id = last_msg_id
        m_ab1.last_read_message_id = last_msg_id
        m_ab2.last_read_message_id = last_msg_id
        db.commit()

    # Check Direct Conversation: Alice <-> Charlie
    if charlie:
        charlie_direct = db.query(ConversationMember).filter(
            ConversationMember.conversation_id.in_(alice_conv_ids),
            ConversationMember.user_id == charlie.id
        ).first() if alice_conv_ids else None

        if not charlie_direct:
            now = datetime.utcnow()
            conv_ac = Conversation(type="DIRECT", last_activity_at=now - timedelta(hours=5))
            db.add(conv_ac)
            db.flush()

            m_ac1 = ConversationMember(conversation_id=conv_ac.id, user_id=alice.id, role="MEMBER")
            m_ac2 = ConversationMember(conversation_id=conv_ac.id, user_id=charlie.id, role="MEMBER")
            db.add(m_ac1)
            db.add(m_ac2)

            msg_c1 = Message(conversation_id=conv_ac.id, sender_id=charlie.id, content="Alice, let's sync up on the Next.js dark theme styling.", created_at=now - timedelta(hours=5))
            db.add(msg_c1)
            db.flush()

            db.add(MessageReceipt(message_id=msg_c1.id, user_id=alice.id, status="DELIVERED", delivered_at=now - timedelta(hours=4, minutes=55)))
            conv_ac.last_message_id = msg_c1.id
            m_ac2.last_read_message_id = msg_c1.id
            db.commit()

    # Check Group Conversation: Signal Core Engineering
    grp_exists = db.query(Group).filter(Group.name == "Signal Core Engineering").first()
    if not grp_exists and charlie and grace:
        now = datetime.utcnow()
        conv_grp = Conversation(type="GROUP", name="Signal Core Engineering", last_activity_at=now - timedelta(minutes=10))
        db.add(conv_grp)
        db.flush()

        grp_meta = Group(conversation_id=conv_grp.id, name="Signal Core Engineering", created_by=alice.id)
        db.add(grp_meta)

        db.add(ConversationMember(conversation_id=conv_grp.id, user_id=alice.id, role="ADMIN"))
        db.add(ConversationMember(conversation_id=conv_grp.id, user_id=bob.id, role="MEMBER"))
        db.add(ConversationMember(conversation_id=conv_grp.id, user_id=charlie.id, role="MEMBER"))
        db.add(ConversationMember(conversation_id=conv_grp.id, user_id=grace.id, role="MEMBER"))

        grp_messages = [
            (alice.id, "Welcome team to the Signal Core Engineering group!", "SYSTEM", now - timedelta(days=1)),
            (alice.id, "Let's ensure zero N+1 queries in the conversation sidebar.", "TEXT", now - timedelta(hours=4)),
            (grace.id, "Agreed! Maintaining last_message_id and last_activity_at makes queries blazing fast.", "TEXT", now - timedelta(hours=3)),
            (bob.id, "All real-time typing indicators are routed purely in-memory via WebSocketManager.", "TEXT", now - timedelta(minutes=10)),
        ]

        last_grp_msg_id = None
        for sender_id, text, m_type, t in grp_messages:
            msg = Message(conversation_id=conv_grp.id, sender_id=sender_id, content=text, message_type=m_type, created_at=t)
            db.add(msg)
            db.flush()
            last_grp_msg_id = msg.id

            # Add receipts for all non-sender members
            for m_uid in [alice.id, bob.id, charlie.id, grace.id]:
                if m_uid != sender_id:
                    db.add(MessageReceipt(message_id=msg.id, user_id=m_uid, status="SENT"))

        conv_grp.last_message_id = last_grp_msg_id
        db.commit()

def seed_database():
    print("[Seed] Initializing Database Schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("[Seed] Seeding Data...")
        ensure_demo_data(db)
        print("[OK] Database successfully seeded!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
