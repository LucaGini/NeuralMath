import os
import json
import logging
import random
from google import genai
from google.genai import types
from groq import Groq
from typing import Optional, Dict, Any, List


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def call_llm(prompt: str, system_instruction: Optional[str] = None, json_mode: bool = False) -> str:
    """
    Tries to call Gemini 2.0 Flash. On failure, falls back to Groq (Llama 3.3 70B).
    If both are unavailable, runs a highly intelligent local math simulator.
    """
    
    # 1. Try Gemini 2.0 Flash via new google-genai SDK
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and gemini_key not in ["placeholder_gemini_key", "your_gemini_api_key_here", ""]:
        try:
            logger.info("Attempting to call Gemini 2.0 Flash...")
            client = genai.Client(api_key=gemini_key)
            
            # Setup configuration utilizing GenerateContentConfig
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json" if json_mode else None,
                temperature=0.7
            )
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=config
            )
            if response and response.text:
                return response.text
        except Exception as e:
            logger.error(f"Gemini API failure: {e}. Trying Groq...")

    # 2. Try Groq (Llama 3.3 70B)
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key not in ["placeholder_groq_key", "your_groq_api_key_here", ""]:
        try:
            logger.info("Attempting to call Groq (Llama 3.3 70B)...")
            client = Groq(api_key=groq_key)
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})
            
            response_format = None
            if json_mode:
                response_format = {"type": "json_object"}
                
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                response_format=response_format,
                temperature=0.7
            )
            if completion and completion.choices:
                return completion.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq API failure: {e}. Falling back to Local Simulator...")

    # 3. Graceful Local Simulator Fallback
    logger.warning("No active LLM keys. Utilizing internal Local Math Simulator.")
    return get_local_mock_response(prompt, system_instruction, json_mode)

def get_local_mock_response(prompt: str, system_instruction: Optional[str] = None, json_mode: bool = False) -> str:
    """
    A smart local fallback that parses the prompt and generates fully-structured explanations,
    exercises, evaluations, and motivators. Fully supports Spanish/English toggling and KaTeX!
    """
    prompt_lower = prompt.lower()
    system_lower = (system_instruction or "").lower()

    # Case C: Evaluation (EvaluatorAgent)
    if "evaluator" in system_lower or "evaluate" in prompt_lower or "evaluar" in prompt_lower:
        # Parse what question is being evaluated and what the user's answer is
        user_ans = "unknown"
        correct_ans = "unknown"
        
        lines = prompt.split("\n")
        for line in lines:
            if ":" in line:
                parts = line.split(":", 1)
                key = parts[0].lower()
                value = parts[1].strip()
                if "submitted" in key or "user" in key:
                    user_ans = value
                elif "correct" in key or "expected" in key:
                    correct_ans = value
        
        # Simple cleanup
        user_ans_clean = user_ans.replace("$", "").replace(" ", "").replace("\"", "").replace("'", "").lower()
        correct_ans_clean = correct_ans.replace("$", "").replace(" ", "").replace("\"", "").replace("'", "").lower()

        # Check if correct
        is_correct = False
        if user_ans_clean == correct_ans_clean:
            is_correct = True
        elif user_ans_clean.isdigit() and correct_ans_clean.isdigit():
            is_correct = int(user_ans_clean) == int(correct_ans_clean)
        else:
            # Dynamic factor order-independent check: e.g. (x-3)(x-4) matches (x-4)(x-3)
            import re
            user_factors = sorted(re.findall(r'\(([^)]+)\)', user_ans_clean))
            correct_factors = sorted(re.findall(r'\(([^)]+)\)', correct_ans_clean))
            if user_factors and correct_factors and user_factors == correct_factors:
                is_correct = True
            # Limits cleanup check: e.g. "3/2" matches "\frac{3}{2}"
            elif "3/2" in user_ans_clean and "3/2" in correct_ans_clean:
                is_correct = True
            elif "3/2" in user_ans_clean and "frac{3}{2}" in correct_ans_clean:
                is_correct = True
            elif "pi/4" in user_ans_clean and "pi/4" in correct_ans_clean:
                is_correct = True
            elif "pi/4" in user_ans_clean and "frac{\pi}{4}" in correct_ans_clean:
                is_correct = True
        
        explanation = ""
        if is_correct:
            explanation = f"¡Excelente! Tu respuesta **{user_ans}** es completamente correcta. Has aplicado los pasos matemáticos correctos paso a paso. Recuerda que la fórmula matemática se puede visualizar como: $x = {correct_ans}$."
        else:
            explanation = f"No es del todo correcto, pero es una excelente oportunidad para aprender. Tu respuesta fue **{user_ans}**, pero el resultado correcto es **{correct_ans}**. El error común aquí suele ser en el despeje o los signos. Recuerda: al mover un término, su signo cambia. ¡Sigue adelante, la constancia hace al maestro!"

        return json.dumps({
            "is_correct": is_correct,
            "explanation": explanation
        })

    # Case B: Explanation (TopicAgent)
    elif "topic" in system_lower or "explain" in prompt_lower or "explicación" in prompt_lower:
        level = "Primary"
        if "secondary" in prompt_lower or "secundaria" in prompt_lower:
            level = "Secondary"
        elif "university" in prompt_lower or "universidad" in prompt_lower or "universitaria" in prompt_lower:
            level = "University"

        topic = "Algebra"
        if any(w in prompt_lower or w in system_lower for w in ["limite", "continuidad", "derivada", "integral", "calculus"]):
            topic = "Calculus"
        elif any(w in prompt_lower or w in system_lower for w in ["pitagora", "rectangulo", "triangulo", "area", "geometry"]):
            topic = "Geometry"
        elif any(w in prompt_lower or w in system_lower for w in ["trigono", "seno", "coseno", "tangente"]):
            topic = "Trigonometry"
        elif any(w in prompt_lower or w in system_lower for w in ["probabil", "distribucion", "dado", "statistics"]):
            topic = "Statistics"
        elif any(w in prompt_lower or w in system_lower for w in ["suma", "resta", "multipli", "divisi", "fracci", "decimal", "arithmetic"]):
            topic = "Arithmetic"
        elif any(w in prompt_lower or w in system_lower for w in ["ecuacion", "cuadratica", "matriz", "algebra"]):
            topic = "Algebra"

        return get_mock_explanation(topic, level)

    # Case D: Motivator (MotivatorAgent)
    elif "motivator" in system_lower or "score:" in prompt_lower or "motivation" in prompt_lower:
        score = 5
        if "score: 0" in prompt_lower or "score: 1" in prompt_lower:
            score = 1
        elif "score: 2" in prompt_lower or "score: 3" in prompt_lower:
            score = 3
        
        if score >= 4:
            return "¡Increíble desempeño! Has demostrado un dominio absoluto de este tema. Sigue con esta racha diaria para desbloquear nuevos niveles. ¡Eres un verdadero matemático estrella!"
        elif score >= 2:
            return "¡Buen trabajo! Has logrado resolver varios ejercicios correctamente. Con un poco más de práctica lograrás el puntaje perfecto. ¡No te detengas ahora!"
        else:
            return "¡No te rindas! Cada error es un paso más cerca del entendimiento. Repasa la explicación interactiva y vuelve a intentarlo. ¡La perseverancia es la clave en las matemáticas!"

    # Case A: Exercise Generation (expects JSON list of questions)
    else:
        # Determine topic and level from prompt
        level = "Primary"
        if "secondary" in prompt_lower or "secundaria" in prompt_lower:
            level = "Secondary"
        elif "university" in prompt_lower or "universidad" in prompt_lower or "universitaria" in prompt_lower:
            level = "University"
            
        topic = "Algebra"
        if any(w in prompt_lower or w in system_lower for w in ["limite", "continuidad", "derivada", "integral", "calculus"]):
            topic = "Calculus"
        elif any(w in prompt_lower or w in system_lower for w in ["pitagora", "rectangulo", "triangulo", "area", "geometry"]):
            topic = "Geometry"
        elif any(w in prompt_lower or w in system_lower for w in ["trigono", "seno", "coseno", "tangente"]):
            topic = "Trigonometry"
        elif any(w in prompt_lower or w in system_lower for w in ["probabil", "distribucion", "dado", "statistics"]):
            topic = "Statistics"
        elif any(w in prompt_lower or w in system_lower for w in ["suma", "resta", "multipli", "divisi", "fracci", "decimal", "arithmetic"]):
            topic = "Arithmetic"
        elif any(w in prompt_lower or w in system_lower for w in ["ecuacion", "cuadratica", "matriz", "algebra"]):
            topic = "Algebra"

        exercises = get_mock_exercises(topic, level)
        return json.dumps({"exercises": exercises})

def get_mock_exercises(topic: str, level: str, area: str = "Arithmetic") -> List[Dict[str, Any]]:
    """Generates highly customized and randomized mock math questions based on topic, area, and level."""
    topic_lower = topic.lower()
    area_lower = area.lower()

    # 1. SPECIAL CASE: "Suma y Resta Básica" (strictly addition & subtraction)
    if "suma" in topic_lower or "resta" in topic_lower or "addition" in topic_lower or "subtraction" in topic_lower:
        # Generate strictly addition and subtraction problems
        exercises = []
        # Q0: Easy addition
        a = random.randint(10, 50)
        b = random.randint(5, 40)
        exercises.append({
            "question": f"¿Cuánto es ${a} + {b}$?",
            "correct_answer": str(a + b),
            "difficulty_level": "Fácil",
            "order_index": 0
        })
        # Q1: Easy subtraction
        a = random.randint(30, 90)
        b = random.randint(5, a - 5)
        exercises.append({
            "question": f"¿Cuánto es ${a} - {b}$?",
            "correct_answer": str(a - b),
            "difficulty_level": "Fácil",
            "order_index": 1
        })
        # Q2: Word problem addition/subtraction
        a = random.randint(15, 60)
        b = random.randint(3, a - 2)
        exercises.append({
            "question": f"Si tienes ${a}$ manzanas y le regalas ${b}$ a tu hermano, ¿cuántas manzanas te quedan?",
            "correct_answer": str(a - b),
            "difficulty_level": "Medio",
            "order_index": 2
        })
        # Q3: Medium operation A + B - C
        a = random.randint(15, 45)
        b = random.randint(10, 35)
        c = random.randint(5, a + b - 5)
        exercises.append({
            "question": f"Resuelve: ${a} + {b} - {c}$",
            "correct_answer": str(a + b - c),
            "difficulty_level": "Medio",
            "order_index": 3
        })
        # Q4: Hard subtraction/addition combination
        a = random.randint(60, 150)
        b = random.randint(20, 55)
        c = random.randint(10, 45)
        exercises.append({
            "question": f"Calcula la suma y resta combinada: ${a} - {b} + {c}$",
            "correct_answer": str(a - b + c),
            "difficulty_level": "Difícil",
            "order_index": 4
        })
        return exercises

    # 2. STANDARD ROUTING BY MATHEMATICAL AREA
    # --- ARITHMETIC ---
    if area_lower == "arithmetic" or "aritmetica" in area_lower or "aritmética" in area_lower:
        if level == "Primary":
            # Division / Multiplication Primary
            exercises = []
            # Q0: Simple product
            a = random.randint(3, 9)
            b = random.randint(2, 9)
            exercises.append({
                "question": f"¿Cuánto es ${a} \\times {b}$?",
                "correct_answer": str(a * b),
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Simple exact division
            b = random.randint(2, 8)
            ans = random.randint(3, 9)
            a = b * ans
            exercises.append({
                "question": f"¿Cuánto es ${a} \\div {b}$?",
                "correct_answer": str(ans),
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Word problem
            boxes = random.randint(3, 6)
            per_box = random.randint(4, 8)
            exercises.append({
                "question": f"Si tienes ${boxes}$ bolsas con ${per_box}$ caramelos cada una, ¿cuántos caramelos tienes en total?",
                "correct_answer": str(boxes * per_box),
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Division word problem
            total = random.randint(12, 36)
            friends = random.choice([2, 3, 4])
            # Adjust total to be perfectly divisible
            total = (total // friends) * friends
            exercises.append({
                "question": f"Si quieres repartir ${total}$ chocolates equitativamente entre ${friends}$ amigos, ¿cuántos recibe cada uno?",
                "correct_answer": str(total // friends),
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Combined operations
            a = random.randint(2, 6)
            b = random.randint(3, 6)
            c = random.randint(5, 12)
            exercises.append({
                "question": f"¿Cuánto es $({a} + {b}) \\times {c}$?",
                "correct_answer": str((a + b) * c),
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        elif level == "Secondary":
            # Fractions and Decimal arithmetic
            exercises = []
            # Q0: Decimal calculation
            a = round(random.uniform(1.1, 5.9), 1)
            b = round(random.uniform(0.5, 3.5), 1)
            exercises.append({
                "question": f"Calcula la suma decimal: ${a} + {b}$",
                "correct_answer": f"{round(a + b, 2)}",
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Decimal product
            a = random.choice([0.1, 0.2, 0.5, 1.5])
            b = random.randint(10, 80)
            exercises.append({
                "question": f"Calcula el producto: ${a} \\times {b}$",
                "correct_answer": f"{round(a * b, 1)}",
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Fraction calculation (same denominator)
            den = random.choice([4, 5, 6, 7])
            num1 = random.randint(1, den - 1)
            num2 = random.randint(1, den - 1)
            exercises.append({
                "question": f"Suma las fracciones: $\\frac{{{num1}}}{{{den}}} + \\frac{{{num2}}}{{{den}}}$ (responde como fracción simplificada o directa, ej. {num1+num2}/{den})",
                "correct_answer": f"{num1+num2}/{den}",
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Percentage calculation
            pct = random.choice([10, 20, 25, 50])
            total = random.choice([120, 200, 300, 400])
            exercises.append({
                "question": f"Calcula el ${pct}\\%$ de ${total}$",
                "correct_answer": str(int(total * pct / 100)),
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Exponent arithmetic
            base = random.choice([2, 3, 5])
            exp1 = random.randint(1, 3)
            exp2 = random.randint(1, 2)
            exercises.append({
                "question": f"Simplifica la expresión exponencial: ${base}^{exp1} \\times {base}^{exp2}$ (escribe el resultado numérico directo)",
                "correct_answer": str(base**(exp1 + exp2)),
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        else: # University
            # Series and discrete representations
            exercises = []
            # Q0: Infinite geometric sum
            r_num = 1
            r_den = random.choice([2, 3, 4])
            # Sum = a / (1 - r) with a = 1
            # 1 / (1 - 1/r_den) = r_den / (r_den - 1)
            exercises.append({
                "question": f"Calcula la suma infinita de la serie geométrica: $\\sum_{{n=0}}^{{\\infty}} (\\frac{{{r_num}}}{{{r_den}}})^n$",
                "correct_answer": f"{r_den}/{r_den - 1}" if (r_den - 1) > 1 else f"{r_den}",
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Binary base conversion
            val = random.randint(10, 35)
            exercises.append({
                "question": f"Encuentra la representación binaria del número decimal ${val}$",
                "correct_answer": bin(val)[2:],
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Geometric progression nth term
            first = random.randint(2, 5)
            ratio = random.choice([2, 3])
            n = random.randint(3, 5)
            exercises.append({
                "question": f"En una progresión geométrica con primer término $a_1 = {first}$ y razón $r = {ratio}$, calcula el término $a_{n}$",
                "correct_answer": str(first * (ratio**(n - 1))),
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Euler Limit
            exercises.append({
                "question": "Calcula el valor límite estándar de la sucesión: $\\lim_{{n \\to \\infty}} (1 + \\frac{1}{n})^n$ (escribe como constante estándar, ej. 'e')",
                "correct_answer": "e",
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Euclidean algorithm gcd
            a = random.choice([24, 36, 48, 60])
            b = random.choice([15, 18, 20, 24])
            import math
            exercises.append({
                "question": f"Determina el máximo común divisor de ${a}$ y ${b}$ usando el algoritmo de Euclides",
                "correct_answer": str(math.gcd(a, b)),
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

    # --- ALGEBRA ---
    elif area_lower == "algebra":
        if level == "Primary":
            # Introducción a Ecuaciones
            exercises = []
            # Q0: x + A = B
            a = random.randint(2, 15)
            ans = random.randint(3, 20)
            b = a + ans
            exercises.append({
                "question": f"Si $x + {a} = {b}$, ¿cuánto vale $x$?",
                "correct_answer": str(ans),
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Ax = B
            a = random.randint(2, 6)
            ans = random.randint(3, 10)
            b = a * ans
            exercises.append({
                "question": f"Si ${a}x = {b}$, ¿cuánto vale $x$?",
                "correct_answer": str(ans),
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Ax - B = C
            a = random.randint(2, 4)
            ans = random.randint(2, 8)
            b = random.randint(1, 10)
            c = a * ans - b
            exercises.append({
                "question": f"Encuentra el valor de $y$ si ${a}y - {b} = {c}$",
                "correct_answer": str(ans),
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Completing pattern sequence
            first = random.randint(1, 5)
            step = random.randint(2, 5)
            seq = [first + step * i for i in range(5)]
            exercises.append({
                "question": f"Completa la secuencia aritmética: ${seq[0]}, {seq[1]}, {seq[2]}, {seq[3]}, x$. ¿Cuál es el valor de $x$?",
                "correct_answer": str(seq[4]),
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Linear evaluation
            a = random.randint(2, 5)
            b = random.randint(2, 6)
            x_val = random.randint(2, 4)
            y_val = random.randint(2, 5)
            exercises.append({
                "question": f"Si $a = {x_val}$ y $b = {y_val}$, calcula el valor de ${a}a + {b}b$",
                "correct_answer": str(a * x_val + b * y_val),
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        elif level == "Secondary":
            # Ecuaciones Cuadráticas
            exercises = []
            # Q0: Quadratic factorization factors
            r1 = random.randint(1, 5)
            r2 = random.randint(2, 6)
            # (x - r1)(x - r2) = x^2 - (r1+r2)x + r1*r2
            b_coef = -(r1 + r2)
            c_coef = r1 * r2
            exercises.append({
                "question": f"Factoriza la expresión cuadrática: $x^2 {b_coef:+}x {c_coef:+}$. Escribe los factores ordenados como $(x-{r1})(x-{r2})$ o $(x-{r2})(x-{r1})$",
                "correct_answer": f"(x-{r1})(x-{r2})" if r1 < r2 else f"(x-{r2})(x-{r1})",
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Roots square
            ans = random.randint(2, 9)
            val = ans ** 2
            exercises.append({
                "question": f"Encuentra las soluciones reales de $x^2 - {val} = 0$. Escribe el valor positivo",
                "correct_answer": str(ans),
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Solve linear parenthesis
            a = random.randint(2, 3)
            b = random.randint(1, 5)
            ans = random.randint(2, 6)
            # a(x - b) = c_coef * x - d_coef
            # Let's say a(x - b) = (a + 2)x - d_coef
            # a*ans - a*b = (a+2)*ans - d_coef => d_coef = 2*ans + a*b
            d_coef = 2 * ans + a * b
            exercises.append({
                "question": f"Resuelve para $x$: ${a}(x - {b}) = {a+2}x - {d_coef}$",
                "correct_answer": str(ans),
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: System of equations (substitute method)
            ans_x = random.randint(2, 7)
            ans_y = random.randint(1, 6)
            sum_val = ans_x + ans_y
            diff_val = ans_x - ans_y
            exercises.append({
                "question": f"Resuelve el sistema de ecuaciones lineales: $x + y = {sum_val}$ y $x - y = {diff_val}$. Escribe el valor de $x$",
                "correct_answer": str(ans_x),
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Vertex coordinate h
            h = random.randint(1, 4)
            k = random.randint(1, 5)
            # y = (x - h)^2 + k = x^2 - 2hx + h^2+k
            b_term = -2 * h
            c_term = h**2 + k
            exercises.append({
                "question": f"Encuentra el vértice de la parábola $y = x^2 {b_term:+}x {c_term:+}$. Escribe la coordenada como $(h,k)$ sin espacios",
                "correct_answer": f"({h},{k})",
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        else: # University
            # Matrices and eigenvalues
            exercises = []
            # Q0: Determinant 2x2
            a = random.randint(1, 5)
            b = random.randint(1, 4)
            c = random.randint(1, 4)
            d = random.randint(1, 5)
            det = a * d - b * c
            exercises.append({
                "question": f"Calcula el determinante de la matriz 2x2: $\\begin{pmatrix} {a} & {b} \\\\ {c} & {d} \\end{pmatrix}$",
                "correct_answer": str(det),
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Matrix trace
            a = random.randint(1, 9)
            d = random.randint(1, 9)
            exercises.append({
                "question": f"Calcula la traza de la matriz: $\\begin{pmatrix} {a} & 5 \\\\ 2 & {d} \\end{pmatrix}$",
                "correct_answer": str(a + d),
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Vector Space dimension
            dim = random.randint(4, 7)
            rank = random.randint(2, dim - 1)
            exercises.append({
                "question": f"Si una matriz tiene rango ${rank}$ y tamaño $3 \\times {dim}$, ¿cuál es la dimensión de su espacio nulo (nulidad) según el teorema rango-nulidad?",
                "correct_answer": str(dim - rank),
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Eigenvalues
            lam1 = random.randint(1, 4)
            lam2 = random.randint(2, 5)
            exercises.append({
                "question": f"Encuentra los autovalores de la matriz diagonal $\\begin{pmatrix} {lam1} & 0 \\\\ 0 & {lam2} \\end{pmatrix}$. Escríbelos ordenados de menor a mayor separados por coma (ej. {min(lam1,lam2)},{max(lam1,lam2)})",
                "correct_answer": f"{min(lam1,lam2)},{max(lam1,lam2)}",
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Linear combination independence
            exercises.append({
                "question": "Si un conjunto de vectores en $\\mathbb{R}^3$ contiene el vector nulo $\\vec{0}$, ¿es linealmente dependiente o independiente? (responde 'dependiente' o 'independiente')",
                "correct_answer": "dependiente",
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

    # --- CALCULUS ---
    elif area_lower == "calculus" or "calculo" in area_lower or "cálculo" in area_lower:
        if level == "Primary":
            exercises = []
            # Q0: Linear sequence next
            step = random.randint(2, 6)
            seq = [step * i for i in range(1, 6)]
            exercises.append({
                "question": f"Si sigues la serie ${seq[0]}, {seq[1]}, {seq[2]}, {seq[3]}...$, ¿cuál es el siguiente número al sumar siempre ${step}$?",
                "correct_answer": str(seq[4]),
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Doubling sequence
            first = random.randint(2, 5)
            seq = [first * (2**i) for i in range(5)]
            exercises.append({
                "question": f"¿Cuál es el siguiente número en la secuencia exponencial ${seq[0]}, {seq[1]}, {seq[2]}, {seq[3]}...$?",
                "correct_answer": str(seq[4]),
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Convergence intuition
            exercises.append({
                "question": "Si cortas un pastel a la mitad infinitas veces en teoría, ¿la suma de todos los trozos que vas cortando llegará alguna vez a superar el pastel original? (responde 'si' o 'no')",
                "correct_answer": "no",
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Sum of basic fractions
            exercises.append({
                "question": "Calcula el resultado exacto de sumar las siguientes partes de un pastel: $\\frac{1}{2} + \\frac{1}{4}$ (escribe en forma de fracción simplificada x/y)",
                "correct_answer": "3/4",
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Velocity constant
            dist = random.randint(20, 80)
            t = random.choice([2, 4, 5])
            dist = (dist // t) * t
            exercises.append({
                "question": f"Si recorres una distancia de ${dist}$ metros en un tiempo de ${t}$ segundos a velocidad constante, ¿cuántos metros avanzas en un solo segundo?",
                "correct_answer": str(dist // t),
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        elif level == "Secondary":
            # Basic Limits & Slopes
            exercises = []
            # Q0: Polynomial limit x->A
            a = random.randint(1, 5)
            coef = random.randint(2, 4)
            c = random.randint(1, 6)
            exercises.append({
                "question": f"Encuentra el límite: $\\lim_{{x \\to {a}}} ({coef}x + {c})$",
                "correct_answer": str(coef * a + c),
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Tangent slope of straight line
            a = random.randint(2, 9)
            b = random.randint(1, 8)
            exercises.append({
                "question": f"Calcula la pendiente constante de la recta tangente para la función lineal $y = {a}x - {b}$",
                "correct_answer": str(a),
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Limit factorization (x^2-A^2)/(x-A)
            a = random.randint(1, 5)
            exercises.append({
                "question": f"Encuentra el valor del límite indeterminado resolviendo la indeterminación: $\\lim_{{x \\to {a}}} \\frac{{x^2 - {a**2}}}{{x - {a}}}$",
                "correct_answer": str(2 * a),
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Limit to infinity 1/x
            exercises.append({
                "question": "Evalúa el límite al infinito: $\\lim_{{x \\to \\infty}} \\frac{3}{x}$",
                "correct_answer": "0",
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Linear derivative
            coef = random.randint(3, 12)
            exercises.append({
                "question": f"Evalúa la derivada de la función lineal $f(x) = {coef}x$ con respecto a $x$",
                "correct_answer": str(coef),
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        else: # University
            # Calculus University: Limits & Derivatives
            exercises = []
            # Q0: Limit calculation
            a = random.randint(1, 4)
            exercises.append({
                "question": f"Evalúa el límite: $\\lim_{{x \\to {a}}} (x^2 + 2x - 3)$",
                "correct_answer": str(a**2 + 2 * a - 3),
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Indeterminate rational limit
            a = random.randint(2, 5)
            exercises.append({
                "question": f"Determina el valor del límite de la función racional en el punto de discontinuidad: $\\lim_{{x \\to {a}}} \\frac{{x^2 - {a**2}}}{{x - {a}}}$",
                "correct_answer": str(2 * a),
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Trig limit sin(Ax)/x
            a = random.randint(2, 5)
            exercises.append({
                "question": f"Calcula el límite trigonométrico notable: $\\lim_{{x \\to 0}} \\frac{{\\sin({a}x)}}{{x}}$",
                "correct_answer": str(a),
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Limit to infinity rational
            num = random.randint(2, 5)
            den = random.randint(2, 4)
            exercises.append({
                "question": f"Evalúa el límite racional al infinito: $\\lim_{{x \\to \\infty}} \\frac{{{num}x^2 + 5x - 1}}{{{den}x^2 - x + 3}}$ (escribe en forma de fracción irreducible, ej. {num}/{den})",
                "correct_answer": f"{num}/{den}",
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Derivative calculation
            coef = random.randint(2, 4)
            pt = random.randint(1, 3)
            # f(x) = x^3 - coef*x + 5 => f'(x) = 3x^2 - coef => f'(pt) = 3*pt^2 - coef
            ans = 3 * (pt**2) - coef
            exercises.append({
                "question": f"Calcula el valor de la derivada de la función cuadrática/cúbica $f(x) = x^3 - {coef}x + 10$ en el punto $x = {pt}$",
                "correct_answer": str(ans),
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

    # --- GEOMETRY ---
    elif area_lower == "geometry" or "geometria" in area_lower or "geometría" in area_lower:
        if level == "Primary":
            exercises = []
            # Q0: Area square
            side = random.randint(3, 10)
            exercises.append({
                "question": f"Calcula el área de un cuadrado cuyo lado mide ${side}$ cm",
                "correct_answer": str(side ** 2),
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Perimeter rectangle
            l1 = random.randint(3, 8)
            l2 = random.randint(4, 10)
            exercises.append({
                "question": f"Encuentra el perímetro de un rectángulo que tiene lados de ${l1}$ cm y ${l2}$ cm",
                "correct_answer": str(2 * (l1 + l2)),
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Polygon sides
            sides = random.choice([("pentágono", 5), ("hexágono", 6), ("octágono", 8)])
            exercises.append({
                "question": f"¿Cuántos lados tiene un {sides[0]} regular?",
                "correct_answer": str(sides[1]),
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Area triangle
            base = random.randint(4, 12)
            height = random.randint(3, 8)
            # Force base*height to be even
            if (base * height) % 2 != 0:
                base += 1
            exercises.append({
                "question": f"Calcula el área de un triángulo que tiene una base de ${base}$ cm y una altura de ${height}$ cm",
                "correct_answer": str(int(base * height / 2)),
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Radius from diameter
            dia = random.randint(6, 24)
            if dia % 2 != 0:
                dia += 1
            exercises.append({
                "question": f"Si un círculo tiene un diámetro total de ${dia}$ cm, ¿cuánto mide su radio en centímetros?",
                "correct_answer": str(dia // 2),
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        elif level == "Secondary":
            # Pythagorean theorem and circular parameters
            exercises = []
            # Q0: Pythagorean triple 3-4-5 or 6-8-10 or 5-12-13
            triple = random.choice([(3, 4, 5), (6, 8, 10), (5, 12, 13)])
            exercises.append({
                "question": f"Teorema de Pitágoras: encuentra la longitud de la hipotenusa de un triángulo rectángulo cuyos catetos miden ${triple[0]}$ y ${triple[1]}$",
                "correct_answer": str(triple[2]),
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Pythagorean cathetus missing
            triple = random.choice([(3, 4, 5), (6, 8, 10), (5, 12, 13)])
            exercises.append({
                "question": f"Encuentra la longitud del cateto faltante en un triángulo rectángulo si la hipotenusa mide ${triple[2]}$ y el otro cateto mide ${triple[0]}$",
                "correct_answer": str(triple[1]),
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Area circle pi estimation
            r = random.choice([7, 14])
            exercises.append({
                "question": f"Calcula el área de un círculo de radio $r = {r}$ usando la aproximación de $\\pi \\approx 22/7$ (responde solo el número entero)",
                "correct_answer": str(int(22 * (r**2) / 7)),
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Sum of internal angles pentagon/hexagon
            sides = random.choice([(5, 540), (6, 720)])
            exercises.append({
                "question": f"Encuentra la suma de todos los ángulos internos de un polígono regular de ${sides[0]}$ lados (pentágono o hexágono) expresada en grados",
                "correct_answer": str(sides[1]),
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Ratio areas
            ratio = random.choice([2, 3])
            exercises.append({
                "question": f"Si los lados de dos triángulos semejantes están en una escala de relación $1:{ratio}$, ¿en qué escala de relación están sus áreas? (escribe como x:y, ej. 1:4)",
                "correct_answer": f"1:{ratio**2}",
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        else: # University
            exercises = []
            # Q0: Sphere volume in terms of pi
            r = random.choice([3, 6])
            # Volume = 4/3 * pi * r^3 = (4 * r^3 / 3) * pi
            vol_coef = int(4 * (r**3) / 3)
            exercises.append({
                "question": f"Encuentra el volumen tridimensional de una esfera de radio $r = {r}$ en términos de $\\pi$ (escribe en formato algebraico, ej. {vol_coef}\\pi)",
                "correct_answer": f"{vol_coef}\\pi",
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Cylinder lateral surface area
            r = random.randint(2, 4)
            h = random.randint(3, 7)
            exercises.append({
                "question": f"Calcula el área de la superficie lateral de un cilindro recto con radio base $r = {r}$ y altura $h = {h}$ en términos de $\\pi$ (escribe como {2*r*h}\\pi)",
                "correct_answer": f"{2 * r * h}\\pi",
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Line tangent radius
            r = random.choice([5, 10])
            exercises.append({
                "question": f"Determina la constante de distancia radial $c$ en la ecuación de la recta tangente a la circunferencia $x^2 + y^2 = {r**2}$ en el punto de contacto $(x,y)$: $xx_0+yy_0=c$",
                "correct_answer": str(r**2),
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Area under curve integral
            limit = random.choice([2, 3])
            # Integral x^2 from 0 to limit = limit^3 / 3
            # Force limit to be 3 for integer answer
            limit = 3
            exercises.append({
                "question": f"Encuentra el área encerrada bajo la curva parabólica $y = x^2$ y el eje horizontal $x$ desde la coordenada $x = 0$ hasta $x = {limit}$",
                "correct_answer": "9",
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Curvature radius
            r = random.randint(2, 8)
            exercises.append({
                "question": f"Calcula el valor de la curvatura de un círculo geométrico plano que posee un radio de ${r}$ unidades de longitud (responde en forma de fracción simple)",
                "correct_answer": f"1/{r}",
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

    # --- TRIGONOMETRY ---
    elif area_lower == "trigonometry" or "trigonometria" in area_lower or "trigonometría" in area_lower:
        if level == "Primary":
            exercises = []
            # Q0: Third angle
            a = random.choice([30, 45, 60])
            exercises.append({
                "question": f"Si un triángulo rectángulo tiene un ángulo interno de $90$ grados y otro de ${a}$ grados, ¿cuánto mide el tercer ángulo en grados?",
                "correct_answer": str(90 - a),
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Hypotenuse name
            exercises.append({
                "question": "En un triángulo rectángulo, ¿cómo se conoce tradicionalmente al lado de mayor longitud que se ubica directamente opuesto al ángulo de 90 grados?",
                "correct_answer": "hipotenusa",
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Sum of internal angles triangle
            exercises.append({
                "question": "¿Cuántos grados suman exactamente los tres ángulos internos que componen cualquier triángulo plano?",
                "correct_answer": "180",
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Equilateral angle
            exercises.append({
                "question": "Si un triángulo equilátero tiene tres lados iguales, ¿cuántos grados de amplitud mide cada uno de sus tres ángulos internos?",
                "correct_answer": "60",
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Isosceles angles
            a = random.randint(30, 70)
            exercises.append({
                "question": f"En un triángulo isósceles, si los dos ángulos de la base que son iguales miden ${a}$ grados cada uno, ¿cuántos grados de amplitud tiene el tercer ángulo superior?",
                "correct_answer": str(180 - 2 * a),
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        elif level == "Secondary":
            exercises = []
            # Q0: Cosine from sine 3/5
            exercises.append({
                "question": "Si el seno de un ángulo agudo es $\\sin(\\theta) = 3/5$, ¿cuál es el valor del coseno de dicho ángulo $\\cos(\\theta)$ expresado en fracción simple?",
                "correct_answer": "4/5",
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Exact trig value sin(30)
            exercises.append({
                "question": "Calcula el valor exacto de la razón trigonométrica $\\sin(30^\\circ)$ (responde en forma de fracción simple)",
                "correct_answer": "1/2",
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Exact trig value tan(45)
            exercises.append({
                "question": "Calcula el valor trigonométrico de la tangente de cuarenta y cinco grados: $\\tan(45^\\circ)$",
                "correct_answer": "1",
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Angle of elevation shadow
            h = random.randint(5, 20)
            exercises.append({
                "question": f"Si la altura vertical de un poste es de ${h}$ metros y proyecta en el suelo una sombra de exactamente ${h}$ metros, ¿cuál es el ángulo de elevación del sol en grados?",
                "correct_answer": "45",
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Trig fundamental identity
            exercises.append({
                "question": "Simplifica la identidad trigonométrica fundamental pitagórica: $\\sin^2(\\theta) + \\cos^2(\\theta)$",
                "correct_answer": "1",
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        else: # University
            exercises = []
            # Q0: Second quadrant cosine
            exercises.append({
                "question": "Si el seno de un ángulo es $\\sin(x) = 1/2$ y sabemos que $x$ se localiza en el segundo cuadrante, ¿cuál es el valor exacto del coseno $\\cos(x)$? (escribe como -\\sqrt{3}/2)",
                "correct_answer": "-\\sqrt{3}/2",
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Radian solutions
            exercises.append({
                "question": "Resuelve la ecuación para $x$ en el rango $[0, 2\\pi]$: $\\sin(x) - \\cos(x) = 0$. Indica la primera solución en radianes (ej. \\pi/4)",
                "correct_answer": "\\pi/4",
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Double angle identity
            exercises.append({
                "question": "Simplifica la expresión de ángulo doble $2\\sin(x)\\cos(x)$ en su forma compacta de una sola función trigonométrica (ej. sin(2x))",
                "correct_answer": "sin(2x)",
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Period calculation
            b = random.choice([2, 3, 4])
            exercises.append({
                "question": f"Calcula el periodo fundamental de la función trigonométrica periódica $f(x) = \\sin({b}x)$ expresado en términos de \\pi (ej. 2\\pi/{b})",
                "correct_answer": f"2\\pi/{b}",
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Derivative tan
            exercises.append({
                "question": "Encuentra el valor de la derivada de la tangente de $x$ con respecto a $x$ utilizando notación estándar de exponentes (escribe sec^2(x))",
                "correct_answer": "sec^2(x)",
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

    # --- STATISTICS ---
    elif area_lower == "statistics" or "estadistica" in area_lower or "estadística" in area_lower:
        if level == "Primary":
            exercises = []
            # Q0: Average mean
            n1 = random.randint(4, 7)
            n2 = n1 + random.randint(1, 3)
            n3 = n2 + random.randint(1, 3)
            # Force sum to be divisible by 3
            while (n1 + n2 + n3) % 3 != 0:
                n3 += 1
            exercises.append({
                "question": f"Encuentra el promedio (media aritmética) de las siguientes tres calificaciones de examen: ${n1}, {n2}, {n3}$",
                "correct_answer": str((n1 + n2 + n3) // 3),
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Probability red marble
            red = random.randint(2, 5)
            green = random.randint(2, 4)
            exercises.append({
                "question": f"Si tienes en una bolsa opaca ${red}$ bolitas rojas y ${green}$ bolitas verdes, ¿cuál es la probabilidad de extraer una roja al azar? (escribe como fracción irreducible x/y)",
                "correct_answer": f"{red}/{red+green}",
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Median calculation
            vals = [3, 7, 9, 12, 15]
            random.shuffle(vals)
            exercises.append({
                "question": f"Encuentra la mediana en este conjunto desordenado de datos: ${vals[0]}, {vals[1]}, {vals[2]}, {vals[3]}, {vals[4]}$",
                "correct_answer": "9",
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Coin toss pct
            exercises.append({
                "question": "Si lanzas al aire una moneda justa y perfectamente equilibrada, ¿cuál es el porcentaje exacto de probabilidad de obtener cara?",
                "correct_answer": "50",
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Mode calculation
            val = random.randint(4, 9)
            vals = [val, val, val + 1, val + 2, val + 3]
            random.shuffle(vals)
            exercises.append({
                "question": f"Encuentra el valor de la moda (el número que más veces se repite) en el conjunto: ${vals[0]}, {vals[1]}, {vals[2]}, {vals[3]}, {vals[4]}$",
                "correct_answer": str(val),
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        elif level == "Secondary":
            exercises = []
            # Q0: SD of identicals
            val = random.randint(2, 15)
            exercises.append({
                "question": "Calcula la desviación estándar estadística de un conjunto de datos constante formado por números idénticos: $\\{" + f"{val}, {val}, {val}, {val}" + "\\}$",
                "correct_answer": "0",
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Probability two dice sum 7
            exercises.append({
                "question": "Al lanzar simultáneamente dos dados ordinarios de seis caras numeradas del 1 al 6, ¿cuál es la probabilidad exacta de que la suma de ambos dados sea siete? (escribe en fracción simplificada)",
                "correct_answer": "1/6",
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Probability three coins faces
            exercises.append({
                "question": "Calcula la probabilidad teórica de obtener exactamente tres caras consecutivas al lanzar una moneda equilibrada tres veces consecutivas (responde en fracción simple)",
                "correct_answer": "1/8",
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Inverse average sum
            n = random.randint(4, 6)
            avg = random.randint(10, 20)
            exercises.append({
                "question": f"Si sabemos que la media promedio de ${n}$ números diferentes es igual a ${avg}$, ¿cuál es el valor de la suma total acumulada de todos esos números?",
                "correct_answer": str(n * avg),
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Combinations formula C(4,2) or C(5,2)
            n_items = random.choice([4, 5])
            ans = 6 if n_items == 4 else 10
            exercises.append({
                "question": f"Encuentra el número total de combinaciones posibles para seleccionar un comité integrado por $2$ personas a partir de un grupo de ${n_items}$ candidatos",
                "correct_answer": str(ans),
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

        else: # University
            exercises = []
            # Q0: Empirical rule 1 SD Normal distribution
            exercises.append({
                "question": "Según la regla empírica para una distribución normal estándar $Z$, ¿cuál es el porcentaje aproximado de datos que se ubican en el intervalo entre $-1$ y $1$ desviaciones estándar? (da sólo el número entero)",
                "correct_answer": "68",
                "difficulty_level": "Fácil",
                "order_index": 0
            })
            # Q1: Bernoulli variance
            p = round(random.choice([0.2, 0.3, 0.4]), 1)
            # Var = p * (1 - p)
            var_ans = round(p * (1.0 - p), 2)
            exercises.append({
                "question": f"Si en un ensayo de Bernoulli la probabilidad de éxito es de $p = {p}$, ¿cuál es la varianza matemática para esta distribución de probabilidad?",
                "correct_answer": f"{var_ans}",
                "difficulty_level": "Medio",
                "order_index": 1
            })
            # Q2: Poisson expected value
            lam = random.randint(3, 8)
            exercises.append({
                "question": f"Calcula el valor esperado teórico de una variable aleatoria que sigue una distribución de Poisson con un parámetro de intensidad $\\lambda = {lam}$",
                "correct_answer": str(lam),
                "difficulty_level": "Medio",
                "order_index": 2
            })
            # Q3: Continuous Uniform cumulative density
            limit = random.randint(8, 12)
            pt = round(random.uniform(2.0, limit - 2.0), 1)
            # CDF in [0, limit] at pt = pt / limit
            # Force values for clean representation
            limit = 10
            pt = 3.5
            exercises.append({
                "question": f"Encuentra el valor de la función de distribución acumulada para una variable uniforme continua en el intervalo $[0, {limit}]$ en el punto específico $x = {pt}$",
                "correct_answer": "0.35",
                "difficulty_level": "Difícil",
                "order_index": 3
            })
            # Q4: Independent intersection P(A and B)
            p1 = round(random.choice([0.3, 0.4, 0.5]), 1)
            p2 = round(random.choice([0.2, 0.5, 0.6]), 1)
            exercises.append({
                "question": f"Si dos eventos estadísticos A y B son completamente independientes, con $P(A) = {p1}$ y $P(B) = {p2}$, calcula el valor de la probabilidad de la intersección $P(A \\cap B)$",
                "correct_answer": f"{round(p1 * p2, 2)}",
                "difficulty_level": "Difícil",
                "order_index": 4
            })
            return exercises

    # --- DEFAULT / FALLBACK AREA ---
    else:
        # Fallback math exercises
        exercises = []
        a = random.randint(2, 5)
        ans = random.randint(2, 6)
        b = random.randint(5, 15)
        c = a * ans + b
        exercises.append({
            "question": f"Resuelve algebraicamente la ecuación: ${a}x + {b} = {c}$. ¿Cuánto vale $x$?",
            "correct_answer": str(ans),
            "difficulty_level": "Fácil",
            "order_index": 0
        })
        l1 = random.randint(3, 8)
        l2 = random.randint(4, 10)
        exercises.append({
            "question": f"Calcula el área geométrica de un rectángulo de lados ${l1}$ y ${l2}$",
            "correct_answer": str(l1 * l2),
            "difficulty_level": "Medio",
            "order_index": 1
        })
        exercises.append({
            "question": "Si lanzas un dado ordinario de 6 caras, ¿cuál es el porcentaje de probabilidad de obtener un número par? (responde sólo el número entero)",
            "correct_answer": "50",
            "difficulty_level": "Medio",
            "order_index": 2
        })
        exercises.append({
            "question": "Encuentra la hipotenusa de un triángulo rectángulo cuyos catetos tienen una longitud de $3$ y $4$ unidades",
            "correct_answer": "5",
            "difficulty_level": "Difícil",
            "order_index": 3
        })
        val = random.randint(100, 200)
        exercises.append({
            "question": f"¿Cuál es el valor absoluto del número entero negativo ${-val}$?",
            "correct_answer": str(val),
            "difficulty_level": "Difícil",
            "order_index": 4
        })
        return exercises

def get_mock_explanation(topic: str, level: str) -> str:
    """Delivers rich LaTeX based explanations in Spanish, adapted to education levels."""
    if topic == "Algebra":
        if level == "Primary":
            return """# Aprendiendo Álgebra: ¡El Misterio de la Caja Sorpresa! 🎁

¡Hola aventurero matemático! Imagina que el álgebra es como jugar a ser un detective. 

## La Gran Analogía
Imagínate que tienes una **caja de regalo sorpresa** y sabemos que si le sumamos $5$ caramelos, tendremos en total $12$ caramelos. 
Podemos escribir este gran misterio así:
$$\\text{Caja Sorpresa} + 5 = 12$$

Para resolver el misterio y saber cuántos caramelos hay dentro de la caja, simplemente pensamos: *¿Qué número sumado a 5 da 12?* 
¡Exacto! El número es **7**. 

En matemáticas, en lugar de dibujar una caja sorpresa, usamos letras simpáticas, casi siempre la letra $x$. Así que el misterio se escribe:
$$x + 5 = 12$$
Y nuestra solución como detectives es:
$$x = 7$$

---
### Conceptos Clave:
1. **Variable ($x$):** Es la letra misteriosa que esconde un valor secreto.
2. **Ecuación:** Es una balanza en equilibrio perfecto. Lo que haces de un lado, debes hacerlo del otro.
"""
        elif level == "Secondary":
            return """# Álgebra Secundaria: Ecuaciones Cuadráticas y Parábolas 📈

Bienvenidos al estudio formal de las **ecuaciones de segundo grado**. Estas son ecuaciones de la forma:
$$ax^2 + bx + c = 0$$
Donde $a \\neq 0$. El exponente cuadrático ($2$) indica que la ecuación puede tener hasta dos soluciones reales.

## El Puente Físico: El Vuelo de un Balón ⚽
Cuando pateas un balón de fútbol, este sube en el aire y vuelve a caer formando una curva perfecta llamada **parábola**. La ecuación matemática de esa trayectoria es una ecuación cuadrática. Los puntos donde el balón toca el suelo representan las **raíces** o soluciones de la ecuación cuadrática ($y = 0$).

## Métodos de Resolución
Existen tres métodos principales para resolver estas ecuaciones:
1. **Factorización:** Consiste en expresar el trinomio como el producto de dos binomios:
   $$x^2 - 5x + 6 = (x - 2)(x - 3) = 0 \\implies x_1 = 2, \\, x_2 = 3$$
2. **Fórmula General:** La famosísima fórmula que sirve para cualquier ecuación cuadrática:
   $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
   El término dentro de la raíz ($b^2 - 4ac$) se llama **discriminante ($\\Delta$)** y determina el tipo de soluciones.

---
> [!NOTE]
> - Si $\\Delta > 0$: Dos soluciones reales y distintas.
> - Si $\\Delta = 0$: Una solución real única (raíz doble).
> - Si $\\Delta < 0$: No existen soluciones en los números reales (soluciones complejas).
"""
        else: # University
            return """# Álgebra Lineal Universitaria: Espacios Vectoriales y Transformaciones 🏛️

En el nivel universitario, el álgebra deja de ser sobre números específicos y se convierte en el estudio de **estructuras abstractas** gobernadas por axiomas fundamentales.

## Espacios Vectoriales
Un espacio vectorial $V$ sobre un cuerpo $\\mathbb{F}$ (como los números reales $\\mathbb{R}$ o complejos $\\mathbb{C}$) es un conjunto de elementos llamados **vectores**, equipados con dos operaciones (suma vectorial y multiplicación por un escalar) que satisfacen 8 axiomas fundamentales (asociatividad, distributividad, existencia del elemento neutro, etc.).

### Teorema de la Dimensión (Rango-Nulidad)
Para cualquier transformación lineal $T: V \\to W$ donde $V$ es de dimensión finita, se cumple la elegante igualdad:
$$\\text{dim}(\\text{Ker}(T)) + \\text{dim}(\\text{Im}(T)) = \\text{dim}(V)$$
O expresado matricialmente para una matriz $A$ de tamaño $m \\times n$:
$$\\text{nulidad}(A) + \\text{rango}(A) = n$$

---
## Aplicaciones Prácticas: Algoritmo PageRank de Google
Google organiza las páginas web construyendo una matriz gigante de transiciones web. Encontrar el orden de importancia de las páginas equivale a hallar el **autovector correspondiente al autovalor $\\lambda = 1$** de esa matriz de probabilidad. ¡Toda la búsqueda moderna en internet es álgebra lineal aplicada!
"""

    elif topic == "Calculus":
        if level == "Primary":
            return """# Introducción al Cálculo: ¡El Concepto de Infinito y Límites! 🚀

¡Hola futuro científico! ¿Alguna vez te has preguntado cómo podemos sumar infinitas cosas pequeñas? Eso es exactamente de lo que trata el cálculo.

## La Analogía de la Torta 🍰
Imagina que tienes una torta deliciosa.
1. Primero, te comes la mitad de la torta: $\\frac{1}{2}$.
2. Luego, te comes la mitad de lo que queda: $\\frac{1}{4}$.
3. Después, la mitad de lo restante: $\\frac{1}{8}$.

Si sigues haciendo esto para siempre, ¿cuánta torta te habrás comido en total al final?
¡Exactamente **1 torta entera**!
Aunque estamos sumando infinitas fracciones, el resultado se acerca a un límite perfecto:
$$\\frac{1}{2} + \\frac{1}{4} + \\frac{1}{8} + \\frac{1}{16} + \\dots = 1$$

---
### Ideas Clave:
- **Límite:** Es el valor al que te acercas infinitamente, aunque nunca lo toques por completo.
- **Cambio Continuo:** El cálculo nos ayuda a medir cosas que cambian constantemente, como la velocidad de un cohete espacial.
"""
        elif level == "Secondary":
            return """# Cálculo Secundario: El Concepto de Límite y Derivada 📈

En este nivel nos introducimos al estudio del **cambio instantáneo**, que es la base fundamental del cálculo diferencial.

## ¿Qué es un Límite? 🎯
Un límite describe el comportamiento de una función $f(x)$ a medida que la variable $x$ se aproxima a un valor específico $c$. Se escribe formalmente como:
$$\\lim_{x \\to c} f(x) = L$$
Significa que podemos hacer que $f(x)$ esté tan cerca de $L$ como queramos, tomando valores de $x$ suficientemente cercanos a $c$ (pero sin que $x$ sea exactamente igual a $c$).

### Ejemplo Clave (Evitando la división por cero):
Considera la función $f(x) = \\frac{x^2 - 1}{x - 1}$. No podemos evaluar $f(1)$ porque tendríamos una división por cero (indeterminación $\\frac{0}{0}$). Sin embargo, podemos evaluar el límite:
$$\\lim_{x \\to 1} \\frac{x^2 - 1}{x - 1} = \\lim_{x \\to 1} \\frac{(x-1)(x+1)}{x-1} = \\lim_{x \\to 1} (x + 1) = 2$$
¡El límite nos permite explorar terrenos donde la aritmética tradicional se rompe!

---
> [!TIP]
> **La Derivada**: Es simplemente la pendiente de la recta tangente a una curva en un punto específico. Representa la **tasa de cambio instantánea**.
"""
        else: # University
            return """# Cálculo Universitario: Límites, Continuidad y Teoremas Fundamentales 🏛️

En el nivel universitario, estructuramos rigurosamente el análisis real a través de definiciones formales de límites y continuidad, resolviendo indeterminaciones complejas.

## Definición Formal de Límite ($\\epsilon$-$\\delta$)
Decimos que $\\lim_{x \\to c} f(x) = L$ si y solo si para cada $\\epsilon > 0$ existe un $\\delta > 0$ tal que:
$$0 < |x - c| < \\delta \\implies |f(x) - L| < \\epsilon$$
Esta rigurosa definición formalizada por Cauchy y Weierstrass eliminó las ambigüedades de los "infinitésimos" originales de Newton y Leibniz.

## Continuidad de una Función
Una función $f(x)$ es estrictamente **continua** en un punto $x = c$ si se satisfacen tres condiciones indispensables:
1. $f(c)$ está perfectamente definida (pertenece al dominio de la función).
2. El límite lateral doble existe: $\\lim_{x \\to c} f(x) = L$.
3. El límite coincide con el valor de la función:
   $$\\lim_{x \\to c} f(x) = f(c)$$

### Teorema del Valor Intermedio (TVI)
Si $f$ es continua en el intervalo cerrado $[a,b]$ y $u$ es un número entre $f(a)$ y $f(b)$, entonces existe al menos un $c \\in (a,b)$ tal que:
$$f(c) = u$$
Esta propiedad garantiza, por ejemplo, que si una función continua cambia de signo en un intervalo, obligatoriamente cruza por el cero (Teorema de Bolzano). ¡Esencial para resolver ecuaciones complejas en ingeniería!
"""

    elif topic == "Geometry":
        template = """# Introducción a Geometría ({level}) 📐

La geometría es la rama de las matemáticas que estudia las propiedades de las figuras en el plano o en el espacio, incluyendo puntos, líneas, planos y volúmenes.

## El Teorema de Pitágoras (Secundaria/Universidad)
Para cualquier triángulo rectángulo de catetos $a$ y $b$, e hipotenusa $c$, se cumple la mítica relación de áreas:
$$a^2 + b^2 = c^2$$

### Concepto de Espacio
El cálculo de áreas ($A$) y perímetros ($P$) nos permite interactuar con el diseño físico de nuestro mundo, desde construir casas hasta calcular la órbita de satélites espaciales.
"""
        return template.replace("{level}", level)

    elif topic == "Trigonometry":
        template = """# Introducción a Trigonometría ({level}) 📐

La trigonometría estudia las relaciones entre los lados y los ángulos de los triángulos. Sus funciones fundamentales son el Seno, Coseno y Tangente.

## Relaciones Fundamentales
Para un ángulo $\\theta$ en un triángulo rectángulo:
$$\\sin(\\theta) = \\frac{\\text{Cateto Opuesto}}{\\text{Hipotenusa}}$$
$$\\cos(\\theta) = \\frac{\\text{Cateto Adyacente}}{\\text{Hipotenusa}}$$
$$\\tan(\\theta) = \\frac{\\sin(\\theta)}{\\cos(\\theta)}$$

### Aplicaciones
Esencial para la navegación marítima, topografía, y el análisis de señales oscilatorias y ondas de sonido.
"""
        return template.replace("{level}", level)

    elif topic == "Statistics":
        template = """# Introducción a Probabilidad y Estadística ({level}) 📊

La estadística y probabilidad nos proporcionan las herramientas para cuantificar la incertidumbre y analizar datos empíricos para la toma de decisiones informadas.

## Conceptos Clave
1. **Media ($\\mu$):** El promedio aritmético de un conjunto de datos.
2. **Varianza ($\\sigma^2$):** Medida de la dispersión de los datos respecto a su media.
3. **Distribución Normal (Campana de Gauss):**
   $$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$$

### Aplicaciones
Utilizado en ciencia de datos, pronóstico meteorológico, control de calidad y modelos financieros globales.
"""
        return template.replace("{level}", level)

    # Fallback default
    template = """# Introducción a {topic} ({level}) 📐

En esta sesión exploraremos conceptos clave del área de {topic} para el nivel de {level}.

## Conceptos Básicos
Las matemáticas de {topic} nos enseñan a estructurar problemas complejos de forma sencilla. Aplicamos fórmulas como:
$$A = b \\times h$$
O relaciones fundamentales de equilibrio.

### Prepárate
A continuación, realizaremos una serie de ejercicios dinámicos adaptados a tu rendimiento. ¡Mucho éxito en tu aprendizaje!
"""
    return template.replace("{topic}", topic).replace("{level}", level)
