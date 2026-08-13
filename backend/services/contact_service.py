from typing import List
from sqlalchemy.orm import Session as DBSession
from fastapi import HTTPException, status
from backend.models import Contact, User, Conversation, ConversationMember

class ContactService:

    @staticmethod
    def get_contacts(db: DBSession, user_id: str) -> List[Contact]:
        # 1. Fetch direct conversations user belongs to
        user_conv_ids = db.query(ConversationMember.conversation_id).filter(
            ConversationMember.user_id == user_id
        ).subquery()

        direct_conv_ids = db.query(Conversation.id).filter(
            Conversation.id.in_(user_conv_ids),
            Conversation.type == "DIRECT"
        ).all()
        direct_ids = [c[0] for c in direct_conv_ids]

        if direct_ids:
            # Find peer member user_ids in these direct conversations
            peers = db.query(ConversationMember.user_id).filter(
                ConversationMember.conversation_id.in_(direct_ids),
                ConversationMember.user_id != user_id
            ).all()

            existing_contact_ids = set(
                c[0] for c in db.query(Contact.contact_user_id).filter(Contact.user_id == user_id).all()
            )

            new_added = False
            for p in peers:
                peer_id = p[0]
                if peer_id not in existing_contact_ids and peer_id != user_id:
                    new_contact = Contact(user_id=user_id, contact_user_id=peer_id)
                    db.add(new_contact)
                    existing_contact_ids.add(peer_id)
                    new_added = True

            if new_added:
                db.commit()

        return db.query(Contact).filter(Contact.user_id == user_id).all()

    @staticmethod
    def add_contact(db: DBSession, user_id: str, contact_user_id: str) -> Contact:
        if user_id == contact_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add yourself as a contact")

        target = db.query(User).filter(User.id == contact_user_id).first()
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")

        existing = db.query(Contact).filter(
            Contact.user_id == user_id,
            Contact.contact_user_id == contact_user_id
        ).first()

        if existing:
            return existing

        contact = Contact(user_id=user_id, contact_user_id=contact_user_id)
        db.add(contact)
        db.commit()
        db.refresh(contact)
        return contact

    @staticmethod
    def remove_contact(db: DBSession, user_id: str, contact_user_id: str):
        db.query(Contact).filter(
            Contact.user_id == user_id,
            Contact.contact_user_id == contact_user_id
        ).delete()
        db.commit()
