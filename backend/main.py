from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api import auth, topics, sessions
from app.models.topic import Topic
from app.models.user import User
from app.models.achievement import Achievement

# Initialize the PostgreSQL schema tables
Base.metadata.create_all(bind=engine)

# Seed default topics if none exist
def seed_default_topics():
    db = SessionLocal()
    try:
        DEFAULT_TOPICS = [
            # Primary Topics
            {"name": "Suma y Resta Básica", "area": "Arithmetic", "level": "Primary"},
            {"name": "Multiplicación y División", "area": "Arithmetic", "level": "Primary"},
            {"name": "Introducción a Ecuaciones", "area": "Algebra", "level": "Primary"},
            {"name": "Áreas de Triángulos y Cuadrados", "area": "Geometry", "level": "Primary"},
            {"name": "Secuencias y Patrones", "area": "Algebra", "level": "Primary"},
            {"name": "Geometría y Figuras 3D", "area": "Geometry", "level": "Primary"},
            
            # Secondary Topics
            {"name": "Fracciones y Decimales", "area": "Arithmetic", "level": "Secondary"},
            {"name": "Ecuaciones Cuadráticas", "area": "Algebra", "level": "Secondary"},
            {"name": "Razones Trigonométricas", "area": "Trigonometry", "level": "Secondary"},
            {"name": "Teorema de Pitágoras", "area": "Geometry", "level": "Secondary"},
            {"name": "Sistemas de Ecuaciones", "area": "Algebra", "level": "Secondary"},
            {"name": "Permutaciones y Combinaciones", "area": "Statistics", "level": "Secondary"},
            
            # University Topics
            {"name": "Límites y Continuidad", "area": "Calculus", "level": "University"},
            {"name": "Álgebra Lineal y Matrices", "area": "Algebra", "level": "University"},
            {"name": "Distribuciones de Probabilidad", "area": "Statistics", "level": "University"},
            {"name": "Derivadas e Integrales", "area": "Calculus", "level": "University"},
            {"name": "Ecuaciones Diferenciales", "area": "Calculus", "level": "University"},
            {"name": "Pruebas de Hipótesis", "area": "Statistics", "level": "University"},
        ]
        seeded_new = False
        for t in DEFAULT_TOPICS:
            existing = db.query(Topic).filter(Topic.name == t["name"], Topic.level == t["level"]).first()
            if not existing:
                db_topic = Topic(name=t["name"], area=t["area"], level=t["level"])
                db.add(db_topic)
                seeded_new = True
        if seeded_new:
            db.commit()
            print("Successfully seeded default math topics!")
    finally:
        db.close()

seed_default_topics()

# Seed default demo user if none exists
def seed_demo_user():
    from app.models.user import User
    from app.core.security import get_password_hash
    db = SessionLocal()
    try:
        demo_email = "estudiante@neuralmath.edu"
        existing = db.query(User).filter(User.email == demo_email).first()
        if not existing:
            demo_user = User(
                name="Estudiante Demo",
                email=demo_email,
                password_hash=get_password_hash("Matematicas123"),
                level="Secondary",
                xp_total=230,
                streak_days=3
            )
            db.add(demo_user)
            db.commit()
            print("Successfully seeded default demo user!")
    finally:
        db.close()

seed_demo_user()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Math Learning Platform MVP",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(topics.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to NeuralMath API! Server is running."}
