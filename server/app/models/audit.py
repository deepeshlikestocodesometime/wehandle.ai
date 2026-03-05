from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB

from .base import BaseModel


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    user_id = Column(ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    metadata = Column(JSONB, nullable=True)

