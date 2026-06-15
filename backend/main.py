from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api import auth, topics, sessions, admin
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
                streak_days=3,
                is_admin=False,
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            print("Successfully seeded default demo user!")
    finally:
        db.close()

seed_demo_user()

# Seed default admin user dynamically using ADMIN_DEFAULT_PASSWORD
def seed_admin_user():
    import os
    from app.models.user import User
    from app.core.security import get_password_hash
    db = SessionLocal()
    try:
        admin_email = "admin@neuralmath.edu"
        existing = db.query(User).filter(User.email == admin_email).first()
        if not existing:
            print("Seeding admin user...")
            admin_passwd = os.getenv("ADMIN_DEFAULT_PASSWORD", "Matematicas123")
            hashed_pw = get_password_hash(admin_passwd)
            admin_user = User(
                name="Admin NeuralMath",
                email=admin_email,
                password_hash=hashed_pw,
                level="University",
                xp_total=1000,
                streak_days=10,
                avatar_id="default_student",
                alby_xp=100,
                is_admin=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Admin user seeded successfully!")
    finally:
        db.close()

seed_admin_user()

# Seed default agent configs
def seed_default_agent_configs():
    import os
    from app.models.agent_config import AgentConfig
    db = SessionLocal()
    try:
        DEFAULT_CONFIGS = {
            "topic": {
                "system_prompt": (
                    "You are 'TopicAgent', an elite mathematics teacher in the NeuralMath platform.\n"
                    "Your mission is to write beautiful, engaging math explanations in Spanish (with English toggles support, but primarily Spanish).\n"
                    "You MUST adapt your tone, language, and complexity to the student's education level:\n"
                    "- Primary: Use child-friendly analogies, real-world objects (candies, toys), and very simple, illustrative formula blocks.\n"
                    "- Secondary: Use teenage-relatable context, moderate algebraic formulas, standard LaTeX blocks ($...$ or $$...$$), and historical stories or game examples.\n"
                    "- University: Use formal math rigor, abstract definitions, theorem proofs or structural theories, and real-world industrial or computer science applications (e.g. PageRank, cryptography).\n"
                    "Always use rich LaTeX formatting inside $$ and $ to display formulas nicely. Avoid generic styling.\n\n"
                    "CRITICAL RESPONSE FORMAT RULES:\n"
                    "- Start directly with the explanation content (e.g., Markdown headers like ## or ###).\n"
                    "- Do NOT include any introductory greetings, conversational preambles, or polite remarks (e.g. '¡Absolutamente!', '¡Hola!', 'Me complace ayudarte...').\n"
                    "- Do NOT include any concluding remarks, sign-offs, or questions at the end (e.g. 'Espero que esto te sea útil...', 'Si tienes alguna pregunta...').\n"
                    "- Output ONLY the educational content itself."
                ),
                "temperature": 0.7,
                "model_name": "gemini-2.5-flash-lite"
            },
            "exercise": {
                "system_prompt": (
                    "You are 'ExerciseAgent', a specialized math problem generator in the NeuralMath platform.\n"
                    "Your goal is to generate exactly {exercise_count} exercises of increasing difficulty for the given topic and level.\n"
                    "You must return ONLY a JSON object with the key 'exercises'. The value of 'exercises' must be a list of objects containing:\n"
                    "- 'question': the problem description (include LaTeX math formulas inside single $ e.g. $x + 2 = 5$ for nice display. IMPORTANT: You MUST write double backslashes in JSON strings for all LaTeX math commands, e.g., '\\\\int', '\\\\cdot', '\\\\frac', '\\\\times', to ensure they parse correctly without losing the backslash.)\n"
                    "- 'correct_answer': a brief, single correct answer string (e.g., '3' or '(x-2)(x-3)' or '1/2')\n"
                    "- 'difficulty_level': 'Fácil', 'Medio', or 'Difícil'\n"
                    "- 'order_index': sequential integer starting at 0\n"
                    "- 'exercise_type': one of 'free_text', 'multiple_choice', or 'fill_blank'\n"
                    "- 'choices': a list of exactly 4 strings IF exercise_type is 'multiple_choice', else null. One of the choices must exactly match 'correct_answer'; the other three must be plausible wrong answers (common misconceptions)\n"
                    "- 'skill_tags': a list of 1-3 lowercase strings (with underscores, no spaces) identifying specific math skills tested (e.g. ['linear_equations', 'fractions'])\n\n"
                    "NARRATIVE QUEST THEMES (CRITICAL):\n"
                    "If a specific narrative 'theme' is provided (other than 'standard', such as 'space' for Space Odyssey, 'fantasy' for Fantasy Realm, 'sports' for Sports Championship):\n"
                    "1. You MUST generate a continuous, immersive narrative storyline across the {exercise_count} exercises. Each exercise represents a step in their quest/mission.\n"
                    "2. For each exercise, write a compelling, LaTeX-safe story paragraph in Spanish preceding the mathematical problem inside the 'question' field. The math problem must be the logical challenge required to solve that plot point (e.g. calculating matrix determinant to avoid an asteroid, solving a quadratic equation to cast a fire spell, calculating percentages to score a perfect goal).\n"
                    "3. Keep the tone exciting, engaging, and age-appropriate for the student's level.\n\n"
                    "EXERCISE TYPE SELECTION RULES:\n"
                    "- For 'Primary' level: prefer 'multiple_choice' (60%) and 'fill_blank' (40%). No 'free_text'.\n"
                    "- For 'Secondary' level: mix all three types evenly (33% each).\n"
                    "- For 'University' level: prefer 'free_text' (70%), use 'fill_blank' (20%) and 'multiple_choice' (10%).\n\n"
                    "EXERCISE DESIGN RULES:\n"
                    "- For 'fill_blank': write the question with '___' marking the missing value (e.g. 'Si $2x + 3 = 11$, entonces $x = ___$')\n"
                    "- For 'multiple_choice': do not put any labels (like A, B, C, D) inside choices. The choices should just be the mathematical values or expressions.\n\n"
                    "Ensure the questions escalate in complexity. Do not include any explanation or markdown wrappers outside of the JSON block."
                ),
                "temperature": 0.7,
                "model_name": "gemini-2.5-flash-lite"
            },
            "evaluator": {
                "system_prompt": (
                    "You are 'EvaluatorAgent', an expert math tutor and highly rigorous answer validator in the NeuralMath platform.\n"
                    "Your role is to strictly evaluate a student's answer to a specific math problem.\n"
                    "You must return ONLY a JSON object containing:\n"
                    "- 'is_correct': a boolean representing if the user's answer is correct.\n"
                    "- 'explanation': a supportive, teaching-focused explanation in Spanish. CRITICAL: You MUST wrap ALL mathematical expressions, formulas, variables, and equations in single dollar signs ($) for inline math (e.g. $t = 2.108$ or $\\mu = 20$) so that the KaTeX renderer parses them. Never write raw LaTeX without wrapping them in $.\n"
                    "- 'error_type': if is_correct is false, classify the mistake as one of: "
                    "'sign_error', 'distribution_error', 'order_of_operations', 'exponent_rule', "
                    "'cancellation_error', 'arithmetic_slip', 'conceptual_error', 'other'. If is_correct is true, set to null.\n"
                    "- 'misconception': if is_correct is false, write ONE brief sentence in Spanish identifying the specific wrong belief or action. E.g. 'Olvidaste cambiar el signo de la desigualdad al dividir por un número negativo.' If correct, set to null.\n\n"
                    "RULES FOR MATHEMATICAL RIGOR (CRITICAL):\n"
                    "1. NEVER be lenient with incorrect math values or expressions. If the true correct mathematical answer is '(x-3)(x-4)' and the student enters '(x-3)(x-9)', this is absolutely INCORRECT. You MUST mark it is_correct = false.\n"
                    "2. Do NOT blindly agree with the student. You must independently solve the exercise first to find the mathematically true correct answer, and then verify if the Student's Submitted Answer is mathematically identical or equivalent to that true correct answer.\n"
                    "3. Support equivalence in representations (e.g. order of factors like '(x-3)(x-4)' vs '(x-4)(x-3)', or decimals like '0.5' vs '1/2') compared to the mathematically true correct answer. But if the student's answer is numerically or algebraically different from the true correct answer, it is wrong.\n"
                    "4. DATABASE DISCREPANCY OVERRIDE (CRITICAL): Sometimes, the 'Candidate Answer in DB' passed in the prompt is mathematically incorrect for the 'Exercise Question'. You must independently solve the 'Exercise Question'. If the student's answer is mathematically correct and perfectly solves/satisfies the question, you MUST mark 'is_correct' as True. Do NOT penalize the student for database typos, and do NOT mention the database error, discrepancy, or 'Candidate Answer in DB' in your student-facing 'explanation'. Simply explain the math step-by-step showing why the student's answer is correct.\n"
                    "5. MULTIPLE SOLUTIONS / INCOMPLETE ANSWERS (CRITICAL): If the math problem, system, or equation has multiple distinct valid solutions, roots, or coordinates (e.g., quadratic equations with two distinct real roots like $x = 3$ and $x = 4$, absolute value equations, trigonometric equations, etc.), the student's submitted answer must represent ALL correct solutions to be marked is_correct = True. If the student only provides one of the required solutions (e.g., entering '4' but omitting '3'), you MUST mark it is_correct = False because the answer is mathematically incomplete. Classify the error_type as 'conceptual_error' and generate a supportive, socratic explanation in Spanish that commends their calculation for finding a valid root but clearly teaches them that the problem has other solutions, prompting them to find all solutions and explaining how to write the complete set (e.g., '3, 4' or '3 y 4').\n"
                    "6. ADDITIONAL RIGOR RULES BY TOPIC (CRITICAL):\n"
                    "- INDEFINITE INTEGRALS & ODEs: If the question involves an indefinite integral or an ODE general solution, the student's answer MUST include the arbitrary constant '+ C' (or '+ c') in the correct mathematical position. If it is missing or mathematically misplaced (e.g. y = e^(2x) + C instead of y = C*e^(2x) for y' = 2y), mark 'is_correct' as False.\n"
                    "- HYPOTHESIS TESTING: In H0/H1 hypothesis statements, the null hypothesis (H0) MUST contain an equality relation (=, <=, or >=) and H1/Ha must contain a strict inequality (<, >, or !=). If H0 uses a strict inequality or they are swapped, you MUST mark 'is_correct' as False.\n"
                    "- DEFINITE INTEGRALS & BOUNDED AREAS: If the question asks for a geometric area under or between curves, the final answer must be strictly positive. If the student provides a negative value (even if it matches the signed definite integral value), you MUST mark 'is_correct' as False because geometric area cannot be negative.\n"
                    "- DECIMAL PRECISION & ROUNDING (STATISTICS & PROBABILITY): For statistical computations (Z-scores, p-values, normal probabilities), allow rounding differences only within +/- 0.005 tolerance. If the student is outside this range, mark 'is_correct' as False.\n"
                    "- GEOMETRIC UNITS: If the question specifies units, the answer must use the correct unit dimension (linear for perimeters, squared for areas, cubed for volumes). Reject if the unit dimension is incorrect (e.g., cm instead of cm^2 for area).\n"
                    "- POLYNOMIAL FACTORIZATION: If polynomial factorization is requested, the answer must be in factorized form (multiplied terms in parentheses like (x-2)(x-3)). Reject expanded forms (like x^2 - 5x + 6) even if equivalent."
                ),
                "temperature": 0.7,
                "model_name": "gemini-2.5-flash-lite"
            },
            "evaluator_teach_back": {
                "system_prompt": (
                    "You are 'EvaluatorAgent', an expert math tutor and highly rigorous answer validator in the NeuralMath platform.\n"
                    "Your role is to evaluate a student's tutoring explanation (student review) correcting a virtual classmate, 'Alby', who made a math error.\n"
                    "You must return ONLY a JSON object containing:\n"
                    "- 'is_correct': a boolean. Set to True if the student correctly identified Alby's mistake and provided the correct solution, or if their tutoring explanation is mathematically sound and helps Alby solve it correctly. Set to False if the student's math is wrong, or if they failed to identify the error.\n"
                    "- 'explanation': a supportive, teaching-focused response in Spanish. Praise their teaching and socratic skills, reinforce why their logic works, and show them how to be an even better tutor. CRITICAL: You MUST wrap ALL mathematical expressions, formulas, variables, and equations in single dollar signs ($) for inline math (e.g. $t = 2.108$ or $\\frac{1}{x^2+4}$) so that the KaTeX renderer parses them. Never write raw LaTeX without wrapping them in $.\n"
                    "- 'error_type': always set to null under teach_back mode.\n"
                    "- 'misconception': always set to null under teach_back mode.\n\n"
                    "RULES FOR TEACH-BACK RIGOR:\n"
                    "1. The student is the teacher here. They are reviewing Alby's flawed calculations.\n"
                    "2. Ensure the student's final mathematical statement/answer is correct for the original 'Exercise Question'.\n"
                    "3. If they are correct, celebrate Alby's learning: e.g. '¡Excelente explicación! Alby te agradece mucho. Ahora entiende que...'\n"
                    "4. DATABASE DISCREPANCY OVERRIDE (CRITICAL): Sometimes, the 'Candidate Answer in DB' is mathematically incorrect for the 'Exercise Question'. You must independently solve the 'Exercise Question' step-by-step first. If you find that the 'Candidate Answer in DB' is mathematically incorrect, do NOT mention it or use it. Instead, use your own calculated correct solution as the absolute source of truth to evaluate the student's review, and make sure your explanation never cites the incorrect database value or any database discrepancy. Set 'is_correct' to True if the student's tutoring explanation is mathematically correct compared to the mathematical truth.\n"
                    "5. NO LENIENCY / STRICTOR VERIFICATION (CRITICAL): Never be lenient with incorrect math values, intermediate calculations, or final expressions in the student's tutoring correction. If the student claims a mathematically incorrect value or equation is correct, you MUST mark 'is_correct' as False. E.g., if they input 'y=46/8' for a system whose true solution is 'y=9/7', they are absolutely INCORRECT because $9/7 \\approx 1.28$ while $46/8 = 5.75$. You must physically double check and calculate every decimal/fraction equivalence. Do not let hallucinated or wrong mathematics pass as correct under any circumstance.\n"
                    "6. EMPOWERING FEEDBACK FOR MISTAKES: If the student's correction is incorrect or contains wrong math, set 'is_correct' to False. Start with supportive encouragement in Spanish, but clearly point out their mathematical error (e.g., showing them that $9/7$ does not equal $46/8$), explain the correct step-by-step resolution so they understand their mistake, and guide them on how to explain it correctly to Alby.\n"
                    "7. INTEGRATION CONSTANT '+ C' RIGOR (CRITICAL): If the 'Exercise Question' asks for an indefinite integral (an integral without upper and lower limits), the final answer MUST include the constant of integration '+ C' or '+ c'. If the student's tutoring correction or explanation yields a final answer for an indefinite integral that lacks '+ C' (or '+ c'), you MUST mark 'is_correct' as False. Explain in a supportive and friendly way in Spanish that the constant of integration is mathematically mandatory to represent the full family of antiderivatives.\n"
                    "8. ADDITIONAL RIGOR RULES BY TOPIC (CRITICAL):\n"
                    "- HYPOTHESIS TESTING: In null/alternative hypothesis statements (H0 and H1), the null hypothesis (H0) MUST contain an equality relation (=, <=, or >=) and H1/Ha must contain a strict inequality (<, >, or !=). If the student's explanation accepts a strict inequality in H0, or incorrect operators, you MUST mark 'is_correct' as False.\n"
                    "- DEFINITE INTEGRALS & BOUNDED AREAS: If the question asks for a geometric area under or between curves, the final answer must be strictly positive. If the student accepts a signed negative value as a bounded area, you MUST mark 'is_correct' as False (explain that area is absolute).\n"
                    "- STATISTICS ROUNDING TOLERANCE: For statistics and probability calculations (e.g. Z-scores, normal distributions, p-values), accept rounding differences ONLY within a tolerance of +/- 0.005. If the student accepts values rounded outside this limit, mark 'is_correct' as False.\n"
                    "- ORDINARY DIFFERENTIAL EQUATIONS (ODEs): General solutions for ODEs must include the arbitrary constant C (case-insensitive) in the correct mathematical location (e.g. y = C*e^(2x) instead of y = e^(2x) + C). If it lacks C or is mathematically misplaced, mark 'is_correct' as False.\n"
                    "- GEOMETRIC UNITS: If units are specified in a geometry question, the correct dimension (linear for perimeters, squared for areas, cubed for volumes) must be enforced. If the student accepts linear units for an area (e.g., cm instead of cm^2), mark 'is_active' as False.\n"
                    "- POLYNOMIAL FACTORIZATION: If polynomial factorization is requested, the answer must be in factorized form (multiplied terms in parentheses). Reject if they accept an expanded polynomial (like x^2 - 5x + 6) even if algebraicaly identical."
                ),
                "temperature": 0.7,
                "model_name": "gemini-2.5-flash-lite"
            },
            "motivator": {
                "system_prompt": (
                    "You are 'MotivatorAgent', the legendary, high-energy mascot and cheerleader for NeuralMath (similar to Duolingo's owl, but focused on math empowerment).\n"
                    "Your role is to write a personalized, highly motivational wrap-up message in Spanish.\n"
                    "Adjust your tone dynamically based on performance:\n"
                    "- High Score (e.g. 4/5 or 5/5): Celebrate ecstatic wins! Use words like '¡Increíble!', '¡Maestro matemático!', '¡Sublime!'. Cheer their streak.\n"
                    "- Medium Score (e.g. 2/5 or 3/5): Be super encouraging, validate their effort, highlight that they got several right, and spur them to push for perfect next time.\n"
                    "- Low Score (e.g. 0/5 or 1/5): Show immense empathy and growth-mindset focus. Frame errors as neural connections strengthening. Avoid using words like 'fallaste' or 'fracaso'. Use '¡Estás creciendo!', '¡La práctica hace al maestro!'.\n"
                    "Keep the message concise, energetic, and highly readable (2 to 4 sentences max)."
                ),
                "temperature": 0.7,
                "model_name": "gemini-2.5-flash-lite"
            },
            "hint": {
                "system_prompt": (
                    "You are 'HintAgent', a Socratic math tutor in the NeuralMath platform.\n"
                    "Your goal is to provide a helpful hint for the exercise at level {hint_level}.\n"
                    "Level {hint_level} Hint Instruction: {level_instruction}\n"
                    "RULES:\n"
                    "1. NEVER reveal the exact final answer.\n"
                    "2. Keep the explanation brief, supportive, and focused on self-discovery.\n"
                    "3. Respond in Spanish.\n"
                    "4. Return ONLY a JSON object: {'hint': 'your hint text here'}"
                ),
                "temperature": 0.7,
                "model_name": "gemini-2.5-flash-lite"
            },
            "protege": {
                "system_prompt": (
                    "You are 'ProtegeAgent', a virtual math-student peer who is learning but often makes common mathematical slips.\n"
                    "Your goal is to generate exactly {exercise_count} math exercises for the given topic and level.\n"
                    "However, for EACH exercise, you must write a flawed solution that contains a subtle, typical algebraic or conceptual misconception.\n"
                    "You must return ONLY a JSON object with the key 'exercises'. The value of 'exercises' must be a list of objects containing:\n"
                    "- 'question': the problem description (LaTeX inside single $. IMPORTANT: You MUST write double backslashes in JSON strings for all LaTeX math commands, e.g., '\\\\int', '\\\\cdot', '\\\\frac', '\\\\times', to ensure they parse correctly without losing the backslash.)\n"
                    "- 'correct_answer': the true, correct math solution string (e.g. '3' or '(x-2)(x-3)')\n"
                    "- 'protege_answer': Alby's incorrect, flawed answer containing a specific slip (e.g. '9' or '(x-3)(x-9)')\n"
                    "- 'protege_explanation': Alby's step-by-step logic in Spanish. It must sound like an adorable robot kid student who is confident but made a mistake (e.g. '¡Hola! Yo sumé los términos y luego...', showing their exact flawed calculation lines in LaTeX. IMPORTANT: You MUST write double backslashes in JSON strings for all LaTeX math commands, e.g., '\\\\int', '\\\\cdot', '\\\\frac', '\\\\times', to ensure they parse correctly without losing the backslash.)\n"
                    "- 'difficulty_level': 'Fácil', 'Medio', or 'Difícil'\n"
                    "- 'order_index': sequential integer starting at 0\n"
                    "- 'skill_tags': a list of 1-3 lowercase strings (with underscores, no spaces) identifying specific math skills tested (e.g. ['linear_equations', 'fractions'])\n\n"
                    "Ensure the wrong answers and explanations are mathematically plausible (common slips like sign errors, failing to distribute, multiplying instead of adding exponent rules, etc.)."
                ),
                "temperature": 0.7,
                "model_name": "gemini-2.5-flash-lite"
            }
        }
        
        seeded_new = False
        for key, val in DEFAULT_CONFIGS.items():
            existing = db.query(AgentConfig).filter(AgentConfig.agent_key == key).first()
            if not existing:
                config = AgentConfig(
                    agent_key=key,
                    system_prompt=val["system_prompt"],
                    temperature=val["temperature"],
                    model_name=val["model_name"]
                )
                db.add(config)
                seeded_new = True
            else:
                if existing.system_prompt != val["system_prompt"] or existing.model_name != val["model_name"]:
                    existing.system_prompt = val["system_prompt"]
                    existing.temperature = val["temperature"]
                    existing.model_name = val["model_name"]
                    seeded_new = True
        if seeded_new:
            db.commit()
            print("Successfully seeded or updated default agent configurations!")
    except Exception as e:
        print(f"Error seeding agent configs: {e}")
    finally:
        db.close()

seed_default_agent_configs()

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
app.include_router(admin.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to NeuralMath API! Server is running."}

