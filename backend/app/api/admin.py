import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from pydantic import BaseModel
from sqlalchemy import Date, desc, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import rate_limit_admin, get_password_hash
from app.api.auth import get_current_admin_user
from app.models.user import User
from app.models.session import Session as DbSession
from app.models.topic import Topic
from app.models.audit_log import AuditLog
from app.models.agent_config import AgentConfig, AgentConfigHistory
# Counters are fetched dynamically via get_stats


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(rate_limit_admin), Depends(get_current_admin_user)])

# Schemas
class SubtopicInput(BaseModel):
    name: str
    description: str

class TopicCreate(BaseModel):
    name: str
    area: str
    level: str
    subtopics: List[SubtopicInput] = []

class TopicUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[str] = None
    level: Optional[str] = None
    subtopics: Optional[List[SubtopicInput]] = None

class AgentConfigUpdate(BaseModel):
    agent_key: str
    system_prompt: str
    temperature: float
    model_name: str

class RestoreConfigRequest(BaseModel):
    history_id: int

class UserManualXpEdit(BaseModel):
    xp_change: int

# 1. Stats Endpoint
@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    try:
        # Total users
        total_users = db.query(User).count()
        # Total sessions
        total_sessions = db.query(DbSession).count()
        
        # DAU: Unique users per day in the last 7 days
        dau_data = []
        for i in range(6, -1, -1):
            target_date = datetime.utcnow().date() - timedelta(days=i)
            # Count unique users who started a session on target_date
            count = db.query(func.count(func.distinct(DbSession.user_id)))\
                .filter(func.cast(DbSession.created_at, Date) == target_date).scalar()
            dau_data.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "count": count or 0
            })
            
        # Top 5 most attempted topics
        top_topics_query = db.query(Topic.name, func.count(DbSession.id))\
            .join(DbSession, DbSession.topic_id == Topic.id)\
            .group_by(Topic.name)\
            .order_by(func.count(DbSession.id).desc())\
            .limit(5).all()
        top_topics = [{"topic_name": name, "session_count": count} for name, count in top_topics_query]
        
        # Agent error rate (percentage of responses that failed or returned fallback)
        from agents.llm_client import get_stats as get_llm_stats
        total_calls, fallback_calls = get_llm_stats()
        error_rate = (fallback_calls / total_calls * 100) if total_calls > 0 else 0.0
        
        return {
            "total_users": total_users,
            "total_sessions": total_sessions,
            "agent_error_rate": round(error_rate, 2),
            "dau_7_days": dau_data,
            "top_topics": top_topics
        }
    except Exception as e:
        logger.error(f"Error getting admin stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener estadísticas."
        )

# 2. Users management
@router.get("/users")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if q:
        search_filter = f"%{q}%"
        query = query.filter(User.name.ilike(search_filter) | User.email.ilike(search_filter))
    
    total = query.count()
    users = query.order_by(User.id.asc()).offset((page - 1) * limit).limit(limit).all()
    
    # Map to schema-like dictionary to avoid serialization errors
    user_list = []
    for u in users:
        user_list.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "level": u.level,
            "xp_total": u.xp_total,
            "alby_xp": u.alby_xp,
            "streak_days": u.streak_days,
            "is_admin": u.is_admin,
            "is_active": u.is_active,
            "created_at": u.created_at
        })
        
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "users": user_list
    }

@router.put("/users/{user_id}/deactivate")
def deactivate_user(user_id: int, current_admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes desactivarte a ti mismo")
        
    if user.email == "admin@neuralmath.edu" or user.email == "estudiante@neuralmath.edu":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se permite desactivar cuentas del sistema")

    if user.is_admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se puede desactivar a un usuario administrador. Quítele el rol de administrador primero.")

    user.is_active = False
    
    # Audit log
    audit_log = AuditLog(
        admin_id=current_admin.id,
        action="DEACTIVATE_USER",
        target_user_id=user.id,
        details={"user_email": user.email, "user_name": user.name}
    )
    db.add(audit_log)
    db.commit()
    return {"message": f"Usuario {user.email} desactivado correctamente"}

@router.put("/users/{user_id}/reactivate")
def reactivate_user(user_id: int, current_admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    user.is_active = True
    
    # Audit log
    audit_log = AuditLog(
        admin_id=current_admin.id,
        action="REACTIVATE_USER",
        target_user_id=user.id,
        details={"user_email": user.email, "user_name": user.name}
    )
    db.add(audit_log)
    db.commit()
    return {"message": f"Usuario {user.email} reactivado correctamente"}

@router.put("/users/{user_id}/make-admin")
def make_admin(user_id: int, current_admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    user.is_admin = True
    
    # Audit log
    audit_log = AuditLog(
        admin_id=current_admin.id,
        action="MAKE_ADMIN",
        target_user_id=user.id,
        details={"user_email": user.email, "user_name": user.name}
    )
    db.add(audit_log)
    db.commit()
    return {"message": f"Usuario {user.email} promovido a administrador"}

@router.put("/users/{user_id}/remove-admin")
def remove_admin(user_id: int, current_admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if user.email == "admin@neuralmath.edu":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El administrador del sistema principal no puede perder el rol de administrador")

    if user.id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes quitarte el rol de administrador a ti mismo")

    user.is_admin = False
    
    # Audit log
    audit_log = AuditLog(
        admin_id=current_admin.id,
        action="REMOVE_ADMIN",
        target_user_id=user.id,
        details={"user_email": user.email, "user_name": user.name}
    )
    db.add(audit_log)
    db.commit()
    return {"message": f"Rol de administrador revocado para el usuario {user.email}"}

@router.post("/users/{user_id}/reset-password")
def reset_password(user_id: int, current_admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        
    if user.email == "estudiante@neuralmath.edu" or user.email == "admin@neuralmath.edu":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No está permitido restablecer la contraseña de cuentas del sistema")

    # Generate a secure 10-character temporary password
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$"
    temp_password = "".join(secrets.choice(alphabet) for _ in range(10))
    
    user.password_hash = get_password_hash(temp_password)
    
    # Audit log
    audit_log = AuditLog(
        admin_id=current_admin.id,
        action="RESET_PASSWORD",
        target_user_id=user.id,
        details={"user_email": user.email}
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "message": f"Contraseña del usuario {user.email} restablecida correctamente.",
        "temp_password": temp_password
    }

@router.put("/users/{user_id}/edit-xp")
def edit_user_xp(user_id: int, xp_data: UserManualXpEdit, current_admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    old_xp = user.xp_total
    user.xp_total = max(0, user.xp_total + xp_data.xp_change)
    
    # Audit log
    audit_log = AuditLog(
        admin_id=current_admin.id,
        action="MANUAL_XP_EDIT",
        target_user_id=user.id,
        details={
            "user_email": user.email,
            "old_xp": old_xp,
            "new_xp": user.xp_total,
            "xp_change": xp_data.xp_change
        }
    )
    db.add(audit_log)
    db.commit()
    return {"message": "Puntos de XP del usuario editados correctamente", "new_xp": user.xp_total}

# 3. Audit Logs
@router.get("/audit-logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    action: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
        
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(AuditLog.timestamp >= start_dt)
        except ValueError:
            pass
            
    if end_date:
        try:
            # Include the entire day by adding 1 day or setting time to 23:59:59
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(AuditLog.timestamp < end_dt)
        except ValueError:
            pass
            
    total = query.count()
    logs = query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
    
    log_list = []
    for log in logs:
        # Resolve admin name
        admin = db.query(User).filter(User.id == log.admin_id).first()
        admin_email = admin.email if admin else "Sistema/Eliminado"
        
        # Resolve target email
        target = db.query(User).filter(User.id == log.target_user_id).first() if log.target_user_id else None
        target_email = target.email if target else None
        
        log_list.append({
            "id": log.id,
            "admin_email": admin_email,
            "action": log.action,
            "target_email": target_email,
            "details": log.details,
            "timestamp": log.timestamp
        })
        
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "logs": log_list
    }

# 4. Agent Configs
@router.get("/agents/config")
def get_agents_config(db: Session = Depends(get_db)):
    configs = db.query(AgentConfig).all()
    
    # Return configs. If not fully seeded, frontend handles fallback or we map it
    config_list = []
    for c in configs:
        # Get history count
        history_count = db.query(AgentConfigHistory).filter(AgentConfigHistory.agent_key == c.agent_key).count()
        config_list.append({
            "agent_key": c.agent_key,
            "system_prompt": c.system_prompt,
            "temperature": c.temperature,
            "model_name": c.model_name,
            "updated_at": c.updated_at,
            "history_count": history_count
        })
    return config_list

@router.put("/agents/config")
def update_agent_config(
    config_data: AgentConfigUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Retrieve existing
    config = db.query(AgentConfig).filter(AgentConfig.agent_key == config_data.agent_key).first()
    
    if not config:
        # Create new config
        config = AgentConfig(
            agent_key=config_data.agent_key,
            system_prompt=config_data.system_prompt,
            temperature=config_data.temperature,
            model_name=config_data.model_name
        )
        db.add(config)
        
        # Audit log
        audit_log = AuditLog(
            admin_id=current_admin.id,
            action="CREATE_AGENT_CONFIG",
            details={"agent_key": config_data.agent_key, "model_name": config_data.model_name}
        )
        db.add(audit_log)
    else:
        # Save historical snap before updating
        history = AgentConfigHistory(
            agent_key=config.agent_key,
            system_prompt=config.system_prompt,
            temperature=config.temperature,
            model_name=config.model_name,
            changed_by_id=current_admin.id
        )
        db.add(history)
        
        # Update current
        old_prompt = config.system_prompt
        config.system_prompt = config_data.system_prompt
        config.temperature = config_data.temperature
        config.model_name = config_data.model_name
        config.updated_at = datetime.utcnow()
        
        # Audit log
        audit_log = AuditLog(
            admin_id=current_admin.id,
            action="UPDATE_AGENT_CONFIG",
            details={
                "agent_key": config_data.agent_key,
                "model_name_before": history.model_name,
                "model_name_after": config_data.model_name,
                "temp_before": history.temperature,
                "temp_after": config_data.temperature
            }
        )
        db.add(audit_log)
        
    db.commit()
    db.refresh(config)
    return {"message": f"Configuración de {config_data.agent_key} actualizada correctamente"}

@router.get("/agents/config/{agent_key}/history")
def get_agent_history(agent_key: str, db: Session = Depends(get_db)):
    history = db.query(AgentConfigHistory)\
        .filter(AgentConfigHistory.agent_key == agent_key)\
        .order_by(AgentConfigHistory.created_at.desc()).all()
        
    history_list = []
    for h in history:
        admin = db.query(User).filter(User.id == h.changed_by_id).first()
        admin_email = admin.email if admin else "Sistema"
        history_list.append({
            "id": h.id,
            "agent_key": h.agent_key,
            "system_prompt": h.system_prompt,
            "temperature": h.temperature,
            "model_name": h.model_name,
            "admin_email": admin_email,
            "created_at": h.created_at
        })
    return history_list

@router.post("/agents/config/restore")
def restore_agent_config(
    restore_data: RestoreConfigRequest,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    history_record = db.query(AgentConfigHistory).filter(AgentConfigHistory.id == restore_data.history_id).first()
    if not history_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro de historial no encontrado")
        
    # Get active config
    config = db.query(AgentConfig).filter(AgentConfig.agent_key == history_record.agent_key).first()
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuración del agente no encontrada")
        
    # Save a history snapshot of the current state before overwriting
    backup_history = AgentConfigHistory(
        agent_key=config.agent_key,
        system_prompt=config.system_prompt,
        temperature=config.temperature,
        model_name=config.model_name,
        changed_by_id=current_admin.id
    )
    db.add(backup_history)
    
    # Restore values
    config.system_prompt = history_record.system_prompt
    config.temperature = history_record.temperature
    config.model_name = history_record.model_name
    config.updated_at = datetime.utcnow()
    
    # Audit log
    audit_log = AuditLog(
        admin_id=current_admin.id,
        action="RESTORE_AGENT_CONFIG",
        details={
            "agent_key": config.agent_key,
            "restored_history_id": history_record.id,
            "model_name": config.model_name
        }
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": f"Configuración de {config.agent_key} restaurada correctamente a la versión de {history_record.created_at}"}

# 5. Curriculum Management (Topics Toggles)
@router.get("/topics")
def get_admin_topics(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    level: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Topic)
    if level and level != "All":
        query = query.filter(Topic.level.ilike(level))
        
    total = query.count()
    topics = query.order_by(Topic.level.asc(), Topic.area.asc(), Topic.name.asc()).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "topics": [
            {
                "id": t.id,
                "name": t.name,
                "area": t.area,
                "level": t.level,
                "subtopics": t.subtopics,
                "is_active": t.is_active
            }
            for t in topics
        ]
    }


@router.put("/topics/{topic_id}/toggle")
def toggle_topic_active(
    topic_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tema no encontrado")
        
    topic.is_active = not topic.is_active
    
    # Audit log
    audit_log = AuditLog(
        admin_id=current_admin.id,
        action="TOGGLE_TOPIC",
        details={
            "topic_id": topic.id,
            "topic_name": topic.name,
            "is_active": topic.is_active
        }
    )
    db.add(audit_log)
    db.commit()
    return {
        "message": f"Tema '{topic.name}' {'activado' if topic.is_active else 'desactivado'} correctamente.",
        "is_active": topic.is_active
    }


@router.post("/topics/create")
def create_topic(
    topic_data: TopicCreate,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Validation: Area
    valid_areas = ["Arithmetic", "Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics"]
    if topic_data.area not in valid_areas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Área no válida. Debe ser una de: {', '.join(valid_areas)}"
        )
    
    # Validation: Level
    valid_levels = ["Primary", "Secondary", "University"]
    if topic_data.level not in valid_levels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nivel no válido. Debe ser uno de: {', '.join(valid_levels)}"
        )
    
    # Validation: Subtopics count
    if not (1 <= len(topic_data.subtopics) <= 3):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cantidad de subtemas debe estar entre 1 y 3."
        )
        
    # Create the Topic
    new_topic = Topic(
        name=topic_data.name,
        area=topic_data.area,
        level=topic_data.level,
        subtopics=[{"name": s.name, "description": s.description} for s in topic_data.subtopics],
        is_active=True
    )
    db.add(new_topic)
    db.commit()
    db.refresh(new_topic)
    
    # Audit log
    audit_log = AuditLog(
        admin_id=current_admin.id,
        action="create_topic",
        details={"topic_name": new_topic.name}
    )
    db.add(audit_log)
    db.commit()
    
    return new_topic


@router.put("/topics/{topic_id}/edit")
def edit_topic(
    topic_id: int,
    topic_data: TopicUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tema no encontrado"
        )
        
    # Patch updates
    if topic_data.name is not None:
        topic.name = topic_data.name
        
    if topic_data.area is not None:
        valid_areas = ["Arithmetic", "Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics"]
        if topic_data.area not in valid_areas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Área no válida. Debe ser una de: {', '.join(valid_areas)}"
            )
        topic.area = topic_data.area
        
    if topic_data.level is not None:
        valid_levels = ["Primary", "Secondary", "University"]
        if topic_data.level not in valid_levels:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nivel no válido. Debe ser uno de: {', '.join(valid_levels)}"
            )
        topic.level = topic_data.level
        
    if topic_data.subtopics is not None:
        if not (1 <= len(topic_data.subtopics) <= 3):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cantidad de subtemas debe estar entre 1 y 3."
            )
        topic.subtopics = [{"name": s.name, "description": s.description} for s in topic_data.subtopics]
        
    # Audit log
    audit_log = AuditLog(
        admin_id=current_admin.id,
        action="edit_topic",
        details={"topic_name": topic.name}
    )
    db.add(audit_log)
    db.commit()
    db.refresh(topic)
    
    return topic


@router.delete("/topics/{topic_id}")
def delete_topic(
    topic_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tema no encontrado"
        )
        
    topic_name = topic.name
    db.delete(topic)
    
    # Audit log
    audit_log = AuditLog(
        admin_id=current_admin.id,
        action="delete_topic",
        details={"topic_name": topic_name}
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Tema eliminado correctamente"}
