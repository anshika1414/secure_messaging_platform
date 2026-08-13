from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DBSession
from backend.database.database import get_db
from backend.schemas.user import UserResponse, UserUpdateRequest
from backend.services.user_service import UserService
from backend.routers.deps import get_current_user
from backend.models import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/search", response_model=List[UserResponse])
def search_users(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    return UserService.search_users(db, query=q, current_user_id=current_user.id)

@router.get("/me", response_model=UserResponse)
def get_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_user_me(
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    return UserService.update_user_profile(
        db,
        user_id=current_user.id,
        display_name=req.display_name,
        avatar_url=req.avatar_url
    )
