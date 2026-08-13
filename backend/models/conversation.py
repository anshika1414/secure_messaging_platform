import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, PrimaryKeyConstraint, Index
from sqlalchemy.orm import relationship
from backend.database.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String, nullable=False)  # DIRECT, GROUP
    name = Column(String, nullable=True)
    last_message_id = Column(String, ForeignKey("messages.id", ondelete="SET NULL", use_alter=True, name="fk_conversations_last_message_id"), nullable=True)
    last_activity_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    members = relationship("ConversationMember", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", foreign_keys="Message.conversation_id", cascade="all, delete-orphan")
    group_meta = relationship("Group", back_populates="conversation", uselist=False, cascade="all, delete-orphan")
    last_message = relationship("Message", foreign_keys=[last_message_id], post_update=True)


class ConversationMember(Base):
    __tablename__ = "conversation_members"

    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, default="MEMBER")  # ADMIN, MEMBER
    last_read_message_id = Column(String, ForeignKey("messages.id", ondelete="SET NULL", use_alter=True, name="fk_conv_members_last_read_msg"), nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        PrimaryKeyConstraint("conversation_id", "user_id"),
        Index("idx_conv_members_user_conv", "user_id", "conversation_id"),
        Index("idx_conv_members_conv_user", "conversation_id", "user_id"),
    )

    conversation = relationship("Conversation", back_populates="members")
    user = relationship("User", back_populates="memberships")
