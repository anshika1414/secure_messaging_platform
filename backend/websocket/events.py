from typing import Dict, Any
from sqlalchemy.orm import Session as DBSession
from backend.websocket.manager import manager
from backend.services.message_service import MessageService
from backend.models import ConversationMember, User, MessageReceipt

async def handle_send_message(user_id: str, data: Dict[str, Any], db: DBSession):
    conversation_id = data.get("conversation_id")
    content = data.get("content", "").strip()
    temp_id = data.get("temp_id")

    if not conversation_id or not content:
        return

    msg = MessageService.create_message(db, conversation_id, user_id, content)

    # Fetch conversation member user IDs
    members = db.query(ConversationMember.user_id).filter(
        ConversationMember.user_id != user_id,
        ConversationMember.conversation_id == conversation_id
    ).all()
    member_user_ids = [m[0] for m in members]

    # Format message payload for WebSocket
    msg_payload = {
        "event": "NEW_MESSAGE",
        "data": {
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "sender": {
                "id": msg.sender.id,
                "username": msg.sender.username,
                "display_name": msg.sender.display_name,
                "avatar_url": msg.sender.avatar_url,
            } if msg.sender else None,
            "content": msg.content,
            "message_type": msg.message_type,
            "created_at": msg.created_at.isoformat(),
            "temp_id": temp_id,
            "receipts": [
                {
                    "user_id": r.user_id,
                    "status": r.status,
                    "delivered_at": r.delivered_at.isoformat() if r.delivered_at else None,
                    "read_at": r.read_at.isoformat() if r.read_at else None,
                } for r in msg.receipts
            ]
        }
    }

    # Send to sender for ACK
    await manager.send_to_user(user_id, msg_payload)

    # Broadcast to recipient members
    all_recipients = member_user_ids
    await manager.broadcast_to_users(all_recipients, msg_payload)

    # Auto-mark delivered for online recipients
    for recipient_id in member_user_ids:
        if manager.is_user_online(recipient_id):
            receipt = MessageService.update_receipt(db, msg.id, recipient_id, "DELIVERED")
            if receipt:
                receipt_payload = {
                    "event": "RECEIPT_UPDATE",
                    "data": {
                        "message_id": msg.id,
                        "conversation_id": conversation_id,
                        "user_id": recipient_id,
                        "status": "DELIVERED",
                        "delivered_at": receipt.delivered_at.isoformat() if receipt.delivered_at else None
                    }
                }
                await manager.send_to_user(user_id, receipt_payload)

async def handle_typing_event(user_id: str, data: Dict[str, Any], is_typing: bool, db: DBSession):
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return

    members = db.query(ConversationMember.user_id).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id != user_id
    ).all()
    recipient_ids = [m[0] for m in members]

    payload = {
        "event": "USER_TYPING",
        "data": {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "username": user.username,
            "display_name": user.display_name,
            "is_typing": is_typing
        }
    }

    await manager.broadcast_to_users(recipient_ids, payload)

async def handle_mark_read(user_id: str, data: Dict[str, Any], db: DBSession):
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return

    success = MessageService.mark_as_read(db, conversation_id, user_id)
    if success:
        members = db.query(ConversationMember.user_id).filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id != user_id
        ).all()
        recipient_ids = [m[0] for m in members]

        payload = {
            "event": "RECEIPT_UPDATE",
            "data": {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "status": "READ"
            }
        }
        await manager.broadcast_to_users(recipient_ids, payload)
