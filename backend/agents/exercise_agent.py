import json
import logging
import time
from agents.state import AgentState
from agents.llm_client import call_llm
from typing import Dict, Any

logger = logging.getLogger(__name__)

def exercise_node(state: AgentState) -> Dict[str, Any]:
    """
    ExerciseAgent Node. Generates adapted math problems of increasing difficulty,
    adapted to the user's level and math topic. Returns structured JSON.
    """
    level = state.get("user_level", "Primary")
    topic = state.get("topic_name", "Algebra")
    area = state.get("topic_area", "Algebra")
    subtopic = state.get("subtopic_name", "")
    theme = state.get("theme", "standard")
    exercise_count = state.get("exercise_count", 5) or 5
    
    # We can also receive a custom prompt segment about performance if supplied
    perf_history = state.get("session_summary", {}).get("recent_performance", "No historical sessions yet.")
    
    # Generate unique session seed using current unix timestamp to prevent LLM or API caching
    session_seed = int(time.time())

    # Load configuration dynamically from DB
    from agents.llm_client import get_agent_config
    config = get_agent_config("exercise")
    if config:
        system_instruction = config["system_prompt"].replace("{exercise_count}", str(exercise_count))
        temperature = config["temperature"]
        model_name = config["model_name"]
    else:
        system_instruction = (
            "You are 'ExerciseAgent', a specialized math problem generator in the NeuralMath platform.\n"
            f"Your goal is to generate exactly {exercise_count} exercises of increasing difficulty for the given topic and level.\n"
            "You must return ONLY a JSON object with the key 'exercises'. The value of 'exercises' must be a list of objects containing:\n"
            "- 'question': the problem description (include LaTeX math formulas inside single $ e.g. $x + 2 = 5$ for nice display. IMPORTANT: You MUST write double backslashes in JSON strings for all LaTeX math commands, e.g., '\\\\int', '\\\\cdot', '\\\\frac', '\\\\times', to ensure they parse correctly without losing the backslash.)\n"
            "- 'correct_answer': a brief, single correct answer string (e.g., '3' or '(x-2)(x-3)' or '1/2')\n"
            "- 'difficulty_level': 'Fácil', 'Medio', or 'Difícil'\n"
            "- 'order_index': sequential integer starting at 0\n"
            "- 'exercise_type': one of 'free_text', 'multiple_choice', or 'fill_blank'\n"
            "- 'choices': a list of exactly 4 strings IF exercise_type is 'multiple_choice', else null. One of the choices must exactly match 'correct_answer'; the other three must be plausible wrong answers (common misconceptions)\n"
            "- 'skill_tags': a list of 1-3 lowercase strings (with underscores, no spaces) identifying specific math skills tested (e.g. ['linear_equations', 'fractions'])\n\n"
            "NARRATIVE QUEST THEMES (CRITICAL):\n"
            "If a specific narrative 'theme' is provided (other than 'standard', such as 'space' for Space Odyssey, 'fantasy' for Fantasy Realm, 'sports' for Sports Championship):\n"
            f"1. You MUST generate a continuous, immersive narrative storyline across the {exercise_count} exercises. Each exercise represents a step in their quest/mission.\n"
            "2. For each exercise, write a compelling, LaTeX-safe story paragraph in Spanish preceding the mathematical problem inside the 'question' field. The math problem must be the logical challenge required to solve that plot point (e.g. calculating matrix determinant to avoid an asteroid, solving a quadratic equation to cast a fire spell, calculating percentages to score a perfect goal).\n"
            "3. Keep the tone exciting, engaging, and age-appropriate for the student's level.\n\n"
            "EXERCISE TYPE SELECTION RULES:\n"
            "- For 'Primary' level: prefer 'multiple_choice' (60%) and 'fill_blank' (40%). No 'free_text'.\n"
            "- For 'Secondary' level: mix all three types evenly (33% each).\n"
            "- For 'University' level: prefer 'free_text' (70%), use 'fill_blank' (20%) and 'multiple_choice' (10%).\n\n"
            "EXERCISE DESIGN RULES:\n"
            "- For 'fill_blank': write the question with '___' marking the missing value (e.g. 'Si $2x + 3 = 11$, entonces $x = ___$')\n"
            "- For 'multiple_choice': do not put any labels (like A, B, C, D) inside choices. The choices should just be the mathematical values or expressions.\n\n"
            "Ensure the questions escalate in complexity. Do not include any explanation or markdown wrappers outside of the JSON block."
        )
        temperature = 0.7
        model_name = None
 
    if subtopic:
        prompt_topic_desc = f"specifically for the subtopic '{subtopic}' of the main topic '{topic}' in the area of '{area}'"
    else:
        prompt_topic_desc = f"for the topic '{topic}' in the area of '{area}'"
 
    prompt = (
        f"Generate exactly {exercise_count} unique exercises {prompt_topic_desc} at the '{level}' level.\n"
        f"Narrative Quest Theme: '{theme}'. If theme is NOT 'standard', wrap all questions in a continuous, exciting Spanish storyline matching this theme.\n"
        f"The student's performance history is: '{perf_history}'. Adjust the average starting difficulty accordingly.\n"
        f"Session Seed: {session_seed}. Ensure questions are randomized and different from previous sessions.\n"
        f"CRITICAL BOUNDARY INSTRUCTIONS:\n"
        f"- You MUST confine ALL exercises strictly to the mathematical scope of the topic '{topic}' and subtopic '{subtopic}' (if provided). Do NOT introduce concepts, operations, or variables from other topics, even if loosely related.\n"
        f"- Examples of violations to avoid: generating equations if the topic is purely arithmetic; introducing derivatives if the topic is only limits; mixing matrix operations into a probability topic; using abstract variables when the topic is introductory arithmetic at Primary level.\n"
        f"- If the level is 'Primary', keep all exercises free of abstract symbols, algebraic variables, and advanced notation unless the topic itself explicitly requires them.\n"
        f"- Never reuse the exact example equation provided below.\n\n"
        "Format the output strictly as a JSON object, e.g.:\n"
        '{\n  "exercises": [\n    {\n      "question": "Resuelve $x + 2 = 5$",\n      "correct_answer": "3",\n      "difficulty_level": "Fácil",\n      "order_index": 0,\n      "exercise_type": "multiple_choice",\n      "choices": ["1", "3", "5", "7"],\n      "skill_tags": ["linear_equations", "basic_arithmetic"]\n    },\n    ...\n  ]\n}'
    )
 
    try:
        raw_response = call_llm(prompt, system_instruction=system_instruction, json_mode=True, temperature=temperature, model_name=model_name)
        # Parse JSON to ensure it is valid
        # Strip any markdown backticks if returned (sometimes LLMs wrap JSON in ```json ... ```)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        # Safeguard LaTeX backslashes (e.g., \times, \div) from JSON parsing collisions (like interpreting \t as tab)
        import re
        protected = cleaned.replace("\\\\", "__DOUBLE_BACKSLASH__")
        escaped = re.sub(r'\\([a-zA-Z])', r'\\\\\1', protected)
        cleaned_json = escaped.replace("__DOUBLE_BACKSLASH__", "\\\\")
        
        parsed = json.loads(cleaned_json)
        exercises = parsed.get("exercises", [])
        return {"exercises": exercises}
    except Exception as e:
        logger.error(f"ExerciseAgent parsing error: {e}. Raw: {raw_response if 'raw_response' in locals() else 'None'}")
        # Fall back gracefully to a dynamic mock set, passing the exact topic name
        from agents.llm_client import get_mock_exercises
        return {"exercises": get_mock_exercises(topic, level, area)}


