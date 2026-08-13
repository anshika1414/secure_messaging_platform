from datetime import datetime
from typing import Optional, List, Dict
from sqlalchemy.orm import Session as DBSession, joinedload
from fastapi import HTTPException, status
from backend.models import Message, MessageReceipt, Conversation, ConversationMember, User

class MessageService:

    @staticmethod
    def create_message(db: DBSession, conversation_id: str, sender_id: str, content: str, message_type: str = "TEXT") -> Message:
        # Check membership
        membership = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == sender_id
        ).first()

        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this conversation")

        # Atomic transaction
        now = datetime.utcnow()
        msg = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content.strip(),
            message_type=message_type,
            created_at=now
        )
        db.add(msg)
        db.flush()

        # Create message receipts for other conversation members
        members = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == conversation_id
        ).all()

        for member in members:
            if member.user_id != sender_id:
                receipt = MessageReceipt(
                    message_id=msg.id,
                    user_id=member.user_id,
                    status="SENT"
                )
                db.add(receipt)

        # Update conversation metadata
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            conv.last_message_id = msg.id
            conv.last_activity_at = now

        # Update sender's last read position
        membership.last_read_message_id = msg.id

        db.commit()
        
        # Reload message with relationships
        full_msg = db.query(Message).options(
            joinedload(Message.sender),
            joinedload(Message.receipts)
        ).filter(Message.id == msg.id).first()
        return full_msg

    @staticmethod
    def get_paginated_messages(db: DBSession, conversation_id: str, user_id: str, cursor: Optional[str] = None, limit: int = 50) -> Dict:
        membership = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        ).first()

        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        query = db.query(Message).options(
            joinedload(Message.sender),
            joinedload(Message.receipts)
        ).filter(Message.conversation_id == conversation_id)

        if cursor:
            cursor_msg = db.query(Message).filter(Message.id == cursor).first()
            if cursor_msg:
                query = query.filter(Message.created_at < cursor_msg.created_at)

        messages = query.order_by(Message.created_at.desc()).limit(limit + 1).all()

        has_more = len(messages) > limit
        if has_more:
            messages = messages[:limit]

        # Reverse so frontend renders them in chronological order
        messages.reverse()
        next_cursor = messages[0].id if messages and has_more else None

        return {
            "messages": messages,
            "next_cursor": next_cursor,
            "has_more": has_more
        }

    @staticmethod
    def mark_as_read(db: DBSession, conversation_id: str, user_id: str) -> bool:
        membership = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        ).first()

        if not membership:
            return False

        latest_msg = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.desc()).first()

        if not latest_msg:
            return True

        membership.last_read_message_id = latest_msg.id

        # Update receipts
        receipts = db.query(MessageReceipt).join(Message).filter(
            Message.conversation_id == conversation_id,
            MessageReceipt.user_id == user_id,
            MessageReceipt.status != "READ"
        ).all()

        now = datetime.utcnow()
        for r in receipts:
            r.status = "READ"
            r.read_at = now
            if not r.delivered_at:
                r.delivered_at = now

        db.commit()
        return True

    @staticmethod
    def update_receipt(db: DBSession, message_id: str, user_id: str, status_str: str) -> Optional[MessageReceipt]:
        receipt = db.query(MessageReceipt).filter(
            MessageReceipt.message_id == message_id,
            MessageReceipt.user_id == user_id
        ).first()

        if not receipt:
            return None

        now = datetime.utcnow()
        if status_str == "DELIVERED":
            if receipt.status == "SENT":
                receipt.status = "DELIVERED"
                receipt.delivered_at = now
        elif status_str == "READ":
            receipt.status = "READ"
            receipt.read_at = now
            if not receipt.delivered_at:
                receipt.delivered_at = now

        db.commit()
        return receipt
