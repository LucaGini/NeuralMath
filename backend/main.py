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
            {
                "name": "Suma y Resta Básica", 
                "area": "Arithmetic", 
                "level": "Primary",
                "subtopics": [
                    {"name": "Sumas de una cifra", "description": "Aprende a sumar números del 1 al 9 usando divertidos objetos visuales."},
                    {"name": "Restas con llevadas", "description": "Aprende a restar números de dos cifras comprendiendo cómo pedir prestado."},
                    {"name": "Problemas cotidianos", "description": "Usa sumas y restas para resolver situaciones del día a día, como contar dulces o juguetes."}
                ]
            },
            {
                "name": "Multiplicación y División", 
                "area": "Arithmetic", 
                "level": "Primary",
                "subtopics": [
                    {"name": "Tablas de multiplicar", "description": "Descubre patrones divertidos para memorizar y entender las tablas del 1 al 10."},
                    {"name": "División exacta", "description": "Aprende a repartir cantidades en partes iguales sin que sobre nada."},
                    {"name": "Multiplicaciones rápidas", "description": "Resuelve multiplicaciones de dos cifras de forma mental y sencilla."}
                ]
            },
            {
                "name": "Introducción a Ecuaciones", 
                "area": "Algebra", 
                "level": "Primary",
                "subtopics": [
                    {"name": "Equilibrio de balanzas", "description": "Descubre cómo equilibrar pesos para entender la igualdad matemática."},
                    {"name": "Incógnitas simples", "description": "Encuentra el valor del número escondido detrás de una figura o letra."},
                    {"name": "Operaciones inversas", "description": "Despeja la incógnita usando la operación contraria paso a paso."}
                ]
            },
            {
                "name": "Áreas de Triángulos y Cuadrados", 
                "area": "Geometry", 
                "level": "Primary",
                "subtopics": [
                    {"name": "Área del cuadrado", "description": "Multiplica lado por lado para saber cuánto espacio ocupa un cuadrado."},
                    {"name": "Área del triángulo", "description": "Aprende la famosa regla de base por altura dividido entre dos."},
                    {"name": "Problemas prácticos de área", "description": "Calcula cuántas baldosas o césped se necesita para cubrir una habitación o jardín."}
                ]
            },
            {
                "name": "Secuencias y Patrones", 
                "area": "Algebra", 
                "level": "Primary",
                "subtopics": [
                    {"name": "Secuencias numéricas", "description": "Completa series sumando o restando un número constante."},
                    {"name": "Patrones geométricos", "description": "Identifica qué figura sigue en una serie de formas de colores."},
                    {"name": "Series de figuras", "description": "Analiza cómo crecen las estructuras y dibuja el siguiente paso."}
                ]
            },
            {
                "name": "Geometría y Figuras 3D", 
                "area": "Geometry", 
                "level": "Primary",
                "subtopics": [
                    {"name": "Cuerpos geométricos", "description": "Identifica cubos, esferas, cilindros y pirámides en tu casa."},
                    {"name": "Vértices, caras y aristas", "description": "Cuenta las partes de una figura 3D para describirla como un experto."},
                    {"name": "Despliegue de figuras", "description": "Aprende cómo armar una caja de cartón a partir de un plano plano."}
                ]
            },
            
            # Secondary Topics
            {
                "name": "Fracciones y Decimales", 
                "area": "Arithmetic", 
                "level": "Secondary",
                "subtopics": [
                    {"name": "Suma y resta de fracciones", "description": "Aprende a usar el mínimo común múltiplo para sumar fracciones de distinto denominador."},
                    {"name": "Fracciones equivalentes", "description": "Simplifica y amplifica fracciones para ver que representan la misma porción."},
                    {"name": "Conversión a decimales", "description": "Divide el numerador entre el denominador para transformar cualquier fracción a decimal."}
                ]
            },
            {
                "name": "Ecuaciones Cuadráticas", 
                "area": "Algebra", 
                "level": "Secondary",
                "subtopics": [
                    {"name": "Factorización de trinomios", "description": "Aprende a descomponer un trinomio en el producto de dos binomios simples."},
                    {"name": "Fórmula cuadrática general", "description": "Usa la fórmula clásica para resolver cualquier ecuación de segundo grado."},
                    {"name": "Análisis del discriminante", "description": "Determina cuántas soluciones tiene una ecuación cuadrática sin tener que resolverla."}
                ]
            },
            {
                "name": "Razones Trigonométricas", 
                "area": "Trigonometry", 
                "level": "Secondary",
                "subtopics": [
                    {"name": "Seno, Coseno y Tangente", "description": "Comprende las razones fundamentales relacionando los lados de un triángulo rectángulo."},
                    {"name": "Resolución de triángulos", "description": "Encuentra la longitud de los lados y los ángulos faltantes usando las razones básicas."},
                    {"name": "Problemas de aplicación", "description": "Usa ángulos de elevación y depresión para calcular alturas de árboles o edificios distantes."}
                ]
            },
            {
                "name": "Teorema de Pitágoras", 
                "area": "Geometry", 
                "level": "Secondary",
                "subtopics": [
                    {"name": "Cálculo de la hipotenusa", "description": "Calcula el lado más largo de un triángulo rectángulo usando la suma de los cuadrados."},
                    {"name": "Cálculo de los catetos", "description": "Despeja un cateto a partir de la hipotenusa y el otro cateto conocido."},
                    {"name": "Distancia entre dos puntos", "description": "Aplica el teorema en un plano cartesiano para hallar la distancia más corta."}
                ]
            },
            {
                "name": "Sistemas de Ecuaciones", 
                "area": "Algebra", 
                "level": "Secondary",
                "subtopics": [
                    {"name": "Método de sustitución", "description": "Despeja una variable en una ecuación y colócala en la otra para resolver el sistema."},
                    {"name": "Método de reducción", "description": "Suma o resta ecuaciones multiplicadas por constantes para eliminar una variable al instante."},
                    {"name": "Problemas verbales 2x2", "description": "Plantea sistemas de dos ecuaciones para resolver problemas de mezclas o compras."}
                ]
            },
            {
                "name": "Permutaciones y Combinaciones", 
                "area": "Statistics", 
                "level": "Secondary",
                "subtopics": [
                    {"name": "Cálculo de factoriales", "description": "Comprende cómo multiplicar números en cuenta regresiva para contar ordenamientos."},
                    {"name": "Permutaciones", "description": "Calcula cuántos grupos ordenados puedes formar cuando el orden sí importa."},
                    {"name": "Combinaciones", "description": "Calcula cuántos equipos o subconjuntos puedes formar cuando el orden no tiene relevancia."}
                ]
            },
            
            # University Topics
            {
                "name": "Límites y Continuidad", 
                "area": "Calculus", 
                "level": "University",
                "subtopics": [
                    {"name": "Límites laterales", "description": "Analiza el comportamiento de una función al acercarte por la izquierda y la derecha."},
                    {"name": "Indeterminaciones 0/0", "description": "Aprende a factorizar o racionalizar para eliminar divisiones por cero."},
                    {"name": "Asíntotas y límites al infinito", "description": "Determina cómo se comporta una función cuando los valores crecen sin límite."}
                ]
            },
            {
                "name": "Álgebra Lineal y Matrices", 
                "area": "Algebra", 
                "level": "University",
                "subtopics": [
                    {"name": "Multiplicación de matrices", "description": "Aprende la regla de fila por columna para multiplicar arreglos bidimensionales."},
                    {"name": "Determinantes y regla de Cramer", "description": "Calcula determinantes de 2x2 y 3x3 para resolver sistemas lineales de forma directa."},
                    {"name": "Eliminación de Gauss-Jordan", "description": "Aplica operaciones elementales de fila para escalonar matrices y hallar su inversa."}
                ]
            },
            {
                "name": "Distribuciones de Probabilidad", 
                "area": "Statistics", 
                "level": "University",
                "subtopics": [
                    {"name": "Distribución binomial", "description": "Calcula probabilidades de éxito o fracaso en múltiples ensayos independientes."},
                    {"name": "Distribución normal estándar", "description": "Usa la campana de Gauss para analizar variables continuas."},
                    {"name": "Cálculo de Z-scores", "description": "Estandariza cualquier variable para hallar áreas y probabilidades bajo la curva normal."}
                ]
            },
            {
                "name": "Derivadas e Integrales", 
                "area": "Calculus", 
                "level": "University",
                "subtopics": [
                    {"name": "Regla de la cadena", "description": "Aprende a derivar funciones compuestas aplicando la regla de adentro hacia afuera."},
                    {"name": "Optimización de funciones", "description": "Halla máximos y mínimos locales para resolver problemas de diseño o economía."},
                    {"name": "Integral definida y áreas", "description": "Aplica el Teorema Fundamental del Cálculo para hallar áreas exactas bajo curvas complejas."}
                ]
            },
            {
                "name": "Ecuaciones Diferenciales", 
                "area": "Calculus", 
                "level": "University",
                "subtopics": [
                    {"name": "Variables separables", "description": "Resuelve ecuaciones diferenciales ordinarias agrupando cada variable en un lado de la igualdad."},
                    {"name": "Ecuaciones lineales de primer orden", "description": "Usa el factor integrante para resolver ecuaciones dinámicas continuas."},
                    {"name": "Modelado de poblaciones", "description": "Plantea y resuelve ecuaciones diferenciales para predecir el crecimiento poblacional o de calor."}
                ]
            },
            {
                "name": "Pruebas de Hipótesis", 
                "area": "Statistics", 
                "level": "University",
                "subtopics": [
                    {"name": "Planteamiento de H0 y H1", "description": "Define formalmente las hipótesis nula y alternativa para experimentos científicos."},
                    {"name": "Prueba Z y t de Student", "description": "Calcula estadísticas de prueba para comparar medias de muestras simples."},
                    {"name": "Interpretación del p-valor", "description": "Toma decisiones estadísticas basadas en el p-valor frente al nivel de significancia alfa."}
                ]
            },
        ]
        seeded_new = False
        for t in DEFAULT_TOPICS:
            existing = db.query(Topic).filter(Topic.name == t["name"], Topic.level == t["level"]).first()
            if not existing:
                db_topic = Topic(
                    name=t["name"], 
                    area=t["area"], 
                    level=t["level"],
                    subtopics=t.get("subtopics")
                )
                db.add(db_topic)
                seeded_new = True
            else:
                # Update subtopics if missing or updated
                if existing.subtopics != t.get("subtopics"):
                    existing.subtopics = t.get("subtopics")
                    seeded_new = True
        if seeded_new:
            db.commit()
            print("Successfully seeded default math topics and subtopics!")
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
