from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from backend.schemas.user import UserResponse
from backend.schemas.message import MessageResponse

class ConversationMemberResponse(BaseModel):
    user_id: str
    role: str
    joined_at: datetime
    last_read_message_id: Optional[str] = None
    user: UserResponse

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: str
    type: str  # DIRECT, GROUP
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    last_message_id: Optional[str] = None
    last_message: Optional[MessageResponse] = None
    last_activity_at: datetime
    created_at: datetime
    unread_count: int = 0
    members: List[ConversationMemberResponse] = []

    class Config:
        from_attributes = True

class CreateDirectConversationRequest(BaseModel):
    target_user_id: str
