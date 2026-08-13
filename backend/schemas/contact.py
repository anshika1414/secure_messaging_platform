from datetime import datetime
from pydantic import BaseModel
from backend.schemas.user import UserResponse

class AddContactRequest(BaseModel):
    contact_user_id: str

class ContactResponse(BaseModel):
    user_id: str
    contact_user_id: str
    contact_user: UserResponse
    created_at: datetime

    class Config:
        from_attributes = True
