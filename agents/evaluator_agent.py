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
    Supports both standard evaluations and AI Protégé ('Teach-Back') reviews.
    """
    current_session = state.get("session_summary", {})
    exercise_question = current_session.get("current_exercise_question", "")
    correct_answer = current_session.get("current_exercise_correct_answer", "")
    user_answer = current_session.get("current_exercise_user_answer", "")
    
    session_type = current_session.get("session_type", "practice")
    is_teach_back = session_type == "teach_back"
    protege_answer = current_session.get("current_exercise_protege_answer", "")
    protege_explanation = current_session.get("current_exercise_protege_explanation", "")

    if is_teach_back:
        system_instruction = (
            "You are 'EvaluatorAgent', an expert math tutor and highly rigorous answer validator in the NeuralMath platform.\n"
            "Your role is to evaluate a student's tutoring explanation (student review) correcting a virtual classmate, 'Alby', who made a math error.\n"
            "You must return ONLY a JSON object containing:\n"
            "- 'is_correct': a boolean. Set to True if the student correctly identified Alby's mistake and provided the correct solution, or if their tutoring explanation is mathematically sound and helps Alby solve it correctly. Set to False if the student's math is wrong, or if they failed to identify the error.\n"
            "- 'explanation': a supportive, teaching-focused response in Spanish. Praise their teaching and socratic skills, reinforce why their logic works, and show them how to be an even better tutor. Use LaTeX math formulas inside single $.\n"
            "- 'error_type': always set to null under teach_back mode.\n"
            "- 'misconception': always set to null under teach_back mode.\n\n"
            "RULES FOR TEACH-BACK RIGOR:\n"
            "1. The student is the teacher here. They are reviewing Alby's flawed calculations.\n"
            "2. Ensure the student's final mathematical statement/answer is correct for the original 'Exercise Question'.\n"
            "3. If they are correct, celebrate Alby's learning: e.g. '¡Excelente explicación! Alby te agradece mucho. Ahora entiende que...'\n"
            "4. DATABASE DISCREPANCY OVERRIDE (CRITICAL): Sometimes, the 'True Correct Answer' stored in the database has a generation typo or is mathematically incorrect for the 'Exercise Question'. You must independently solve the 'Exercise Question' step-by-step first. If you find that the 'True Correct Answer' passed from the database is mathematically incorrect for the 'Exercise Question', do NOT mention it or use it. Instead, use your own calculated correct solution as the absolute source of truth to evaluate the student's review, and make sure your explanation never cites the incorrect database value."
        )

        prompt = (
            f"Exercise Question: {exercise_question}\n"
            f"True Correct Answer in DB: {correct_answer}\n"
            f"Alby's Flawed Answer: {protege_answer}\n"
            f"Alby's Flawed Explanation: {protege_explanation}\n"
            f"Student's Submitted Tutoring Correction: {user_answer}\n\n"
            "Please perform the following verification steps:\n"
            "1. Independently solve the 'Exercise Question' step-by-step first.\n"
            "2. Check if the 'True Correct Answer in DB' is mathematically correct. If it has a typo, ignore it and use your own calculated solution as the only source of truth.\n"
            "3. Review Alby's error.\n"
            "4. Assess the student's correction. Did they correctly identify Alby's mistake and explain the correct resolution mathematically?\n"
            "Analyze and return a JSON object with 'is_correct' and 'explanation'."
        )
    else:
        system_instruction = (
            "You are 'EvaluatorAgent', an expert math tutor and highly rigorous answer validator in the NeuralMath platform.\n"
            "Your role is to strictly evaluate a student's answer to a specific math problem.\n"
            "You must return ONLY a JSON object containing:\n"
            "- 'is_correct': a boolean representing if the user's answer is correct.\n"
            "- 'explanation': a supportive, teaching-focused explanation in Spanish.\n"
            "- 'error_type': if is_correct is false, classify the mistake as one of: "
            "'sign_error', 'distribution_error', 'order_of_operations', 'exponent_rule', "
            "'cancellation_error', 'arithmetic_slip', 'conceptual_error', 'other'. If is_correct is true, set to null.\n"
            "- 'misconception': if is_correct is false, write ONE brief sentence in Spanish identifying the specific wrong belief or action. E.g. 'Olvidaste cambiar el signo de la desigualdad al dividir por un número negativo.' If correct, set to null.\n\n"
            "RULES FOR MATHEMATICAL RIGOR (CRITICAL):\n"
            "1. NEVER be lenient with incorrect math values or expressions. If the expected correct answer is '(x-3)(x-4)' and the student enters '(x-3)(x-9)', this is absolutely INCORRECT because their product expands to $x^2 - 12x + 27$, not $x^2 - 7x + 12$. You MUST mark it is_correct = false.\n"
            "2. Do NOT blindly agree with the student. You must physically calculate and expand both the Expected Correct Answer and the Student's Submitted Answer to verify if they are mathematically identical or equivalent.\n"
            "3. Support equivalence in representations (e.g. order of factors like '(x-3)(x-4)' vs '(x-4)(x-3)', or decimals like '0.5' vs '1/2'). But if the numerical or algebraic content is different, it is wrong.\n"
            "4. DATABASE DISCREPANCY OVERRIDE (CRITICAL): Sometimes, the 'Expected Correct Answer' stored in the database has a generation typo or is mathematically incorrect for the 'Exercise Question'. You must independently solve the 'Exercise Question'. If the student's answer is mathematically correct and perfectly solves/satisfies the system of equations or algebraic question, you MUST override the incorrect database key and mark 'is_correct' as True. Celebrate their correctness and do not penalize them for system typos.\n\n"
            "RULES FOR THE EXPLANATION:\n"
            "1. NEVER just say 'Incorrecto' or 'Correcto'. Start with encouragement.\n"
            "2. If CORRECT, celebrate their logic, highlight why their step works, and restate the mathematical conclusion using KaTeX ($...$).\n"
            "3. If INCORRECT, show empathy. Teach the correct step-by-step resolution clearly using math equations so they learn from it. Point out their specific algebraic error (e.g., expanding $(x-3)(x-9)$ gives $x^2 - 12x + 27$, which does not equal $x^2 - 7x + 12$)."
        )

        prompt = (
            f"Exercise Question: {exercise_question}\n"
            f"Expected Correct Answer in DB: {correct_answer}\n"
            f"Student's Submitted Answer: {user_answer}\n\n"
            "Please perform the following verification steps:\n"
            "1. Independently solve the 'Exercise Question' step-by-step.\n"
            "2. Check if the 'Student's Submitted Answer' is mathematically correct and solves the question.\n"
            "3. Check if the 'Student's Submitted Answer' is equivalent to the 'Expected Correct Answer in DB'.\n"
            "4. If the student's answer is mathematically correct for the question (even if the DB has a different/incorrect answer), mark 'is_correct' as true. If it is mathematically incorrect, mark 'is_correct' as false and explain the error step-by-step."
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
