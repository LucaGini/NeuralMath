from sqlalchemy import Column, String, Float, Text, DateTime, Integer, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class AgentConfig(Base):
    __tablename__ = "agent_configs"

    agent_key = Column(String(50), primary_key=True)
    system_prompt = Column(Text, nullable=False)
    temperature = Column(Float, nullable=False, default=0.7)
    model_name = Column(String(100), nullable=False, default="gemini-2.0-flash")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class AgentConfigHistory(Base):
    __tablename__ = "agent_config_history"

    id = Column(Integer, primary_key=True, index=True)
    agent_key = Column(String(50), nullable=False)
    system_prompt = Column(Text, nullable=False)
    temperature = Column(Float, nullable=False)
    model_name = Column(String(100), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
