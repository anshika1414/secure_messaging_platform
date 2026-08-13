from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: str
    username: str
    phone: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None
    is_online: bool = False
    last_seen: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
