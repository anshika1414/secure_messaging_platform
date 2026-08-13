from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from backend.database.database import get_db
from backend.schemas.message import MessageResponse, SendMessageRequest
from backend.services.message_service import MessageService
from backend.routers.deps import get_current_user
from backend.models import User, Message

router = APIRouter(prefix="/messages", tags=["Messages"])

@router.post("/conversations/{conversation_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: str,
    req: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    return MessageService.create_message(
        db, conversation_id=conversation_id, sender_id=current_user.id, content=req.content, message_type=req.message_type
    )

@router.delete("/{message_id}")
def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete another user's message")

    db.delete(msg)
    db.commit()
    return {"message": "Message deleted"}
