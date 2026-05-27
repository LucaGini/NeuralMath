from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.topic_agent import topic_node
from agents.exercise_agent import exercise_node
from agents.evaluator_agent import evaluator_node
from agents.motivator_agent import motivator_node
from agents.hint_agent import hint_node
from agents.protege_agent import protege_node

def route_entry(state: AgentState) -> str:
    """
    Looks up target_node in state and routes directly to the requested agent node.
    """
    target = state.get("target_node")
    if target in ["topic", "exercise", "evaluator", "motivator", "hint", "protege"]:
        if target == "hint":
            return "hint_agent"
        return target
    return "topic"

# Define standard StateGraph
workflow = StateGraph(AgentState)

# Add the specialized nodes
workflow.add_node("topic", topic_node)
workflow.add_node("exercise", exercise_node)
workflow.add_node("evaluator", evaluator_node)
workflow.add_node("motivator", motivator_node)
workflow.add_node("hint_agent", hint_node)
workflow.add_node("protege", protege_node)

# Configure transitions. 
# By using a conditional entry point, all nodes are fully reachable.
# They execute independently and immediately return to END, preventing chaining side effects!
workflow.set_conditional_entry_point(
    route_entry,
    {
        "topic": "topic",
        "exercise": "exercise",
        "evaluator": "evaluator",
        "motivator": "motivator",
        "hint_agent": "hint_agent",
        "protege": "protege"
    }
)

workflow.add_edge("topic", END)
workflow.add_edge("exercise", END)
workflow.add_edge("evaluator", END)
workflow.add_edge("motivator", END)
workflow.add_edge("hint_agent", END)
workflow.add_edge("protege", END)

# Compile the LangGraph engine
math_tutor_graph = workflow.compile()
