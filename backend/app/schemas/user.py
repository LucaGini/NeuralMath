from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class AchievementResponse(BaseModel):
    id: int
    badge_key: str
    title_es: str
    title_en: str
    desc_es: str
    desc_en: str
    unlocked_at: datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: EmailStr
    level: str = "Primary"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    xp_total: int
    alby_xp: int
    streak_days: int
    avatar_id: str
    last_active_at: Optional[datetime] = None
    created_at: datetime
    achievements: List[AchievementResponse] = []

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None
    password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
