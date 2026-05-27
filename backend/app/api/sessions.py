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
from app.schemas.user import AchievementResponse, UserResponse
from app.api.auth import get_current_user
from agents.graph import math_tutor_graph
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/sessions", tags=["sessions"])

# Schemas
class StartSessionRequest(BaseModel):
    topic_id: int

class ExerciseResponse(BaseModel):
    id: int
    question: str
    difficulty_level: Optional[str]
    order_index: int
    exercise_type: str = "free_text"
    choices: Optional[List[str]] = None

class StartSessionResponse(BaseModel):
    session_id: int
    topic_name: str
    level: str
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
        "explanation": None,
        "exercises": None,
        "user_answers": None,
        "evaluations": None,
        "session_summary": {"recent_performance": performance_summary},
        "motivation_message": None,
        "target_node": "exercise"
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
            xp_earned=0
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
            "exercises": [
                ExerciseResponse(
                    id=e.id,
                    question=e.question,
                    difficulty_level=e.difficulty_level,
                    order_index=e.order_index,
                    exercise_type=e.exercise_type,
                    choices=e.choices
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
            "current_exercise_user_answer": req.user_answer
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
            "exercises": [
                ExerciseResponse(
                    id=e.id,
                    question=e.question,
                    difficulty_level=e.difficulty_level,
                    order_index=e.order_index,
                    exercise_type=e.exercise_type,
                    choices=e.choices
                ) for e in created_exercises
            ]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting review session: {str(e)}"
        )
