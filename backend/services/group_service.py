import asyncio
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session as DBSession, joinedload
from fastapi import HTTPException, status
from backend.models import Group, Conversation, ConversationMember, User, Message
from backend.websocket.manager import manager

class GroupService:

    @staticmethod
    def _broadcast_system_message(conversation_id: str, sys_msg: Message, recipient_user_ids: List[str]):
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        msg_payload = {
            "event": "NEW_MESSAGE",
            "data": {
                "id": sys_msg.id,
                "conversation_id": sys_msg.conversation_id,
                "sender_id": sys_msg.sender_id,
                "sender": {
                    "id": sys_msg.sender.id,
                    "username": sys_msg.sender.username,
                    "display_name": sys_msg.sender.display_name,
                    "avatar_url": sys_msg.sender.avatar_url,
                } if sys_msg.sender else None,
                "content": sys_msg.content,
                "message_type": sys_msg.message_type,
                "created_at": sys_msg.created_at.isoformat(),
                "receipts": []
            }
        }

        if loop and loop.is_running():
            loop.create_task(manager.broadcast_to_users(recipient_user_ids, msg_payload))

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

        # Broadcast system message to all members
        all_member_ids = list({creator_id}.union(unique_member_ids))
        GroupService._broadcast_system_message(conv.id, sys_msg, all_member_ids)

        return group

    @staticmethod
    def add_member(db: DBSession, group_id: str, current_user_id: str, target_user_id: str, role: str = "MEMBER") -> ConversationMember:
        group = db.query(Group).filter(
            (Group.id == group_id) | (Group.conversation_id == group_id)
        ).first()

        if not group:
            conv = db.query(Conversation).filter(Conversation.id == group_id, Conversation.type == "GROUP").first()
            if conv:
                group = db.query(Group).filter(Group.conversation_id == conv.id).first()

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
            content=f"{admin_user.display_name if admin_user else 'Admin'} added {target_user.display_name} to group",
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

        # Broadcast WS system message to existing members and target_user
        members = db.query(ConversationMember.user_id).filter(
            ConversationMember.conversation_id == group.conversation_id
        ).all()
        recipient_user_ids = [m[0] for m in members]
        GroupService._broadcast_system_message(group.conversation_id, sys_msg, recipient_user_ids)

        return new_member

    @staticmethod
    def remove_member(db: DBSession, group_id: str, current_user_id: str, target_user_id: str):
        group = db.query(Group).filter(
            (Group.id == group_id) | (Group.conversation_id == group_id)
        ).first()

        if not group:
            conv = db.query(Conversation).filter(Conversation.id == group_id, Conversation.type == "GROUP").first()
            if conv:
                group = db.query(Group).filter(Group.conversation_id == conv.id).first()

        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

        # Verify target is actually a member
        target_membership = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == group.conversation_id,
            ConversationMember.user_id == target_user_id
        ).first()
        if not target_membership:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user is not a member of this group")

        # Allow user to remove self OR admin to remove others
        if current_user_id != target_user_id:
            admin_check = db.query(ConversationMember).filter(
                ConversationMember.conversation_id == group.conversation_id,
                ConversationMember.user_id == current_user_id,
                ConversationMember.role == "ADMIN"
            ).first()

            if not admin_check:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only group admins can remove members")

        # Fetch member user IDs before deletion so we can notify everyone including removed user
        existing_members = db.query(ConversationMember.user_id).filter(
            ConversationMember.conversation_id == group.conversation_id
        ).all()
        all_recipient_ids = [m[0] for m in existing_members]

        db.delete(target_membership)

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

        # Broadcast WS system message to remaining members and removed user
        GroupService._broadcast_system_message(group.conversation_id, sys_msg, all_recipient_ids)

