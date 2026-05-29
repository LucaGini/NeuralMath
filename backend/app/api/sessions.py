from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import cast, String
from sqlalchemy.orm import Session
from datetime import datetime, date
import json
from app.core.database import get_db
from app.models.user import User
from app.models.topic import Topic
from app.models.session import Session as MathSession
from app.models.exercise import Exercise
from app.models.achievement import Achievement
from app.models.alby_journal import AlbyJournalEntry
from app.schemas.user import AchievementResponse, UserResponse
from app.api.auth import get_current_user
from agents.graph import math_tutor_graph
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/sessions", tags=["sessions"])

# Schemas
class AlbyJournalResponse(BaseModel):
    id: int
    concept: str
    entry_text: str
    created_at: datetime

    class Config:
        from_attributes = True

class StartSessionRequest(BaseModel):
    topic_id: int
    theme: Optional[str] = "standard"
    exercise_count: Optional[int] = 5
    subtopic: Optional[str] = None

class StartTeachBackRequest(BaseModel):
    topic_ids: Optional[List[int]] = None
    exercise_count: Optional[int] = 3

class ExerciseResponse(BaseModel):
    id: int
    question: str
    difficulty_level: Optional[str]
    order_index: int
    exercise_type: str = "free_text"
    choices: Optional[List[str]] = None
    protege_answer: Optional[str] = None
    protege_explanation: Optional[str] = None

class StartSessionResponse(BaseModel):
    session_id: int
    topic_name: str
    level: str
    session_type: str = "practice"
    exercises: List[ExerciseResponse]

class AnswerSubmissionRequest(BaseModel):
    exercise_id: int
    user_answer: str
    time_to_answer_ms: Optional[int] = None

class AnswerEvaluationResponse(BaseModel):
    exercise_id: int
    is_correct: bool
    explanation: str
    error_type: Optional[str] = None
    misconception: Optional[str] = None

class CompleteSessionResponse(BaseModel):
    session_id: int
    score: int
    total_questions: int
    xp_earned: int
    streak_days: int
    motivation_message: str
    newly_unlocked: List[AchievementResponse] = []

class UpdateAvatarRequest(BaseModel):
    avatar_id: str

class HintRequest(BaseModel):
    exercise_id: int
    hint_level: int

class HintResponse(BaseModel):
    hint: str
    hint_level: int
    xp_penalty: int

class SkillMasteryItem(BaseModel):
    skill: str
    total_attempts: int
    correct_attempts: int
    accuracy: float
    status: str
    last_topic: str
    avg_time_ms: Optional[float] = None

class ErrorDiagnosticItem(BaseModel):
    error_type: str
    label_es: str
    label_en: str
    count: int

class ErrorDiagnosticsResponse(BaseModel):
    total_errors: int
    primary_error_type: Optional[str]
    advice_es: str
    advice_en: str
    diagnostics: List[ErrorDiagnosticItem]

class TopicHistoryResponse(BaseModel):
    name: str
    area: str

class SessionHistoryResponse(BaseModel):
    id: int
    score: int
    xp_earned: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    topic: TopicHistoryResponse

    class Config:
        from_attributes = True

@router.get("/history", response_model=List[SessionHistoryResponse])
def get_session_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieves the completed practice history of the authenticated user.
    """
    sessions = db.query(MathSession).filter(
        MathSession.user_id == current_user.id,
        MathSession.completed_at.isnot(None)
    ).order_by(MathSession.completed_at.desc()).all()
    return sessions

def calculate_streak(user: User, db: Session):
    """
    Calculates and updates user's daily learning streak.
    """
    today = date.today()
    if user.last_active_at:
        last_active_date = user.last_active_at.date()
        delta = (today - last_active_date).days
        if delta == 1:
            user.streak_days += 1
        elif delta > 1:
            user.streak_days = 1
        # If delta == 0, they already learned today. Streak is preserved but not incremented.
    else:
        user.streak_days = 1
    
    user.last_active_at = datetime.utcnow()
    db.commit()

@router.post("/start", response_model=StartSessionResponse)
def start_session(req: StartSessionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    topic = db.query(Topic).filter(Topic.id == req.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # 1. Gather historical data for ExerciseAgent personalization
    past_sessions = db.query(MathSession).filter(
        MathSession.user_id == current_user.id,
        MathSession.topic_id == topic.id
    ).all()
    
    if past_sessions:
        avg_score = sum(s.score for s in past_sessions) / len(past_sessions)
        performance_summary = f"Average score of {avg_score:.1f}/5 across {len(past_sessions)} past trials."
    else:
        performance_summary = "First time attempting this topic."
    
    # 2. Invoke ExerciseAgent via LangGraph
    state_input = {
        "user_level": current_user.level,
        "topic_name": topic.name,
        "topic_area": topic.area,
        "subtopic_name": req.subtopic,
        "explanation": None,
        "exercises": None,
        "user_answers": None,
        "evaluations": None,
        "session_summary": {"recent_performance": performance_summary},
        "motivation_message": None,
        "target_node": "exercise",
        "theme": req.theme or "standard",
        "session_type": "practice",
        "exercise_count": req.exercise_count or 5
    }
    
    try:
        res = math_tutor_graph.invoke(state_input, {"configurable": {"thread_id": f"exercise_{topic.id}_{current_user.id}"}})
        exercises_data = res.get("exercises", [])
        
        if not exercises_data:
            raise HTTPException(status_code=500, detail="ExerciseAgent failed to return problems.")
            
        # 3. Create Session DB record
        new_session = MathSession(
            user_id=current_user.id,
            topic_id=topic.id,
            score=0,
            xp_earned=0,
            theme=req.theme or "standard",
            session_type="practice"
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        # 4. Create Exercise DB records
        created_exercises = []
        for ex in exercises_data:
            db_ex = Exercise(
                session_id=new_session.id,
                question=ex.get("question"),
                correct_answer=ex.get("correct_answer"),
                difficulty_level=ex.get("difficulty_level", "Medio"),
                order_index=ex.get("order_index", 0),
                exercise_type=ex.get("exercise_type", "free_text"),
                choices=ex.get("choices", None),
                skill_tags=ex.get("skill_tags", None)
            )
            db.add(db_ex)
            created_exercises.append(db_ex)
            
        db.commit()
        
        # Return structured response (hiding correct_answers!)
        return {
            "session_id": new_session.id,
            "topic_name": topic.name,
            "level": current_user.level,
            "session_type": "practice",
            "exercises": [
                ExerciseResponse(
                    id=e.id,
                    question=e.question,
                    difficulty_level=e.difficulty_level,
                    order_index=e.order_index,
                    exercise_type=e.exercise_type,
                    choices=e.choices,
                    protege_answer=e.protege_answer,
                    protege_explanation=e.protege_explanation
                ) for e in created_exercises
            ]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting exercise session: {str(e)}"
        )

@router.post("/answer", response_model=AnswerEvaluationResponse)
def submit_answer(req: AnswerSubmissionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exercise = db.query(Exercise).filter(Exercise.id == req.exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
        
    session_record = db.query(MathSession).filter(MathSession.id == exercise.session_id).first()
    if not session_record or session_record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this session")

    # Persist timing (Sprint 4)
    exercise.time_to_answer_ms = req.time_to_answer_ms

    # Fast-path: Multiple choice — no LLM call needed (Sprint 1)
    if exercise.exercise_type == "multiple_choice":
        is_correct = req.user_answer.strip() == exercise.correct_answer.strip()
        explanation = (
            f"¡Correcto! La respuesta era '${exercise.correct_answer}$'."
            if is_correct
            else f"La respuesta correcta era '${exercise.correct_answer}$'. Revisa las opciones y el concepto."
        )
        exercise.user_answer = req.user_answer
        exercise.is_correct = is_correct
        exercise.evaluation_explanation = explanation
        db.commit()
        
        return {
            "exercise_id": exercise.id,
            "is_correct": is_correct,
            "explanation": explanation,
            "error_type": None,
            "misconception": None
        }

    session_type = session_record.session_type or "practice"
    is_teach_back = session_type == "teach_back"

    # Invoke EvaluatorAgent for free_text and fill_blank
    state_input = {
        "user_level": current_user.level,
        "topic_name": "Math",
        "topic_area": "Math",
        "explanation": None,
        "exercises": None,
        "user_answers": [req.user_answer],
        "evaluations": None,
        "session_summary": {
            "current_exercise_question": exercise.question,
            "current_exercise_correct_answer": exercise.correct_answer,
            "current_exercise_user_answer": req.user_answer,
            "session_type": session_type,
            "current_exercise_protege_answer": exercise.protege_answer,
            "current_exercise_protege_explanation": exercise.protege_explanation
        },
        "motivation_message": None,
        "target_node": "evaluator"
    }
    
    try:
        res = math_tutor_graph.invoke(state_input, {"configurable": {"thread_id": f"evaluate_{exercise.id}"}})
        evals = res.get("evaluations", [])
        if not evals:
            raise HTTPException(status_code=500, detail="EvaluatorAgent did not output standard metrics.")
            
        evaluation = evals[0]
        is_correct = evaluation.get("is_correct", False)
        explanation = evaluation.get("explanation", "Evaluación completada.")
        error_type = evaluation.get("error_type")
        misconception = evaluation.get("misconception")
        
        # Save evaluation to DB
        exercise.user_answer = req.user_answer
        exercise.is_correct = is_correct
        exercise.evaluation_explanation = explanation
        exercise.error_type = error_type
        exercise.misconception = misconception
        if is_teach_back:
            exercise.student_review = req.user_answer
        db.commit()

        # Alby's Journal trigger (Teach-Back MET diary)
        if is_teach_back and is_correct:
            concept = "conceptos matemáticos"
            if exercise.skill_tags:
                try:
                    tags = exercise.skill_tags
                    if isinstance(tags, str):
                        tags = json.loads(tags)
                    if tags and isinstance(tags, list):
                        concept = tags[0].replace("_", " ")
                except:
                    pass
            elif session_record.topic:
                concept = session_record.topic.name

            # Prompt to LLM or fallback
            from agents.llm_client import call_llm
            prompt = f"""
            Genera una entrada de diario muy tierna, amigable y cortita (máximo 2 oraciones) escrita en primera persona por el robot "Alby".
            Alby tiene que expresar su felicidad e infinito agradecimiento al estudiante por haberle enseñado.
            El tema del ejercicio era: '{concept}'.
            La pregunta era: '{exercise.question}'.
            El error que Alby había cometido era: '{exercise.protege_explanation}'.
            La explicación correctiva del estudiante que ayudó a Alby fue: '{req.user_answer}'.

            Ejemplo: "¡Hoy mi tutor me enseñó que un signo menos cambia todo dentro del paréntesis! Ahora sí podré resolver mis tareas sin confundirme. ¡Muchas gracias!"
            Genera únicamente la entrada de diario sin comillas ni metadatos.
            """
            system_instruction = "Eres Alby, un robot estudiante tierno, curioso y muy agradecido que aprende matemáticas gracias a su tutor."
            
            try:
                entry_text = call_llm(prompt, system_instruction=system_instruction)
                entry_text = entry_text.strip().replace('"', '').replace('“', '').replace('”', '')
            except Exception as e:
                entry_text = f"¡Hoy mi tutor me enseñó sobre '{concept}'! Gracias a su explicación, ahora entiendo perfectamente cómo resolver '{exercise.question}' sin cometer errores de signos ni lógica. ¡Eres el mejor maestro!"

            journal_entry = AlbyJournalEntry(
                user_id=current_user.id,
                exercise_id=exercise.id,
                concept=concept,
                entry_text=entry_text
            )
            db.add(journal_entry)
            db.commit()
        
        return {
            "exercise_id": exercise.id,
            "is_correct": is_correct,
            "explanation": explanation,
            "error_type": error_type,
            "misconception": misconception
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating answer: {str(e)}"
        )

@router.post("/{session_id}/complete", response_model=CompleteSessionResponse)
def complete_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session_record = db.query(MathSession).filter(MathSession.id == session_id).first()
    if not session_record or session_record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this session")
        
    if session_record.completed_at:
        raise HTTPException(status_code=400, detail="Session is already marked complete")
        
    # Calculate stats
    exercises = db.query(Exercise).filter(Exercise.session_id == session_id).all()
    total_questions = len(exercises)
    correct_count = sum(1 for e in exercises if e.is_correct)
    
    # 20 XP per correct question + 50 XP bonus for perfect score
    xp_earned = correct_count * 20
    if correct_count == total_questions and total_questions > 0:
        xp_earned += 50
        
    # Socratic hint ladder penalty: −5 XP per hint level requested (Sprint 3)
    hint_penalty = sum((e.hint_level_used or 0) * 5 for e in exercises)
    xp_earned = max(0, xp_earned - hint_penalty)
        
    # Update session details
    session_record.score = correct_count
    session_record.xp_earned = xp_earned
    session_record.completed_at = datetime.utcnow()
    
    # Update user cumulative stats
    current_user.xp_total += xp_earned
    calculate_streak(current_user, db)
    
    # Trigger MotivatorAgent
    state_input = {
        "user_level": current_user.level,
        "topic_name": "General",
        "topic_area": "General",
        "explanation": None,
        "exercises": None,
        "user_answers": None,
        "evaluations": None,
        "session_summary": {
            "score": correct_count,
            "total_questions": total_questions,
            "xp_earned": xp_earned,
            "streak_days": current_user.streak_days
        },
        "motivation_message": None,
        "target_node": "motivator"
    }
    
    try:
        res = math_tutor_graph.invoke(state_input, {"configurable": {"thread_id": f"motivation_{session_id}"}})
        motivation_message = res.get("motivation_message", "¡Felicitaciones por terminar tu entrenamiento diario!")
        
        # Check for achievements
        newly_unlocked = []
        
        # 1. Prodigio Matemático (perfect_score)
        if correct_count == total_questions and total_questions > 0:
            badge_key = "perfect_score"
            existing = db.query(Achievement).filter(
                Achievement.user_id == current_user.id,
                Achievement.badge_key == badge_key
            ).first()
            if not existing:
                ach = Achievement(
                    user_id=current_user.id,
                    badge_key=badge_key,
                    title_es="Prodigio Matemático",
                    title_en="Math Prodigy",
                    desc_es="Resolviste correctamente todos los ejercicios de una sesión.",
                    desc_en="Solved all exercises correctly in a single session."
                )
                db.add(ach)
                newly_unlocked.append(ach)

        # 2. Guerrero Diario (streak_3)
        if current_user.streak_days >= 3:
            badge_key = "streak_3"
            existing = db.query(Achievement).filter(
                Achievement.user_id == current_user.id,
                Achievement.badge_key == badge_key
            ).first()
            if not existing:
                ach = Achievement(
                    user_id=current_user.id,
                    badge_key=badge_key,
                    title_es="Guerrero Diario",
                    title_en="Daily Warrior",
                    desc_es="Mantuviste una racha de aprendizaje de 3 días consecutivos.",
                    desc_en="Maintained an active learning streak of 3 consecutive days."
                )
                db.add(ach)
                newly_unlocked.append(ach)

        # 3. Gran Maestro (xp_500)
        if current_user.xp_total >= 500:
            badge_key = "xp_500"
            existing = db.query(Achievement).filter(
                Achievement.user_id == current_user.id,
                Achievement.badge_key == badge_key
            ).first()
            if not existing:
                ach = Achievement(
                    user_id=current_user.id,
                    badge_key=badge_key,
                    title_es="Gran Maestro",
                    title_en="Grandmaster",
                    desc_es="Alcanzaste un total acumulado de 500 XP.",
                    desc_en="Accumulated a lifetime total of 500 XP."
                )
                db.add(ach)
                newly_unlocked.append(ach)

        db.commit()
        
        for ach in newly_unlocked:
            db.refresh(ach)
            
        return {
            "session_id": session_record.id,
            "score": correct_count,
            "total_questions": total_questions,
            "xp_earned": xp_earned,
            "streak_days": current_user.streak_days,
            "motivation_message": motivation_message,
            "newly_unlocked": newly_unlocked
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error compiling motivator response: {str(e)}"
        )

@router.post("/avatar", response_model=UserResponse)
def update_avatar(req: UpdateAvatarRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.avatar_id = req.avatar_id
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/hint", response_model=HintResponse)
def get_hint(req: HintRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exercise = db.query(Exercise).filter(Exercise.id == req.exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
        
    session_record = db.query(MathSession).filter(MathSession.id == exercise.session_id).first()
    if not session_record or session_record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this session")

    # clamp requested hint level to 1-4
    hint_level = max(1, min(4, req.hint_level))

    # Invoke HintAgent via LangGraph
    state_input = {
        "user_level": current_user.level,
        "topic_name": "Math",
        "topic_area": "Math",
        "explanation": None,
        "exercises": None,
        "user_answers": None,
        "evaluations": None,
        "session_summary": {
            "current_exercise_question": exercise.question,
            "current_exercise_correct_answer": exercise.correct_answer,
            "hint_level": hint_level
        },
        "motivation_message": None,
        "target_node": "hint"
    }

    try:
        res = math_tutor_graph.invoke(state_input, {"configurable": {"thread_id": f"hint_{exercise.id}_{hint_level}"}})
        hint_text = res.get("hint", "Intenta resolver paso a paso.")
        
        # Keep track of highest hint level requested in this exercise
        if hint_level > exercise.hint_level_used:
            exercise.hint_level_used = hint_level
            db.commit()

        return {
            "hint": hint_text,
            "hint_level": hint_level,
            "xp_penalty": 5
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating hint: {str(e)}")

@router.get("/skills/mastery", response_model=List[SkillMasteryItem])
def get_skill_mastery(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Aggregates Exercise records by skill_tag to produce a per-skill mastery summary.
    """
    exercises = db.query(Exercise).join(MathSession).filter(
        MathSession.user_id == current_user.id,
        Exercise.skill_tags.isnot(None),
        Exercise.is_correct.isnot(None),
    ).all()

    skill_map = {}
    for ex in exercises:
        tags = ex.skill_tags
        if not tags:
            continue
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except:
                tags = [tags]
        for tag in tags:
            if tag not in skill_map:
                skill_map[tag] = {"total": 0, "correct": 0, "times": [], "topic": ex.session.topic.name}
            skill_map[tag]["total"] += 1
            if ex.is_correct:
                skill_map[tag]["correct"] += 1
            if ex.time_to_answer_ms:
                skill_map[tag]["times"].append(ex.time_to_answer_ms)

    result = []
    for skill, data in skill_map.items():
        accuracy = data["correct"] / data["total"] if data["total"] > 0 else 0.0
        status = "mastered" if accuracy >= 0.8 else "improving" if accuracy >= 0.5 else "needs_work"
        result.append(SkillMasteryItem(
            skill=skill,
            total_attempts=data["total"],
            correct_attempts=data["correct"],
            accuracy=accuracy,
            status=status,
            last_topic=data["topic"],
            avg_time_ms=sum(data["times"]) / len(data["times"]) if data["times"] else None
        ))

    return sorted(result, key=lambda x: x.accuracy)  # weakest first

@router.get("/skills/recommended-topic")
def get_recommended_topic(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns the recommended topic ID based on the user's weakest skill,
    or falls back to a default topic.
    """
    mastery_list = get_skill_mastery(db, current_user)
    if mastery_list:
        weakest = mastery_list[0].skill
        weakest_ex = db.query(Exercise).join(MathSession).filter(
            MathSession.user_id == current_user.id,
            cast(Exercise.skill_tags, String).like(f"%{weakest}%")
        ).first()
        if weakest_ex:
            return {"topic_id": weakest_ex.session.topic_id, "skill": weakest}

    fallback_topic = db.query(Topic).filter(Topic.level == current_user.level).first()
    if not fallback_topic:
        fallback_topic = db.query(Topic).first()
    return {"topic_id": fallback_topic.id if fallback_topic else 1, "skill": "general"}

@router.post("/review/start", response_model=StartSessionResponse)
def start_review_session(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Finds skills with < 60% accuracy.
    Generates exercises targeting those skills via ExerciseAgent.
    """
    mastery_list = get_skill_mastery(db, current_user)
    weak_skills = [m.skill for m in mastery_list if m.accuracy < 0.6]
    
    if not weak_skills:
        weak_skills = [m.skill for m in mastery_list]
        
    if not weak_skills:
        weak_skills = ["basic_arithmetic", "equations"]

    topic = None
    if weak_skills:
        for skill in weak_skills:
            ex = db.query(Exercise).join(MathSession).filter(
                MathSession.user_id == current_user.id,
                cast(Exercise.skill_tags, String).like(f"%{skill}%")
            ).first()
            if ex:
                topic = ex.session.topic
                break
                
    if not topic:
        topic = db.query(Topic).filter(Topic.level == current_user.level).first()
    if not topic:
        topic = db.query(Topic).first()
        
    if not topic:
        raise HTTPException(status_code=404, detail="No math topics found to start review session")

    performance_summary = f"Review Session targeting skills: {', '.join(weak_skills[:3])}."

    state_input = {
        "user_level": current_user.level,
        "topic_name": topic.name,
        "topic_area": topic.area,
        "explanation": None,
        "exercises": None,
        "user_answers": None,
        "evaluations": None,
        "session_summary": {"recent_performance": performance_summary},
        "motivation_message": None,
        "target_node": "exercise"
    }

    try:
        res = math_tutor_graph.invoke(state_input, {"configurable": {"thread_id": f"review_{topic.id}_{current_user.id}"}})
        exercises_data = res.get("exercises", [])
        
        if not exercises_data:
            raise HTTPException(status_code=500, detail="ExerciseAgent failed to return problems.")
            
        new_session = MathSession(
            user_id=current_user.id,
            topic_id=topic.id,
            score=0,
            xp_earned=0,
            session_type="review"
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        created_exercises = []
        for ex in exercises_data:
            db_ex = Exercise(
                session_id=new_session.id,
                question=ex.get("question"),
                correct_answer=ex.get("correct_answer"),
                difficulty_level=ex.get("difficulty_level", "Medio"),
                order_index=ex.get("order_index", 0),
                exercise_type=ex.get("exercise_type", "free_text"),
                choices=ex.get("choices", None),
                skill_tags=ex.get("skill_tags", None)
            )
            db.add(db_ex)
            created_exercises.append(db_ex)
            
        db.commit()
        
        return {
            "session_id": new_session.id,
            "topic_name": f"Repaso: {topic.name}",
            "level": current_user.level,
            "session_type": "review",
            "exercises": [
                ExerciseResponse(
                    id=e.id,
                    question=e.question,
                    difficulty_level=e.difficulty_level,
                    order_index=e.order_index,
                    exercise_type=e.exercise_type,
                    choices=e.choices,
                    protege_answer=e.protege_answer,
                    protege_explanation=e.protege_explanation
                ) for e in created_exercises
            ]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting review session: {str(e)}"
        )

@router.post("/teach-back/start", response_model=StartSessionResponse)
def start_teach_back_session(req: StartTeachBackRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Starts an AI Protégé ("Teach-Back") session where the user socratically corrects Alby's flawed steps.
    Targets specific user-selected topics or their weakest skill topic, matching their level.
    """
    import random
    topic = None
    
    # 1. Resolve selected topic from requested list
    if req.topic_ids:
        chosen_ids = list(req.topic_ids)
        random.shuffle(chosen_ids)
        for t_id in chosen_ids:
            t = db.query(Topic).filter(Topic.id == t_id).first()
            # Strict level alignment check
            if t and t.level.lower() == current_user.level.lower():
                topic = t
                break
                
    # Fallback to recommended topic if none found or chosen
    if not topic:
        rec = get_recommended_topic(db, current_user)
        topic_id = rec.get("topic_id", 1)
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        
    # Final level-aligned fallback if recommended topic level is mismatched
    if topic and topic.level.lower() != current_user.level.lower():
        topic = db.query(Topic).filter(Topic.level == current_user.level).first()
        
    # Absolute default fallback
    if not topic:
        topic = db.query(Topic).first()
        
    if not topic:
        raise HTTPException(status_code=404, detail="No math topics found to start teach-back session")

    # 2. Invoke ProtegeAgent via LangGraph
    state_input = {
        "user_level": current_user.level,
        "topic_name": topic.name,
        "topic_area": topic.area,
        "explanation": None,
        "exercises": None,
        "user_answers": None,
        "evaluations": None,
        "session_summary": {
            "recent_performance": f"Teach-Back session targeting: {topic.name}",
            "session_type": "teach_back"
        },
        "motivation_message": None,
        "target_node": "protege",
        "theme": "standard",
        "session_type": "teach_back",
        "exercise_count": req.exercise_count or 3
    }

    try:
        res = math_tutor_graph.invoke(state_input, {"configurable": {"thread_id": f"teachback_{topic.id}_{current_user.id}"}})
        exercises_data = res.get("exercises", [])
        
        if not exercises_data:
            raise HTTPException(status_code=500, detail="ProtegeAgent failed to return problems.")
            
        # Create MathSession for teach_back
        new_session = MathSession(
            user_id=current_user.id,
            topic_id=topic.id,
            score=0,
            xp_earned=0,
            session_type="teach_back",
            theme="standard"
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        created_exercises = []
        for ex in exercises_data:
            db_ex = Exercise(
                session_id=new_session.id,
                question=ex.get("question"),
                correct_answer=ex.get("correct_answer"),
                protege_answer=ex.get("protege_answer"),
                protege_explanation=ex.get("protege_explanation"),
                difficulty_level=ex.get("difficulty_level", "Medio"),
                order_index=ex.get("order_index", 0),
                exercise_type=ex.get("exercise_type", "free_text"),
                choices=ex.get("choices", None),
                skill_tags=ex.get("skill_tags", None)
            )
            db.add(db_ex)
            created_exercises.append(db_ex)
            
        db.commit()
        
        return {
            "session_id": new_session.id,
            "topic_name": f"Enseñar a Alby: {topic.name}",
            "level": current_user.level,
            "session_type": "teach_back",
            "exercises": [
                ExerciseResponse(
                    id=e.id,
                    question=e.question,
                    difficulty_level=e.difficulty_level,
                    order_index=e.order_index,
                    exercise_type=e.exercise_type,
                    choices=e.choices,
                    protege_answer=e.protege_answer,
                    protege_explanation=e.protege_explanation
                ) for e in created_exercises
            ]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting teach-back session: {str(e)}"
        )

@router.get("/alby-journal", response_model=List[AlbyJournalResponse])
def get_alby_journal(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieves the list of lessons Alby has successfully learned from this student.
    """
    entries = db.query(AlbyJournalEntry).filter(
        AlbyJournalEntry.user_id == current_user.id
    ).order_by(AlbyJournalEntry.created_at.desc()).all()
    return entries

@router.post("/speed-run/start", response_model=StartSessionResponse)
def start_speed_run_session(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Starts a high-energy Time-Attack Speed-Run session for rapid math training.
    """
    rec = get_recommended_topic(db, current_user)
    topic_id = rec.get("topic_id", 1)
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        topic = db.query(Topic).first()
        
    if not topic:
        raise HTTPException(status_code=404, detail="No math topics found to start speed-run session")

    # Invoke ExerciseAgent via LangGraph
    state_input = {
        "user_level": current_user.level,
        "topic_name": topic.name,
        "topic_area": topic.area,
        "explanation": None,
        "exercises": None,
        "user_answers": None,
        "evaluations": None,
        "session_summary": {
            "recent_performance": "Time-Attack Speed-Run mode. Keep exercises simple, rapid-solve, and high-energy.",
            "session_type": "speed_run"
        },
        "motivation_message": None,
        "target_node": "exercise",
        "theme": "standard",
        "session_type": "speed_run"
    }

    try:
        res = math_tutor_graph.invoke(state_input, {"configurable": {"thread_id": f"speedrun_{topic.id}_{current_user.id}"}})
        exercises_data = res.get("exercises", [])
        
        if not exercises_data:
            raise HTTPException(status_code=500, detail="ExerciseAgent failed to return problems.")
            
        # Create MathSession for speed_run
        new_session = MathSession(
            user_id=current_user.id,
            topic_id=topic.id,
            score=0,
            xp_earned=0,
            session_type="speed_run",
            theme="standard"
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        created_exercises = []
        for ex in exercises_data:
            db_ex = Exercise(
                session_id=new_session.id,
                question=ex.get("question"),
                correct_answer=ex.get("correct_answer"),
                difficulty_level="Fácil",
                order_index=ex.get("order_index", 0),
                exercise_type=ex.get("exercise_type", "multiple_choice" if ex.get("choices") else "fill_blank"),
                choices=ex.get("choices", None),
                skill_tags=ex.get("skill_tags", None)
            )
            db.add(db_ex)
            created_exercises.append(db_ex)
            
        db.commit()
        
        return {
            "session_id": new_session.id,
            "topic_name": f"Contrarreloj: {topic.name}",
            "level": current_user.level,
            "session_type": "speed_run",
            "exercises": [
                ExerciseResponse(
                    id=e.id,
                    question=e.question,
                    difficulty_level=e.difficulty_level,
                    order_index=e.order_index,
                    exercise_type=e.exercise_type,
                    choices=e.choices,
                    protege_answer=e.protege_answer,
                    protege_explanation=e.protege_explanation
                ) for e in created_exercises
            ]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting speed-run session: {str(e)}"
        )

@router.get("/errors/diagnostics", response_model=ErrorDiagnosticsResponse)
def get_error_diagnostics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Analyzes historical exercise data for incorrect answers, groups them by mathematical error classifications,
    calculates totals, and returns highly tailored socratic metacognitive feedback.
    """
    # 1. Fetch incorrect exercises with error types for this user
    exercises = db.query(Exercise).join(MathSession).filter(
        MathSession.user_id == current_user.id,
        Exercise.is_correct == False,
        Exercise.error_type.isnot(None)
    ).all()

    # 2. Count occurrences of each error category
    error_counts = {
        "sign_error": 0,
        "distribution_error": 0,
        "order_of_operations": 0,
        "exponent_rule": 0,
        "cancellation_error": 0,
        "arithmetic_slip": 0,
        "conceptual_error": 0,
        "other": 0
    }

    total_errors = 0
    for ex in exercises:
        if ex.error_type in error_counts:
            error_counts[ex.error_type] += 1
            total_errors += 1
        else:
            error_counts["other"] += 1
            total_errors += 1

    # 3. Identify the primary (most frequent) error type
    primary_error_type = None
    max_count = 0
    for err_type, count in error_counts.items():
        if count > max_count:
            max_count = count
            primary_error_type = err_type

    # 4. Generate highly tailored socratic metacognitive advice
    advice_dict = {
        "sign_error": {
            "es": "¡Cuidado con los signos! Tiendes a omitir los signos negativos al distribuir o simplificar. Intenta escribir un paso intermedio para verificarlos antes de continuar.",
            "en": "Watch your signs! You tend to drop negative signs during distribution or simplification. Try writing an intermediate step to double-check before moving on."
        },
        "distribution_error": {
            "es": "¡Recuerda distribuir a todos! Cuando multiplicas un término por un paréntesis, asegúrate de multiplicarlo por cada elemento interior sin saltarte ninguno.",
            "en": "Remember to distribute to everyone! When multiplying a term by a parenthesis, make sure you multiply it by every single element inside without skipping."
        },
        "order_of_operations": {
            "es": "¡El orden importa! Recuerda la jerarquía PEMDAS: primero paréntesis, exponentes, luego multiplicación y división, y al final sumas y restas.",
            "en": "Order matters! Remember PEMDAS hierarchy: parentheses first, then exponents, followed by multiplication and division, and lastly addition and subtraction."
        },
        "exponent_rule": {
            "es": "Repasa las leyes de exponentes. Recuerda que al multiplicar bases iguales los exponentes se suman, y al elevar a otra potencia se multiplican.",
            "en": "Review exponent laws. Remember that when multiplying equal bases you add exponents, and when raising to another power you multiply."
        },
        "cancellation_error": {
            "es": "¡Cuidado al cancelar términos! Solo puedes cancelar factores comunes en productos multiplicativos, nunca términos individuales en sumas o restas.",
            "en": "Careful when cancelling terms! You can only cancel common factors in multiplicative products, never individual terms in additions or subtractions."
        },
        "arithmetic_slip": {
            "es": "Pequeño desliz aritmético. Tu lógica algebraica es excelente, pero a veces fallas en cálculos básicos. ¡Tómate un segundo extra para sumar y restar con calma!",
            "en": "Small arithmetic slip. Your algebraic logic is excellent, but basic calculations sometimes trip you up. Take an extra second to add and subtract carefully!"
        },
        "conceptual_error": {
            "es": "Dudas conceptuales. Parece que hay pequeñas dudas en las reglas básicas del tema. ¡Te sugerimos repasar la teoría interactiva antes de tu próximo reto!",
            "en": "Conceptual doubt. There seems to be doubt regarding the core rules of this topic. We recommend reviewing the interactive theory before your next try!"
        },
        "other": {
            "es": "¡Tu mente matemática está afilada! Sigue practicando con constancia para mantener tu racha activa y desbloquear nuevos logros.",
            "en": "Your mathematical mind is sharp! Keep practicing consistently to maintain your active streak and unlock new achievements."
        }
    }

    advice = advice_dict.get(primary_error_type or "other", advice_dict["other"])

    # 5. Format translation labels for the chart
    labels_es = {
        "sign_error": "Error de Signo",
        "distribution_error": "Error de Distribución",
        "order_of_operations": "Orden de Operaciones",
        "exponent_rule": "Regla de Exponentes",
        "cancellation_error": "Cancelación Inválida",
        "arithmetic_slip": "Error Aritmético",
        "conceptual_error": "Error Conceptual",
        "other": "Otro Error"
    }

    labels_en = {
        "sign_error": "Sign Error",
        "distribution_error": "Distribution Error",
        "order_of_operations": "Order of Operations",
        "exponent_rule": "Exponent Rule",
        "cancellation_error": "Invalid Cancellation",
        "arithmetic_slip": "Arithmetic Slip",
        "conceptual_error": "Conceptual Error",
        "other": "Other Error"
    }

    diagnostics = [
        ErrorDiagnosticItem(
            error_type=err_type,
            label_es=labels_es[err_type],
            label_en=labels_en[err_type],
            count=count
        )
        for err_type, count in error_counts.items()
    ]

    return ErrorDiagnosticsResponse(
        total_errors=total_errors,
        primary_error_type=primary_error_type,
        advice_es=advice["es"],
        advice_en=advice["en"],
        diagnostics=diagnostics
    )
