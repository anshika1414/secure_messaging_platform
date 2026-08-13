from datetime import datetime
from typing import List
from sqlalchemy.orm import Session as DBSession, joinedload
from fastapi import HTTPException, status
from backend.models import Group, Conversation, ConversationMember, User, Message

class GroupService:

    @staticmethod
    def create_group(db: DBSession, creator_id: str, name: str, member_ids: List[str]) -> Group:
        creator = db.query(User).filter(User.id == creator_id).first()
        if not creator:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator user not found")

        conv = Conversation(type="GROUP", name=name.strip(), last_activity_at=datetime.utcnow())
        db.add(conv)
        db.flush()

        group = Group(
            conversation_id=conv.id,
            name=name.strip(),
            created_by=creator_id
        )
        db.add(group)

        # Add Creator as ADMIN
        m_creator = ConversationMember(conversation_id=conv.id, user_id=creator_id, role="ADMIN")
        db.add(m_creator)

        # Add unique member IDs
        unique_member_ids = set(member_ids) - {creator_id}
        for uid in unique_member_ids:
            u = db.query(User).filter(User.id == uid).first()
            if u:
                m = ConversationMember(conversation_id=conv.id, user_id=uid, role="MEMBER")
                db.add(m)

        # System message
        sys_msg = Message(
            conversation_id=conv.id,
            sender_id=creator_id,
            content=f"{creator.display_name} created group '{name.strip()}'",
            message_type="SYSTEM",
            created_at=datetime.utcnow()
        )
        db.add(sys_msg)
        db.flush()

        conv.last_message_id = sys_msg.id
        db.commit()
        db.refresh(group)
        return group

    @staticmethod
    def add_member(db: DBSession, group_id: str, current_user_id: str, target_user_id: str, role: str = "MEMBER") -> ConversationMember:
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

        # Check admin privileges
        admin_membership = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == group.conversation_id,
            ConversationMember.user_id == current_user_id,
            ConversationMember.role == "ADMIN"
        ).first()

        if not admin_membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only group admins can add members")

        target_user = db.query(User).filter(User.id == target_user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")

        existing = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == group.conversation_id,
            ConversationMember.user_id == target_user_id
        ).first()

        if existing:
            return existing

        new_member = ConversationMember(conversation_id=group.conversation_id, user_id=target_user_id, role=role)
        db.add(new_member)

        # System message
        admin_user = db.query(User).filter(User.id == current_user_id).first()
        sys_msg = Message(
            conversation_id=group.conversation_id,
            sender_id=current_user_id,
            content=f"{admin_user.display_name} added {target_user.display_name} to group",
            message_type="SYSTEM",
            created_at=datetime.utcnow()
        )
        db.add(sys_msg)
        db.flush()

        conv = db.query(Conversation).filter(Conversation.id == group.conversation_id).first()
        if conv:
            conv.last_message_id = sys_msg.id
            conv.last_activity_at = sys_msg.created_at

        db.commit()
        db.refresh(new_member)
        return new_member

    @staticmethod
    def remove_member(db: DBSession, group_id: str, current_user_id: str, target_user_id: str):
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

        # Allow user to remove self OR admin to remove others
        if current_user_id != target_user_id:
            admin_check = db.query(ConversationMember).filter(
                ConversationMember.conversation_id == group.conversation_id,
                ConversationMember.user_id == current_user_id,
                ConversationMember.role == "ADMIN"
            ).first()

            if not admin_check:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only group admins can remove members")

        db.query(ConversationMember).filter(
            ConversationMember.conversation_id == group.conversation_id,
            ConversationMember.user_id == target_user_id
        ).delete()

        admin_user = db.query(User).filter(User.id == current_user_id).first()
        target_user = db.query(User).filter(User.id == target_user_id).first()

        action_str = "left group" if current_user_id == target_user_id else f"removed {target_user.display_name if target_user else 'a member'}"
        sys_msg = Message(
            conversation_id=group.conversation_id,
            sender_id=current_user_id,
            content=f"{admin_user.display_name if admin_user else 'User'} {action_str}",
            message_type="SYSTEM",
            created_at=datetime.utcnow()
        )
        db.add(sys_msg)
        db.flush()

        conv = db.query(Conversation).filter(Conversation.id == group.conversation_id).first()
        if conv:
            conv.last_message_id = sys_msg.id
            conv.last_activity_at = sys_msg.created_at

        db.commit()
