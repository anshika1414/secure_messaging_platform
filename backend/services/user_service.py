from typing import List, Optional
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import or_
from fastapi import HTTPException, status
from backend.models import User

class UserService:

    @staticmethod
    def get_user_by_id(db: DBSession, user_id: str) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    @staticmethod
    def search_users(db: DBSession, query: str, current_user_id: str) -> List[User]:
        clean_q = query.strip()
        if not clean_q:
            return []
        
        users = db.query(User).filter(
            User.id != current_user_id,
            or_(
                User.username.ilike(f"%{clean_q}%"),
                User.display_name.ilike(f"%{clean_q}%"),
                User.phone.ilike(f"%{clean_q}%")
            )
        ).limit(20).all()
        return users

    @staticmethod
    def update_user_profile(db: DBSession, user_id: str, display_name: Optional[str] = None, avatar_url: Optional[str] = None) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if display_name is not None and display_name.strip():
            user.display_name = display_name.strip()
        if avatar_url is not None:
            user.avatar_url = avatar_url.strip()

        db.commit()
        db.refresh(user)
        return user
