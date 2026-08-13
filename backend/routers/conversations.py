from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session as DBSession
from backend.database.database import get_db
from backend.schemas.conversation import ConversationResponse, CreateDirectConversationRequest
from backend.schemas.message import PaginatedMessagesResponse
from backend.services.conversation_service import ConversationService
from backend.services.message_service import MessageService
from backend.routers.deps import get_current_user
from backend.models import User

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.get("", response_model=List[ConversationResponse])
def get_conversations(current_user: User = Depends(get_current_user), db: DBSession = Depends(get_db)):
    return ConversationService.get_user_conversations(db, user_id=current_user.id)

@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_direct_conversation(
    req: CreateDirectConversationRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    conv = ConversationService.get_or_create_direct_conversation(
        db, user_id=current_user.id, target_user_id=req.target_user_id
    )
    # Return formatted conversation
    conversations = ConversationService.get_user_conversations(db, user_id=current_user.id)
    matching = next((c for c in conversations if c["id"] == conv.id), None)
    if matching:
        return matching
    return conv

@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation_by_id(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    conv = ConversationService.get_conversation_by_id(db, conversation_id=conversation_id, user_id=current_user.id)
    conversations = ConversationService.get_user_conversations(db, user_id=current_user.id)
    matching = next((c for c in conversations if c["id"] == conv.id), None)
    if matching:
        return matching
    return conv

@router.get("/{conversation_id}/messages", response_model=PaginatedMessagesResponse)
def get_messages(
    conversation_id: str,
    cursor: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    return MessageService.get_paginated_messages(
        db, conversation_id=conversation_id, user_id=current_user.id, cursor=cursor, limit=limit
    )

@router.post("/{conversation_id}/read")
def mark_read(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    success = MessageService.mark_as_read(db, conversation_id=conversation_id, user_id=current_user.id)
    return {"status": "success" if success else "failed"}
