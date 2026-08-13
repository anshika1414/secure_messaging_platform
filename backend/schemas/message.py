from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from backend.schemas.user import UserResponse

class MessageReceiptResponse(BaseModel):
    user_id: str
    status: str
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender: Optional[UserResponse] = None
    content: str
    message_type: str = "TEXT"
    created_at: datetime
    edited_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    receipts: List[MessageReceiptResponse] = []

    class Config:
        from_attributes = True

class SendMessageRequest(BaseModel):
    content: str
    message_type: str = "TEXT"

class PaginatedMessagesResponse(BaseModel):
    messages: List[MessageResponse]
    next_cursor: Optional[str] = None
    has_more: bool = False
