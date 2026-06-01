import json
import logging
from agents.state import AgentState
from agents.llm_client import call_llm
from typing import Dict, Any

logger = logging.getLogger(__name__)

def hint_node(state: AgentState) -> Dict[str, Any]:
    """
    HintAgent Node. Returns a Socratic hint at the requested escalation level (1-4).
    """
    summary = state.get("session_summary", {})
    question = summary.get("current_exercise_question", "")
    correct_answer = summary.get("current_exercise_correct_answer", "")
    hint_level = summary.get("hint_level", 1)

    level_instructions = {
        1: "Give a very vague conceptual nudge. Do NOT mention the answer or any numbers. Max 1 sentence.",
        2: "Point to the relevant mathematical rule or concept by name. Still no numbers. Max 2 sentences.",
        3: "Show the first concrete step of the solution using LaTeX. Do not complete it.",
        4: "Show all steps except the final numerical answer. The student must finish the last step.",
    }

    system_instruction = (
        "You are 'HintAgent', a Socratic math tutor in the NeuralMath platform.\n"
        f"Your goal is to provide a helpful hint for the exercise at level {hint_level}.\n"
        f"Level {hint_level} Hint Instruction: {level_instructions.get(hint_level, level_instructions[1])}\n"
        "RULES:\n"
        "1. NEVER reveal the exact final answer.\n"
        "2. Keep the explanation brief, supportive, and focused on self-discovery.\n"
        "3. Respond in Spanish.\n"
        "4. Return ONLY a JSON object: {'hint': 'your hint text here'}"
    )

    prompt = (
        f"Exercise Question: {question}\n"
        f"Expected Correct Answer: {correct_answer}\n"
        f"Requested Hint Level: {hint_level}\n\n"
        "Generate a helpful, level-appropriate hint in Spanish."
    )

    try:
        raw_response = call_llm(prompt, system_instruction=system_instruction, json_mode=True)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
            
        # Safeguard LaTeX backslashes from JSON parsing collisions
        import re
        protected = cleaned.replace("\\\\", "__DOUBLE_BACKSLASH__")
        escaped = re.sub(r'\\([a-zA-Z])', r'\\\\\1', protected)
        cleaned_json = escaped.replace("__DOUBLE_BACKSLASH__", "\\\\")
        
        parsed = json.loads(cleaned_json)
        return {"hint": parsed.get("hint", "")}
    except Exception as e:
        logger.error(f"HintAgent parsing error: {e}. Raw: {raw_response if 'raw_response' in locals() else 'None'}")
        return {"hint": "Intenta revisar los conceptos básicos de este problema para encontrar el primer paso."}
