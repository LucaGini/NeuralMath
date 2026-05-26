import os
import json
import logging
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
        # Factor order-independent check: e.g. (x-2)(x-3) matches (x-3)(x-2)
        elif "x-2" in user_ans_clean and "x-3" in user_ans_clean:
            is_correct = True
        elif "x-3" in user_ans_clean and "x-2" in user_ans_clean:
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

    return "Respuesta simulada de NeuralMath."

def get_mock_exercises(topic: str, level: str) -> List[Dict[str, Any]]:
    """Generates highly customized mock math questions based on topic and level."""
    if topic == "Arithmetic":
        if level == "Primary":
            return [
                {"question": "¿Cuánto es $15 + 27$?", "correct_answer": "42", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "¿Cuánto es $9 \\times 8$?", "correct_answer": "72", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Si tienes $3$ manzanas y compras $4$ bolsas con $5$ manzanas cada una, ¿cuántas manzanas tienes en total?", "correct_answer": "23", "difficulty_level": "Medio", "order_index": 2},
                {"question": "¿Cuánto es $120 \\div 4$?", "correct_answer": "30", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "¿Cuánto es $(4 + 3) \\times (10 - 2)$?", "correct_answer": "56", "difficulty_level": "Difícil", "order_index": 4}
            ]
        elif level == "Secondary":
            return [
                {"question": "Resuelve la fracción: $\\frac{3}{4} + \\frac{2}{5}$", "correct_answer": "23/20", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "¿Cuál es el valor decimal de $\\frac{7}{8}$?", "correct_answer": "0.875", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Simplifica: $\\sqrt{72}$ en la forma $a\\sqrt{b}$. Escribe el resultado como $6\\sqrt{2}$", "correct_answer": "6\\sqrt{2}", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Calcula el $15\\%$ de $300$", "correct_answer": "45", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Simplifica la expresión: $2^3 \\times 2^4 \\div 2^2$", "correct_answer": "32", "difficulty_level": "Difícil", "order_index": 4}
            ]
        else: # University
            return [
                {"question": "Calcula la suma infinita: $\\sum_{n=1}^{\\infty} \\frac{1}{2^n}$", "correct_answer": "1", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "¿Cuál es la representación binaria de $43$?", "correct_answer": "101011", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Encuentra la base $x$ tal que $100_x = 36_{10}$", "correct_answer": "6", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Calcula: $\\lim_{n \\to \\infty} (1 + \\frac{1}{n})^n$ como constante estándar", "correct_answer": "e", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Determina el máximo común divisor de $1085$ y $217$ usando el algoritmo de Euclides", "correct_answer": "217", "difficulty_level": "Difícil", "order_index": 4}
            ]
            
    elif topic == "Algebra":
        if level == "Primary":
            return [
                {"question": "Si $x + 5 = 12$, ¿cuánto vale $x$?", "correct_answer": "7", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Si $2x = 16$, ¿cuánto vale $x$?", "correct_answer": "8", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Encuentra el valor de $y$ si $3y - 4 = 11$", "correct_answer": "5", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Completa la secuencia: $2, 5, 8, 11, x$. ¿Cuál es el valor de $x$?", "correct_answer": "14", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Si $a = 3$ y $b = 4$, calcula el valor de $2a + 3b$", "correct_answer": "18", "difficulty_level": "Difícil", "order_index": 4}
            ]
        elif level == "Secondary":
            return [
                {"question": "Factoriza la expresión cuadrática: $x^2 - 5x + 6$. Escribe tus factores como $(x-2)(x-3)$", "correct_answer": "(x-2)(x-3)", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Encuentra las soluciones reales de $x^2 - 9 = 0$. Escribe el valor positivo", "correct_answer": "3", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Resuelve para $x$: $2(x - 3) = 4x - 12$", "correct_answer": "3", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Resuelve el sistema de ecuaciones: $x + y = 10$ y $x - y = 2$. Escribe el valor de $x$", "correct_answer": "6", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Encuentra el vértice de la parábola $y = x^2 - 4x + 5$. Escribe como coordenada $(h,k)$ sin espacios", "correct_answer": "(2,1)", "difficulty_level": "Difícil", "order_index": 4}
            ]
        else: # University
            return [
                {"question": "Encuentra los autovalores de la matriz $\\begin{pmatrix} 2 & 0 \\\\ 0 & 3 \\end{pmatrix}$. Escríbelos separados por coma (ej. 2,3)", "correct_answer": "2,3", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Calcula el determinante de la matriz: $\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$", "correct_answer": "-2", "difficulty_level": "Medio", "order_index": 1},
                {"question": "¿Cuál es la dimensión del espacio nulo de una matriz $3 \\times 5$ con rango $3$?", "correct_answer": "2", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Resuelve la ecuación característica de la recurrencia $a_n = 5a_{n-1} - 6a_{n-2}$. Escribe las raíces separadas por comas", "correct_answer": "2,3", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Determina el número de elementos en el campo finito $GF(2^3)$", "correct_answer": "8", "difficulty_level": "Difícil", "order_index": 4}
            ]

    elif topic == "Calculus":
        if level == "Primary":
            return [
                {"question": "Si sigues la serie $2, 4, 8, 16...$, ¿a qué número se aproxima al doblar cada vez?", "correct_answer": "32", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "¿Cuál es el siguiente número en la secuencia $1, 3, 9, 27$?", "correct_answer": "81", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Si caminas la mitad de la distancia que te queda a una pared de $10$ metros en cada paso, ¿te detendrás alguna vez en teoría? (responde 'si' o 'no')", "correct_answer": "no", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Calcula la suma de $1/2 + 1/4 + 1/8$ en forma de fracción", "correct_answer": "7/8", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Encuentra la tasa de cambio constante si recorres $10$ metros en $2$ segundos", "correct_answer": "5", "difficulty_level": "Difícil", "order_index": 4}
            ]
        elif level == "Secondary":
            return [
                {"question": "Encuentra el límite: $\\lim_{x \\to 3} (2x + 4)$", "correct_answer": "10", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Calcula la pendiente de la recta tangente constante $y = 3x - 5$", "correct_answer": "3", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Encuentra el límite: $\\lim_{x \\to 1} \\frac{x^2 - 1}{x - 1}$", "correct_answer": "2", "difficulty_level": "Medio", "order_index": 2},
                {"question": "¿Cuál es el valor del límite $\\lim_{x \\to \\infty} \\frac{1}{x}$?", "correct_answer": "0", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Evalúa la derivada de $f(x) = 5x$ respecto a $x$", "correct_answer": "5", "difficulty_level": "Difícil", "order_index": 4}
            ]
        else: # University
            return [
                {"question": "Evalúa el límite: $\\lim_{x \\to 2} (x^2 + 3x - 4)$", "correct_answer": "6", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Determina si la función $f(x) = \\frac{x^2 - 4}{x - 2}$ es continua en $x = 2$. ¿Cuál es el límite en ese punto?", "correct_answer": "4", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Encuentra el límite notable: $\\lim_{x \\to 0} \\frac{\\sin(2x)}{x}$", "correct_answer": "2", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Evalúa el límite al infinito: $\\lim_{x \\to \\infty} \\frac{3x^2 + 2x - 1}{2x^2 - x + 1}$", "correct_answer": "3/2", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Calcula la derivada de $f(x) = x^3 - 3x + 5$ en $x = 2$", "correct_answer": "9", "difficulty_level": "Difícil", "order_index": 4}
            ]

    elif topic == "Geometry":
        if level == "Primary":
            return [
                {"question": "Calcula el área de un cuadrado con lado de $5$ cm", "correct_answer": "25", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Encuentra el perímetro de un rectángulo de lados $4$ cm y $6$ cm", "correct_answer": "20", "difficulty_level": "Medio", "order_index": 1},
                {"question": "¿Cuántos lados tiene un octágono regular?", "correct_answer": "8", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Calcula el área de un triángulo con base $6$ cm y altura $4$ cm", "correct_answer": "12", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Si un círculo tiene diámetro de $10$ cm, ¿cuánto mide su radio en cm?", "correct_answer": "5", "difficulty_level": "Difícil", "order_index": 4}
            ]
        elif level == "Secondary":
            return [
                {"question": "Usa el Teorema de Pitágoras: encuentra la hipotenusa si los catetos de un triángulo rectángulo miden $3$ y $4$", "correct_answer": "5", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Encuentra el cateto faltante de un triángulo rectángulo si la hipotenusa es $10$ y el otro cateto es $6$", "correct_answer": "8", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Calcula el área de un círculo de radio $7$ utilizando $\\pi \\approx 22/7$ (da solo el número entero)", "correct_answer": "154", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Encuentra la suma de los ángulos internos de un pentágono regular en grados", "correct_answer": "540", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Si los lados de dos triángulos semejantes están en relación $1:2$, ¿en qué relación están sus áreas? (escribe como x:y)", "correct_answer": "1:4", "difficulty_level": "Difícil", "order_index": 4}
            ]
        else: # University
            return [
                {"question": "Encuentra el volumen de una esfera de radio $3$ en términos de $\\pi$ (escribe como 36\\pi)", "correct_answer": "36\\pi", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Calcula el área de la superficie lateral de un cilindro de radio $2$ y altura $5$ (escribe en términos de \\pi, ej. 20\\pi)", "correct_answer": "20\\pi", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Determina la constante $c$ en la ecuación de la recta tangente a la circunferencia $x^2 + y^2 = 25$ en el punto $(3,4)$: $3x+4y=c$", "correct_answer": "25", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Encuentra el área encerrada por la curva $y = x^2$ y el eje $x$ desde $x=0$ hasta $x=3$", "correct_answer": "9", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Calcula la curvatura de un círculo de radio $5$ unidades", "correct_answer": "1/5", "difficulty_level": "Difícil", "order_index": 4}
            ]

    elif topic == "Trigonometry":
        if level == "Primary":
            return [
                {"question": "Si un triángulo tiene un ángulo de $90$ grados y otro de $30$, ¿cuánto mide el tercer ángulo en grados?", "correct_answer": "60", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "En un triángulo rectángulo, ¿cómo se llama el lado más largo opuesto al ángulo recto?", "correct_answer": "hipotenusa", "difficulty_level": "Medio", "order_index": 1},
                {"question": "¿Cuántos grados suman los tres ángulos internos de cualquier triángulo?", "correct_answer": "180", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Si un triángulo equilátero tiene tres lados iguales, ¿cuántos grados mide cada uno de sus ángulos?", "correct_answer": "60", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "En un triángulo isósceles, si los dos ángulos iguales miden $50$ grados cada uno, ¿cuánto mide el tercer ángulo?", "correct_answer": "80", "difficulty_level": "Difícil", "order_index": 4}
            ]
        elif level == "Secondary":
            return [
                {"question": "Si $\\sin(\\theta) = 3/5$ en un triángulo rectángulo, ¿cuál es el valor de $\\cos(\\theta)$ en fracción?", "correct_answer": "4/5", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Calcula el valor exacto de $\\sin(30^\\circ)$ como fracción", "correct_answer": "1/2", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Calcula el valor exacto de $\\tan(45^\\circ)$", "correct_answer": "1", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Si la sombra de un poste de $10$ metros mide $10$ metros, ¿cuál es el ángulo de elevación del sol en grados?", "correct_answer": "45", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Simplifica la identidad trigonométrica fundamental: $\\sin^2(\\theta) + \\cos^2(\\theta)$", "correct_answer": "1", "difficulty_level": "Difícil", "order_index": 4}
            ]
        else: # University
            return [
                {"question": "Si $\\sin(x) = 1/2$ y $x$ está en el segundo cuadrante, ¿cuál es el valor exacto de $\\cos(x)$? (escribe como -\\sqrt{3}/2)", "correct_answer": "-\\sqrt{3}/2", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Resuelve para $x$ en $[0, 2\\pi]$: $\\sin(x) - \\cos(x) = 0$. Escribe la primera solución en radianes (ej. \\pi/4)", "correct_answer": "\\pi/4", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Simplifica la fórmula de ángulo doble: $2\\sin(x)\\cos(x)$ en términos algebraicos", "correct_answer": "sin(2x)", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Calcula el periodo de la función trigonométrica $f(x) = \\sin(3x)$ en términos de \\pi", "correct_answer": "2\\pi/3", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Encuentra la derivada de $\\tan(x)$ con respecto a $x$ (escribe como sec^2(x))", "correct_answer": "sec^2(x)", "difficulty_level": "Difícil", "order_index": 4}
            ]

    elif topic == "Statistics":
        if level == "Primary":
            return [
                {"question": "Encuentra la media (promedio) de las notas: $6, 8, 10$", "correct_answer": "8", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Si tienes $3$ manzanas rojas y $2$ verdes en una bolsa, ¿cuál es la probabilidad de sacar una roja al azar? (escribe como fracción x/y)", "correct_answer": "3/5", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Encuentra la mediana del conjunto ordenado de números: $3, 7, 9, 12, 15$", "correct_answer": "9", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Si lanzas una moneda, ¿cuál es la probabilidad en porcentaje de obtener cara?", "correct_answer": "50", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Encuentra la moda en el conjunto de números: $5, 7, 7, 9, 10$", "correct_answer": "7", "difficulty_level": "Difícil", "order_index": 4}
            ]
        elif level == "Secondary":
            return [
                {"question": "Calcula la desviación estándar del conjunto constante $\{4, 4, 4, 4\}$", "correct_answer": "0", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Si lanzas dos dados de 6 caras, ¿cuál es la probabilidad de que la suma sea $7$? (escribe como fracción simplificada)", "correct_answer": "1/6", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Encuentra la probabilidad de obtener $3$ caras seguidas al lanzar una moneda 3 veces en forma de fracción", "correct_answer": "1/8", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Si la media de 5 números es $12$, ¿cuál es la suma total de esos números?", "correct_answer": "60", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Encuentra la cantidad de combinaciones posibles para elegir un comité de $2$ personas entre $4$ candidatos", "correct_answer": "6", "difficulty_level": "Difícil", "order_index": 4}
            ]
        else: # University
            return [
                {"question": "Para una distribución normal estándar $Z$, ¿cuál es la probabilidad aproximada en porcentaje de que $Z$ esté entre $-1$ y $1$? (da solo el número entero)", "correct_answer": "68", "difficulty_level": "Fácil", "order_index": 0},
                {"question": "Si la probabilidad de éxito es $0.3$, ¿cuál es la varianza para esta distribución de Bernoulli?", "correct_answer": "0.21", "difficulty_level": "Medio", "order_index": 1},
                {"question": "Calcula el valor esperado de una variable aleatoria de Poisson con parámetro $\\lambda = 4$", "correct_answer": "4", "difficulty_level": "Medio", "order_index": 2},
                {"question": "Encuentra el valor de la función de distribución acumulada de una distribución uniforme continua en $[0, 10]$ en el punto $x = 3.5$", "correct_answer": "0.35", "difficulty_level": "Difícil", "order_index": 3},
                {"question": "Si los eventos A y B son independientes con $P(A) = 0.4$ y $P(B) = 0.5$, calcula la probabilidad de la intersección $P(A \\cap B)$", "correct_answer": "0.2", "difficulty_level": "Difícil", "order_index": 4}
            ]

    else:
        # Generic Default math exercises
        return [
            {"question": "Resuelve: $2x + 10 = 20$. ¿Cuánto vale $x$?", "correct_answer": "5", "difficulty_level": "Fácil", "order_index": 0},
            {"question": "Calcula el área de un rectángulo de lados $4$ y $7$", "correct_answer": "28", "difficulty_level": "Medio", "order_index": 1},
            {"question": "Si lanzas un dado de 6 caras, ¿cuál es el porcentaje de probabilidad de obtener un número par? (responde solo el número entero)", "correct_answer": "50", "difficulty_level": "Medio", "order_index": 2},
            {"question": "Encuentra la hipotenusa de un triángulo rectángulo con catetos de longitud $3$ y $4$", "correct_answer": "5", "difficulty_level": "Difícil", "order_index": 3},
            {"question": "¿Cuál es el valor absoluto de $-144$?", "correct_answer": "144", "difficulty_level": "Difícil", "order_index": 4}
        ]

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
