from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, PrimaryKeyConstraint, Index
from sqlalchemy.orm import relationship
from backend.database.database import Base

class MessageReceipt(Base):
    __tablename__ = "message_receipts"

    message_id = Column(String, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="SENT")  # SENT, DELIVERED, READ
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("message_id", "user_id"),
        Index("idx_msg_receipts_msg_user", "message_id", "user_id"),
    )

    message = relationship("Message", back_populates="receipts")
    user = relationship("User", back_populates="receipts")
