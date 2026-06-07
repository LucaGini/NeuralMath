from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.topic import Topic
from app.models.user import User
from app.api.auth import get_current_user
from agents.graph import math_tutor_graph
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/topics", tags=["topics"])

class SubtopicResponse(BaseModel):
    name: str
    description: str

class TopicResponse(BaseModel):
    id: int
    name: str
    area: str
    level: str
    subtopics: Optional[List[SubtopicResponse]] = None

    class Config:
        from_attributes = True

class ExplanationResponse(BaseModel):
    topic_id: int
    topic_name: str
    level: str
    explanation: str

@router.get("", response_model=List[TopicResponse])
def get_topics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns the list of topics. Optionally filters by user's current academic level.
    """
    # Show only active topics for students, but sorting user's level first makes a beautiful UX!
    topics = db.query(Topic).filter(Topic.is_active == True).all()
    # Sort so that current user's level appears first
    sorted_topics = sorted(
        topics, 
        key=lambda x: (0 if x.level.lower() == current_user.level.lower() else 1, x.area)
    )
    return sorted_topics

@router.get("/{topic_id}", response_model=TopicResponse)
def get_topic_by_id(topic_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic

@router.post("/{topic_id}/explain", response_model=ExplanationResponse)
def explain_topic(topic_id: int, subtopic: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Invokes the TopicAgent to generate an in-depth, level-adapted explanation.
    """
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Run the TopicAgent node inside LangGraph
    state_input = {
        "user_level": current_user.level,
        "topic_name": topic.name,
        "topic_area": topic.area,
        "subtopic_name": subtopic,
        "explanation": None,
        "exercises": None,
        "user_answers": None,
        "evaluations": None,
        "session_summary": None,
        "motivation_message": None,
        "target_node": "topic"
    }
    
    try:
        # Run specific node 'topic'
        res = math_tutor_graph.invoke(state_input, {"configurable": {"thread_id": f"topic_{topic_id}_{current_user.id}"}})
        explanation = res.get("explanation", "Lo sentimos, no pudimos generar la explicación en este momento.")
        
        if res.get("error"):
            raise HTTPException(status_code=500, detail=res.get("error"))
            
        return {
            "topic_id": topic.id,
            "topic_name": topic.name,
            "level": current_user.level,
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running TopicAgent: {str(e)}"
        )
