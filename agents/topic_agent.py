from agents.state import AgentState
from agents.llm_client import call_llm
from typing import Dict, Any

def topic_node(state: AgentState) -> Dict[str, Any]:
    """
    TopicAgent Node. Generates clear, pedagogical math explanations
    based on the user's educational level and topic name.
    """
    level = state.get("user_level", "Primary")
    topic = state.get("topic_name", "Algebra")
    area = state.get("topic_area", "Algebra")
    
    system_instruction = (
        "You are 'TopicAgent', an elite mathematics teacher in the NeuralMath platform.\n"
        "Your mission is to write beautiful, engaging math explanations in Spanish (with English toggles support, but primarily Spanish).\n"
        "You MUST adapt your tone, language, and complexity to the student's education level:\n"
        "- Primary: Use child-friendly analogies, real-world objects (candies, toys), and very simple, illustrative formula blocks.\n"
        "- Secondary: Use teenage-relatable context, moderate algebraic formulas, standard LaTeX blocks ($...$ or $$...$$), and historical stories or game examples.\n"
        "- University: Use formal math rigor, abstract definitions, theorem proofs or structural theories, and real-world industrial or computer science applications (e.g. PageRank, cryptography).\n"
        "Always use rich LaTeX formatting inside $$ and $ to display formulas nicely. Avoid generic styling."
    )
    
    prompt = (
        f"Explain the topic '{topic}' in the area of '{area}' for a student at the '{level}' level.\n"
        "Keep it highly organized with headers, markdown, and KaTeX equation blocks.\n"
        "Include a clear 'La Gran Analogía' or 'Aplicación Real' section to anchor the intuition."
    )
    
    try:
        explanation = call_llm(prompt, system_instruction=system_instruction)
        return {"explanation": explanation}
    except Exception as e:
        return {"error": f"TopicAgent failed: {str(e)}"}
