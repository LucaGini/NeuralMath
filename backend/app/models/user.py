from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    level = Column(String, default="Primary", nullable=False)  # Primary / Secondary / University
    xp_total = Column(Integer, default=0, nullable=False)
    streak_days = Column(Integer, default=0, nullable=False)
    avatar_id = Column(String, default="default_student", nullable=False)
    alby_xp = Column(Integer, default=0, nullable=False)
    last_active_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")

