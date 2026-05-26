# 🧠 NeuralMath (AI-Powered Math Learning Platform MVP)

NeuralMath is a gamified, agent-powered mathematical learning platform. The application provides personalized topic explanations, progressive learning sessions, and constructive critique loops using advanced multi-agent orchestrations.

Built as a modern, clean monorepo, the platform uses **FastAPI** for its server backend, **LangGraph** for multi-agent coordination, and **React + Vite + TypeScript** for a high-performance, dark-themed gamified interface with **KaTeX** math formulas.

---

## 🏗️ Architecture Overview

The system operates as a unified monorepo coordinated via a multi-container Docker development environment:

```
neuralmath-mvp/
├── agents/             # LangGraph state machine & AI agents (Topic, Exercise, Evaluator, Motivator)
├── backend/            # FastAPI REST backend, database models (SQLAlchemy), and security
└── frontend/           # React SPA (TypeScript, TailwindCSS, Recharts, KaTeX math rendering)
```

### The Agentic Core (LangGraph)
We compile a state-driven graph machine using **LangGraph**. The workflow can route executions directly to individual specialized nodes independently based on the user's progress:
*   **TopicAgent**: Delivers deep, level-appropriate explanations complete with physical analogies in Spanish.
*   **ExerciseAgent**: Generates dynamic 5-problem exercises. It tracks historical performance to scale difficulty progressively.
*   **EvaluatorAgent**: Analyzes the student's answer step-by-step, generating constructive explanations to turn errors into learning opportunities.
*   **MotivatorAgent**: Provides high-energy daily encouragement, streaks, and XP congratulations.

---

## ⚡ The Resilient AI Fallback Pipeline

To guarantee 100% operational uptime in case of API limits or offline environments, our client incorporates a resilient triple-tier fallback architecture:

```
[Request] ──> 1. Gemini 2.0 Flash (Primary LLM via google-genai)
                   │
                   └───[429/Error]──> 2. Groq Llama 3.3 70B (High-Performance Fallback)
                                             │
                                             └───[Error/Offline]──> 3. Local Math AI Simulator (Spanish, LaTeX & Levels)
```

1.  **Gemini 2.0 Flash**: Our primary model, leveraging the state-of-the-art `google-genai` Python SDK.
2.  **Groq (Llama 3.3 70B)**: Active fallback. In case Gemini's free tier hits rate limits, Groq seamlessly takes over in under 3 seconds.
3.  **Local Math Simulator**: Offline fallback. If both keys are missing or exhausted, a highly customized local math simulator runs. It delivers perfectly aligned descriptions and 5-problem math sheets for **Calculus**, **Geometry**, **Trigonometry**, **Algebra**, **Arithmetic**, and **Statistics** tailored for **Primary**, **Secondary**, and **University** students.

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
*   Ensure **Docker Desktop** is running on your machine.
*   Ensure **Git** is installed.

### 1. Set Up Environment Variables
Copy `.env.example` into a new file named `.env` at the root of the project:
```bash
cp .env.example .env
```
Inside `.env`, configure your API keys (the system will degrade gracefully to mock mode if left empty):
```env
# LLM Integrations
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
```

### 2. Boot up the Container Stack
Launch all services in detached mode with live code-reloads and volume mappings active:
```bash
docker-compose up --build -d
```

### 3. Access the Platforms
Once the database health checks pass, open:
*   **Frontend UI**: [http://localhost:5173](http://localhost:5173)
*   **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **PostgreSQL Database**: Port `5432`

---

## 🛡️ Quick Demo Credentials
To bypass registration and instantly log in to a fully seeded workspace with **230 XP**, a active **3-day streak**, and pre-populated progress charts:

*   **Email**: `estudiante@neuralmath.edu`
*   **Password**: `Matematicas123`
*   *Alternatively, simply click the **"Acceso Rápido de Demostración"** button on the Login page!*

---

## 📚 Seeded Topics Covered
The platform is pre-loaded with comprehensive mathematical topics, dynamically serving corresponding curriculum structures:
*   **Primary**: sums/subtractions, basic algebra equations, triangles/squares areas.
*   **Secondary**: fractions/decimals, quadratic equations, trigonometric ratios, Pythagorean theorem.
*   **University**: Limits & continuity, linear algebra & matrices, probability distributions, derivatives & integrals.

---

## 🧪 Tech Stack Details
*   **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL, Pydantic v2, JWT Security, LangGraph.
*   **Frontend**: React, TypeScript, Vite, Recharts (visualizations), Framer Motion (animations), KaTeX (LaTeX typesetting).
