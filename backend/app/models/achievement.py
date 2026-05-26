from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_key = Column(String, nullable=False)  # e.g., perfect_score, streak_3, xp_500
    title_es = Column(String, nullable=False)
    title_en = Column(String, nullable=False)
    desc_es = Column(String, nullable=False)
    desc_en = Column(String, nullable=False)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="achievements")
