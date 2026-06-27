from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuralMath"
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/neuralmath"
    JWT_SECRET: str = "super_secret_neuralmath_jwt_key_change_me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ADMIN_DEFAULT_PASSWORD: str = "Matematicas123"
    
    # LLM Keys (comma-separated for multi-key rotation)
    GEMINI_API_KEYS: str = ""
    GEMINI_API_KEY: str = "placeholder_gemini_key"
    GROQ_API_KEYS: str = ""
    GROQ_API_KEY: str = "placeholder_groq_key"
    CEREBRAS_API_KEYS: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
