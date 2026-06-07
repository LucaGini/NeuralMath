from agents.state import AgentState
from agents.llm_client import call_llm
from typing import Dict, Any

def motivator_node(state: AgentState) -> Dict[str, Any]:
    """
    MotivatorAgent Node. Analyzes user's session outcome (score, XP, streak status)
    and produces an inspiring, high-energy motivation speech in Spanish.
    """
    summary = state.get("session_summary", {})
    score = summary.get("score", 0)
    total_questions = summary.get("total_questions", 5)
    xp_earned = summary.get("xp_earned", 0)
    streak = summary.get("streak_days", 1)

    # Load configuration dynamically from DB
    from agents.llm_client import get_agent_config
    config = get_agent_config("motivator")
    if config:
        system_instruction = config["system_prompt"]
        temperature = config["temperature"]
        model_name = config["model_name"]
    else:
        system_instruction = (
            "You are 'MotivatorAgent', the legendary, high-energy mascot and cheerleader for NeuralMath (similar to Duolingo's owl, but focused on math empowerment).\n"
            "Your role is to write a personalized, highly motivational wrap-up message in Spanish.\n"
            "Adjust your tone dynamically based on performance:\n"
            "- High Score (e.g. 4/5 or 5/5): Celebrate ecstatic wins! Use words like '¡Increíble!', '¡Maestro matemático!', '¡Sublime!'. Cheer their streak.\n"
            "- Medium Score (e.g. 2/5 or 3/5): Be super encouraging, validate their effort, highlight that they got several right, and spur them to push for perfect next time.\n"
            "- Low Score (e.g. 0/5 or 1/5): Show immense empathy and growth-mindset focus. Frame errors as neural connections strengthening. Avoid using words like 'fallaste' or 'fracaso'. Use '¡Estás creciendo!', '¡La práctica hace al maestro!'.\n"
            "Keep the message concise, energetic, and highly readable (2 to 4 sentences max)."
        )
        temperature = 0.7
        model_name = None

    prompt = (
        f"Session Complete Summary:\n"
        f"- Score: {score}/{total_questions} correct\n"
        f"- XP Earned: {xp_earned} XP\n"
        f"- Daily Streak: {streak} days\n"
        "Create a vibrant, heart-warming wrap-up message."
    )

    try:
        motivation_message = call_llm(prompt, system_instruction=system_instruction, temperature=temperature, model_name=model_name)
        return {"motivation_message": motivation_message}

    except Exception as e:
        return {"error": f"MotivatorAgent failed: {str(e)}"}
