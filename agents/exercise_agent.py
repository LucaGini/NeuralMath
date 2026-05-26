import json
import logging
from agents.state import AgentState
from agents.llm_client import call_llm
from typing import Dict, Any

logger = logging.getLogger(__name__)

def exercise_node(state: AgentState) -> Dict[str, Any]:
    """
    ExerciseAgent Node. Generates 3 to 5 math problems of increasing difficulty,
    adapted to the user's level and math topic. Returns structured JSON.
    """
    level = state.get("user_level", "Primary")
    topic = state.get("topic_name", "Algebra")
    area = state.get("topic_area", "Algebra")
    
    # We can also receive a custom prompt segment about performance if supplied
    perf_history = state.get("session_summary", {}).get("recent_performance", "No historical sessions yet.")

    system_instruction = (
        "You are 'ExerciseAgent', a specialized math problem generator in the NeuralMath platform.\n"
        "Your goal is to generate exactly 3 to 5 exercises of increasing difficulty for the given topic and level.\n"
        "You must return ONLY a JSON object with the key 'exercises'. The value of 'exercises' must be a list of objects containing:\n"
        "- 'question': the problem description (include LaTeX math formulas inside single $ e.g. $x + 2 = 5$ for nice display)\n"
        "- 'correct_answer': a brief, single correct answer string (e.g., '3' or '(x-2)(x-3)' or '1/2')\n"
        "- 'difficulty_level': 'Fácil', 'Medio', or 'Difícil'\n"
        "- 'order_index': sequential integer starting at 0\n\n"
        "Ensure the questions escalate in complexity. Do not include any explanation or markdown wrappers outside of the JSON block."
    )

    prompt = (
        f"Generate exercises for the topic '{topic}' in the area of '{area}' at the '{level}' level.\n"
        f"The student's performance history is: '{perf_history}'. Adjust the average starting difficulty accordingly.\n"
        "Format the output strictly as a JSON object, e.g.:\n"
        '{\n  "exercises": [\n    {"question": "Resuelve $x + 2 = 5$", "correct_answer": "3", "difficulty_level": "Fácil", "order_index": 0},\n    ...\n  ]\n}'
    )

    try:
        raw_response = call_llm(prompt, system_instruction=system_instruction, json_mode=True)
        # Parse JSON to ensure it is valid
        # Strip any markdown backticks if returned (sometimes LLMs wrap JSON in ```json ... ```)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        parsed = json.loads(cleaned)
        exercises = parsed.get("exercises", [])
        return {"exercises": exercises}
    except Exception as e:
        logger.error(f"ExerciseAgent parsing error: {e}. Raw: {raw_response if 'raw_response' in locals() else 'None'}")
        # Fall back gracefully to a mock set
        from agents.llm_client import get_mock_exercises
        return {"exercises": get_mock_exercises(area, level)}
