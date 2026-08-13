from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from backend.schemas.user import UserResponse
from backend.schemas.conversation import ConversationResponse

class CreateGroupRequest(BaseModel):
    name: str
    member_ids: List[str]

class AddGroupMemberRequest(BaseModel):
    user_id: str
    role: str = "MEMBER"

class UpdateGroupRequest(BaseModel):
    name: Optional[str] = None

class GroupResponse(BaseModel):
    id: str
    conversation_id: str
    name: str
    created_by: str
    created_at: datetime
    conversation: ConversationResponse

    class Config:
        from_attributes = True
