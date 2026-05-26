from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuralMath"
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/neuralmath"
    JWT_SECRET: str = "super_secret_neuralmath_jwt_key_change_me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # LLM Keys
    GEMINI_API_KEY: str = "placeholder_gemini_key"
    GROQ_API_KEY: str = "placeholder_groq_key"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
