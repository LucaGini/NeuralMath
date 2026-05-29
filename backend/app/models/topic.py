from sqlalchemy import Column, Integer, String, JSON
from app.core.database import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    area = Column(String, nullable=False)  # Arithmetic, Algebra, Geometry, Trigonometry, Calculus, Statistics
    level = Column(String, nullable=False) # Primary / Secondary / University
    subtopics = Column(JSON, nullable=True)
