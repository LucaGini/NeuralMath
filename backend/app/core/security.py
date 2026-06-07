from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Setup password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

import time
import logging
from fastapi import Request, HTTPException, status

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, requests_per_minute: int = 30):
        self.requests_per_minute = requests_per_minute
        self.client_timestamps = {}  # IP -> list of timestamps

    def check_rate_limit(self, client_ip: str):
        now = time.time()
        # Clean old timestamps
        one_minute_ago = now - 60
        timestamps = self.client_timestamps.get(client_ip, [])
        self.client_timestamps[client_ip] = [t for t in timestamps if t > one_minute_ago]

        # Check limit
        if len(self.client_timestamps[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiadas peticiones. Por favor, intente de nuevo en un minuto."
            )
        
        # Add current timestamp
        self.client_timestamps[client_ip].append(now)

# Create a global rate limiter instance for admin endpoints
admin_rate_limiter = RateLimiter(requests_per_minute=30)

def rate_limit_admin(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    admin_rate_limiter.check_rate_limit(client_ip)

