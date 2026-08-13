from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session as DBSession
from fastapi import HTTPException, status
from backend.models import User, Session
from backend.utils.auth import hash_password, verify_password, generate_session_token, create_access_token
from backend.utils.validators import sanitize_username, sanitize_phone
from backend.config import settings

class AuthService:

    @staticmethod
    def register_user(db: DBSession, username: str, password: str, display_name: str, phone: Optional[str] = None) -> User:
        clean_username = sanitize_username(username)
        clean_phone = sanitize_phone(phone) if phone else None

        existing_user = db.query(User).filter(User.username == clean_username).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")

        if clean_phone:
            existing_phone = db.query(User).filter(User.phone == clean_phone).first()
            if existing_phone:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number is already registered")

        user = User(
            username=clean_username,
            password_hash=hash_password(password),
            display_name=display_name.strip(),
            phone=clean_phone,
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={clean_username}"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate_user(db: DBSession, login_str: str, password: str) -> dict:
        login_clean = login_str.strip()
        user = db.query(User).filter(
            (User.username == login_clean.lower()) | (User.phone == login_clean)
        ).first()

        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/phone or password"
            )

        token_str = generate_session_token()
        expires_at = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        session = Session(
            user_id=user.id,
            token=token_str,
            expires_at=expires_at
        )
        db.add(session)
        
        user.is_online = True
        user.last_seen = datetime.utcnow()
        db.commit()

        jwt_token = create_access_token(data={"sub": user.id, "session": token_str})

        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user_id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
        }

    @staticmethod
    def verify_session_token(db: DBSession, token: str) -> Optional[User]:
        session = db.query(Session).filter(Session.token == token).first()
        if not session or session.expires_at < datetime.utcnow():
            return None
        return session.user

    @staticmethod
    def logout(db: DBSession, user_id: str, session_token: str):
        db.query(Session).filter(Session.user_id == user_id, Session.token == session_token).delete()
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_online = False
            user.last_seen = datetime.utcnow()
        db.commit()
