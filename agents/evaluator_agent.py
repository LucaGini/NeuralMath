import json
import logging
from agents.state import AgentState
from agents.llm_client import call_llm
from typing import Dict, Any

logger = logging.getLogger(__name__)

def evaluator_node(state: AgentState) -> Dict[str, Any]:
    """
    EvaluatorAgent Node. Assesses the student's answer to a specific exercise,
    giving a clear, encouraging, and detailed step-by-step mathematical review.
    """
    # This node typically runs in response to a single exercise answer submission.
    # To facilitate this, we pass the current exercise and user answer in the state payload.
    current_session = state.get("session_summary", {})
    exercise_question = current_session.get("current_exercise_question", "")
    correct_answer = current_session.get("current_exercise_correct_answer", "")
    user_answer = current_session.get("current_exercise_user_answer", "")
    
    system_instruction = (
        "You are 'EvaluatorAgent', a highly supportive and analytical math tutor in the NeuralMath platform.\n"
        "Your role is to evaluate a student's answer to a specific math problem.\n"
        "You must return ONLY a JSON object containing:\n"
        "- 'is_correct': a boolean representing if the user's answer is correct.\n"
        "- 'explanation': a supportive, teaching-focused explanation in Spanish.\n\n"
        "RULES FOR THE EXPLANATION:\n"
        "1. NEVER just say 'Incorrecto' or 'Correcto'. Start with encouragement.\n"
        "2. If CORRECT, celebrate their logic, highlight why their step works, and restate the mathematical conclusion using KaTeX ($...$).\n"
        "3. If INCORRECT, show empathy. Pinpoint the likely mistake (e.g. sign error, order of operations, division error). Teach the correct step-by-step resolution clearly using math equations so they learn from it.\n"
        "4. Output strictly valid JSON."
    )

    prompt = (
        f"Exercise Question: {exercise_question}\n"
        f"Expected Correct Answer: {correct_answer}\n"
        f"Student's Submitted Answer: {user_answer}\n\n"
        "Analyze the correctness. If the user's answer matches mathematically (even with slight spacing differences or standard simplifications like fraction formats), mark 'is_correct' as true."
    )

    try:
        raw_response = call_llm(prompt, system_instruction=system_instruction, json_mode=True)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        # Safeguard LaTeX backslashes (e.g. \frac, \times) from JSON parsing collisions (like interpreting \t as tab)
        import re
        protected = cleaned.replace("\\\\", "__DOUBLE_BACKSLASH__")
        escaped = re.sub(r'\\([a-zA-Z])', r'\\\\\1', protected)
        cleaned_json = escaped.replace("__DOUBLE_BACKSLASH__", "\\\\")
        
        parsed = json.loads(cleaned_json)
        return {
            "evaluations": [parsed] # We can merge this or append it in the graph state
        }
    except Exception as e:
        logger.error(f"EvaluatorAgent parsing error: {e}. Raw: {raw_response if 'raw_response' in locals() else 'None'}")
        # Graceful local fallback logic
        from agents.llm_client import get_local_mock_response
        simulated = get_local_mock_response(
            prompt=f"user answer: {user_answer}\ncorrect: {correct_answer}",
            system_instruction="evaluator_agent",
            json_mode=True
        )
        return {
            "evaluations": [json.loads(simulated)]
        }
