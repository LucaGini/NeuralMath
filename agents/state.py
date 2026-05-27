from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict

class AgentState(TypedDict):
    user_level: str                 # Primary, Secondary, University
    topic_name: str
    topic_area: str
    explanation: Optional[str]
    exercises: Optional[List[Dict[str, Any]]]
    user_answers: Optional[List[str]]
    evaluations: Optional[List[Dict[str, Any]]]
    session_summary: Optional[Dict[str, Any]]
    motivation_message: Optional[str]
    error: Optional[str]
    target_node: Optional[str]
    hint: Optional[str]
    theme: Optional[str]
    session_type: Optional[str]
