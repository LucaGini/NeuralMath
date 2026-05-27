import json
import logging
import time
from agents.state import AgentState
from agents.llm_client import call_llm
from typing import Dict, Any

logger = logging.getLogger(__name__)

def protege_node(state: AgentState) -> Dict[str, Any]:
    """
    ProtegeAgent Node. Generates exactly 3 math exercises for a given topic and level,
    complete with Alby's incorrect answer (containing a subtle misconception) and Alby's flawed step-by-step reasoning.
    """
    level = state.get("user_level", "Primary")
    topic = state.get("topic_name", "Algebra")
    area = state.get("topic_area", "Algebra")
    
    session_seed = int(time.time())

    system_instruction = (
        "You are 'ProtegeAgent', a virtual math-student peer who is learning but often makes common mathematical slips.\n"
        "Your goal is to generate exactly 3 math exercises for the given topic and level.\n"
        "However, for EACH exercise, you must write a flawed solution that contains a subtle, typical algebraic or conceptual misconception.\n"
        "You must return ONLY a JSON object with the key 'exercises'. The value of 'exercises' must be a list of objects containing:\n"
        "- 'question': the problem description (LaTeX inside single $)\n"
        "- 'correct_answer': the true, correct math solution string (e.g. '3' or '(x-2)(x-3)')\n"
        "- 'protege_answer': Alby's incorrect, flawed answer containing a specific slip (e.g. '9' or '(x-3)(x-9)')\n"
        "- 'protege_explanation': Alby's step-by-step logic in Spanish. It must sound like an adorable robot kid student who is confident but made a mistake (e.g. '¡Hola! Yo sumé los términos y luego...', showing their exact flawed calculation lines in LaTeX)\n"
        "- 'difficulty_level': 'Fácil', 'Medio', or 'Difícil'\n"
        "- 'order_index': sequential integer starting at 0\n"
        "- 'skill_tags': a list of 1-3 lowercase strings (with underscores, no spaces) identifying specific math skills tested (e.g. ['linear_equations', 'fractions'])\n\n"
        "Ensure the wrong answers and explanations are mathematically plausible (common slips like sign errors, failing to distribute, multiplying instead of adding exponent rules, etc.)."
    )

    prompt = (
        f"Generate 3 Alby-style flawed exercises for the topic '{topic}' in the area of '{area}' at the '{level}' level.\n"
        f"Session Seed: {session_seed}.\n\n"
        "Format the output strictly as a JSON object, e.g.:\n"
        '{\n  "exercises": [\n    {\n      "question": "Simplifica $2(x + 3) - 4$",\n      "correct_answer": "2x + 2",\n      "protege_answer": "2x + 2",\n      "protege_explanation": "¡Hola! Yo distribuí el 2 multiplicándolo por la x y luego por el 3 para obtener $2x + 6$. Luego le resté 4 y me dio $2x + 2$. ¡Creo que es genial!",\n      "difficulty_level": "Fácil",\n      "order_index": 0,\n      "skill_tags": ["algebraic_simplification", "distribution"]\n    },\n    {\n      "question": "Resuelve el sistema de ecuaciones: $x + y = 10$ y $x - y = 2$. Escribe el valor de $x$",\n      "correct_answer": "6",\n      "protege_answer": "4",\n      "protege_explanation": "¡Hola! Yo resté las dos ecuaciones y me dio que $2y = 8$, por lo tanto $y = 4$. Pensé que x también debía ser 4. ¿Es correcto?",\n      "difficulty_level": "Medio",\n      "order_index": 1,\n      "skill_tags": ["system_of_equations"]\n    }\n  ]\n}'
    )

    try:
        raw_response = call_llm(prompt, system_instruction=system_instruction, json_mode=True)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
            
        import re
        protected = cleaned.replace("\\\\", "__DOUBLE_BACKSLASH__")
        escaped = re.sub(r'\\([a-zA-Z])', r'\\\\\1', protected)
        cleaned_json = escaped.replace("__DOUBLE_BACKSLASH__", "\\\\")
        
        parsed = json.loads(cleaned_json)
        exercises = parsed.get("exercises", [])
        return {"exercises": exercises}
    except Exception as e:
        logger.error(f"ProtegeAgent parsing error: {e}. Raw: {raw_response if 'raw_response' in locals() else 'None'}")
        # Dynamic mock fallback for Alby exercises
        fallback_exercises = [
            {
                "question": f"Simplifica la expresión: $3(x + 4) - 5$ en el tema {topic}",
                "correct_answer": "3x + 7",
                "protege_answer": "3x + 9",
                "protege_explanation": "¡Hola! Multipliqué $3 \\times x = 3x$. Pero luego olvidé multiplicar el 3 por el 4, así que dejé el 4 igual: $3x + 4$. Al final le resté 5 para obtener $3x - 1$. ¡Creo que está perfecto!",
                "difficulty_level": "Fácil",
                "order_index": 0,
                "skill_tags": ["algebraic_simplification", "distribution"]
            },
            {
                "question": f"Factoriza la expresión cuadrática: $x^2 - 5x + 6$",
                "correct_answer": "(x-2)(x-3)",
                "protege_answer": "(x-1)(x-6)",
                "protege_explanation": "¡Hola! Busqué dos números que multiplicados dieran 6 y sumados dieran -5. Pensé en -1 y -6 porque $-1 \\times -6 = 6$, pero olvidé que $-1 + (-6) = -7$ y no -5. Así que me quedó $(x-1)(x-6)$!",
                "difficulty_level": "Medio",
                "order_index": 1,
                "skill_tags": ["quadratic_equations", "factoring"]
            }
        ]
        return {"exercises": fallback_exercises}
