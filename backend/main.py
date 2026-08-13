import os
import sys

# Ensure root workspace directory is in sys.path when running from inside backend/
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import json
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session as DBSession

from backend.config import settings
from backend.database.database import engine, Base, SessionLocal, get_db
from backend.models import User, Session as SessionModel
from backend.utils.auth import decode_access_token
from backend.routers import auth, users, contacts, conversations, messages, groups
from backend.websocket.manager import manager
from backend.websocket.events import (
    handle_send_message,
    handle_typing_event,
    handle_mark_read
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("signal_backend")

from backend.database.seed import ensure_demo_users

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Guarantee demo users exist
try:
    with SessionLocal() as db_init:
        ensure_demo_users(db_init)
except Exception as e:
    logging.warning(f"Demo user auto-seed check skipped or failed: {e}")

app = FastAPI(
    title="Signal Secure Messaging Platform API",
    version="1.0.0",
    description="Full-stack Signal clone backend built with FastAPI, SQLAlchemy, SQLite (WAL), and WebSockets."
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(contacts.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
app.include_router(groups.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Signal-Style Secure Messaging Backend",
        "version": "1.0.0",
        "docs": "/docs"
    }

# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Authenticate token via JWT payload or Session database token lookup
    db: DBSession = SessionLocal()
    user_id = None
    try:
        payload = decode_access_token(token)
        if payload:
            user_id = payload.get("sub")
            sess_token = payload.get("session")
            session_rec = db.query(SessionModel).filter(
                SessionModel.user_id == user_id,
                SessionModel.token == sess_token
            ).first()
            if not session_rec:
                user_id = None
        else:
            session_rec = db.query(SessionModel).filter(SessionModel.token == token).first()
            if session_rec:
                user_id = session_rec.user_id
    except Exception as e:
        logger.error(f"WebSocket auth exception: {e}")
        user_id = None

    if not user_id:
        db.close()
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        db.close()
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Register online connection
    user.is_online = True
    db.commit()

    await manager.connect(user_id, websocket)

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                event_data = json.loads(raw_text)
                event_type = event_data.get("event")
                payload = event_data.get("data", {})

                if event_type == "SEND_MESSAGE":
                    await handle_send_message(user_id, payload, db)
                elif event_type == "TYPING_START":
                    await handle_typing_event(user_id, payload, is_typing=True, db=db)
                elif event_type == "TYPING_STOP":
                    await handle_typing_event(user_id, payload, is_typing=False, db=db)
                elif event_type == "MARK_READ":
                    await handle_mark_read(user_id, payload, db)

            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from user {user_id}")
            except Exception as ex:
                logger.error(f"Error handling event for user {user_id}: {ex}")

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        if not manager.is_user_online(user_id):
            user.is_online = False
            db.commit()
    finally:
        db.close()
