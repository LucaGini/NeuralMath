from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    correct_answer = Column(String, nullable=False)
    user_answer = Column(String, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    evaluation_explanation = Column(Text, nullable=True)
    difficulty_level = Column(String, nullable=True)
    order_index = Column(Integer, nullable=False)
    
    # New Columns added in Roadmap
    exercise_type = Column(String, default="free_text", nullable=False)
    choices = Column(JSON, nullable=True)
    error_type = Column(String, nullable=True)
    misconception = Column(Text, nullable=True)
    hint_level_used = Column(Integer, default=0, nullable=False)
    skill_tags = Column(JSON, nullable=True)
    time_to_answer_ms = Column(Integer, nullable=True)
    protege_answer = Column(String, nullable=True)
    protege_explanation = Column(Text, nullable=True)
    student_review = Column(Text, nullable=True)

    # Relationships
    session = relationship("Session", back_populates="exercises")

