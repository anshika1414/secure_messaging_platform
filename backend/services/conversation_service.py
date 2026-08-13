from datetime import datetime
from typing import List, Optional, Dict
from sqlalchemy.orm import Session as DBSession, joinedload
from sqlalchemy import func, and_
from fastapi import HTTPException, status
from backend.models import Conversation, ConversationMember, User, Message, Contact

class ConversationService:

    @staticmethod
    def get_user_conversations(db: DBSession, user_id: str) -> List[Dict]:
        memberships = db.query(ConversationMember).filter(
            ConversationMember.user_id == user_id
        ).all()
        
        conv_ids = [m.conversation_id for m in memberships]
        if not conv_ids:
            return []

        conversations = db.query(Conversation).options(
            joinedload(Conversation.members).joinedload(ConversationMember.user),
            joinedload(Conversation.last_message).joinedload(Message.sender),
            joinedload(Conversation.group_meta)
        ).filter(
            Conversation.id.in_(conv_ids)
        ).order_by(Conversation.last_activity_at.desc()).all()

        results = []
        for conv in conversations:
            current_member = next((m for m in conv.members if m.user_id == user_id), None)
            last_read_id = current_member.last_read_message_id if current_member else None

            # Calculate unread count
            unread_count = 0
            if conv.last_message_id and conv.last_message_id != last_read_id:
                if last_read_id:
                    last_read_msg = db.query(Message).filter(Message.id == last_read_id).first()
                    if last_read_msg:
                        unread_count = db.query(func.count(Message.id)).filter(
                            Message.conversation_id == conv.id,
                            Message.created_at > last_read_msg.created_at,
                            Message.sender_id != user_id
                        ).scalar()
                    else:
                        unread_count = 1
                else:
                    unread_count = db.query(func.count(Message.id)).filter(
                        Message.conversation_id == conv.id,
                        Message.sender_id != user_id
                    ).scalar()

            # Determine title & avatar
            display_name = conv.name
            avatar_url = None
            if conv.type == "DIRECT":
                peer = next((m.user for m in conv.members if m.user_id != user_id), None)
                if peer:
                    display_name = peer.display_name
                    avatar_url = peer.avatar_url
                elif conv.members:
                    display_name = conv.members[0].user.display_name
                    avatar_url = conv.members[0].user.avatar_url
            elif conv.type == "GROUP":
                if conv.group_meta:
                    display_name = conv.group_meta.name
                avatar_url = f"https://api.dicebear.com/7.x/identicon/svg?seed={conv.id}"

            results.append({
                "id": conv.id,
                "type": conv.type,
                "name": display_name,
                "avatar_url": avatar_url,
                "last_message_id": conv.last_message_id,
                "last_message": conv.last_message,
                "last_activity_at": conv.last_activity_at,
                "created_at": conv.created_at,
                "unread_count": unread_count,
                "members": conv.members
            })

        return results

    @staticmethod
    def get_or_create_direct_conversation(db: DBSession, user_id: str, target_user_id: str) -> Conversation:
        if user_id == target_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create direct message with yourself")

        target_user = db.query(User).filter(User.id == target_user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")

        # Check existing direct conversation specifically
        direct_convs = db.query(ConversationMember.conversation_id).join(
            Conversation, Conversation.id == ConversationMember.conversation_id
        ).filter(
            Conversation.type == "DIRECT",
            ConversationMember.user_id == user_id
        ).all()

        direct_conv_ids = [c[0] for c in direct_convs]
        if direct_conv_ids:
            target_membership = db.query(ConversationMember).filter(
                ConversationMember.conversation_id.in_(direct_conv_ids),
                ConversationMember.user_id == target_user_id
            ).first()
            if target_membership:
                conv = db.query(Conversation).filter(Conversation.id == target_membership.conversation_id).first()
                if conv:
                    return conv

        # Create new DIRECT conversation
        conv = Conversation(type="DIRECT", last_activity_at=datetime.utcnow())
        db.add(conv)
        db.flush()

        m1 = ConversationMember(conversation_id=conv.id, user_id=user_id, role="MEMBER")
        m2 = ConversationMember(conversation_id=conv.id, user_id=target_user_id, role="MEMBER")
        db.add(m1)
        db.add(m2)

        # Add mutual contact records
        c1 = db.query(Contact).filter(Contact.user_id == user_id, Contact.contact_user_id == target_user_id).first()
        if not c1:
            db.add(Contact(user_id=user_id, contact_user_id=target_user_id))
        c2 = db.query(Contact).filter(Contact.user_id == target_user_id, Contact.contact_user_id == user_id).first()
        if not c2:
            db.add(Contact(user_id=target_user_id, contact_user_id=user_id))

        db.commit()
        db.refresh(conv)
        return conv

    @staticmethod
    def get_conversation_by_id(db: DBSession, conversation_id: str, user_id: str) -> Conversation:
        membership = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        ).first()
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to conversation")

        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        return conv
