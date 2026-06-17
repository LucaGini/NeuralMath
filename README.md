![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11-green)
![React](https://img.shields.io/badge/React-18-blue)

Copyright (C) 2026 Luca Gini
Licensed under the GNU Affero General Public License v3.0

# NeuralMath — AI-Powered Math Learning Platform

NeuralMath is a highly rigorous, gamified, and agent-powered mathematical learning platform. The application provides personalized topic explanations, progressive learning sessions, interactive teaching workflows, and constructive critique loops using advanced multi-agent orchestrations.

Built as a modern, clean monorepo, the platform uses FastAPI for its server backend, LangGraph for multi-agent coordination, and React + Vite + TypeScript for a high-performance, responsive gamified interface with KaTeX math rendering.

---

## Technical Architecture Overview

The system operates as a unified monorepo coordinated via a multi-container Docker development environment:

```
neuralmath-mvp/
├── agents/             # LangGraph state machine & AI agents (Topic, Exercise, Evaluator, Motivator, Protege)
├── backend/            # FastAPI REST backend, database models (SQLAlchemy), and security
└── frontend/           # React SPA (TypeScript, TailwindCSS, Recharts, KaTeX math rendering)
```

### The Agentic Core (LangGraph)

We compile a state-driven graph machine using LangGraph. The workflow can route executions directly to individual specialized nodes independently based on the user's progress:
*   **TopicAgent**: Delivers deep, level-appropriate explanations complete with physical analogies.
*   **ExerciseAgent**: Generates dynamic exercises matching the student's topic and level. It tracks historical performance to scale difficulty progressively.
*   **EvaluatorAgent**: Analyzes the student's answer step-by-step, generating constructive explanations to turn errors into learning opportunities.
*   **HintAgent**: Provides subtle, incremental, and socratic hints to help students find their own path to the solution without revealing the answer.
*   **MotivatorAgent**: Provides daily encouragement, streaks, and XP congratulations.
*   **ProtegeAgent**: Acts as Alby, a virtual peer student who solves exercises with subtle misconceptions, allowing students to learn by teaching.


---

## Platform Structure: The 4 Primary Views (Tabs)

The NeuralMath client-side application is organized into four main tabs/views accessible via the sticky navigation bar:

### 1. Panel (Dashboard)
The central hub for the student's experience. It coordinates individual stats and quick navigation shortcuts:
*   **Key Statistics Header**: Renders the active streak, total accumulated XP, and current level.
*   **Interactive Mathematical Personas**: Displays the student's historical avatar (such as Isaac Newton or Marie Curie). Clicking this avatar container opens a modern selection modal allowing students to choose and save their preferred math historical persona.
*   **Weekly Planetary Map**: A week-based planetary calendar where each day is a celestial body. The current day pulses dynamically, inviting the student to engage in the daily difficult exercise (Boss Fight).
*   **Visual Alby Card**: A dedicated panel displaying the robot Alby floating dynamically. Shows his current level, XP, and direct socratic tutoring launch button.
*   **Achievements Panel**: Highlights the student's unlocked and locked achievements in a beautifully reactive grid.

### 2. Seleccionar Temas (Topics Selection)
The gateway to structured academic learning:
*   **Academic Level Toggle**: Filter topics dynamically by educational tier: Primary (Basic Arithmetic), Secondary (Equations and Geometry), or University (Calculus, Integrals, and Statistics).
*   **Thematic Lesson Display**: Select topics to receive interactive explanations prepared in real-time by the TopicAgent, rendering formulas in clear KaTeX/LaTeX syntax.
*   **Text-To-Speech Narrations**: A dedicated audio player button lets students listen to the lesson spoken in a natural, comfortable speed in either Spanish or English.
*   **Subtopic Exploration**: Drills down into specific micro-concepts for targeted focus.
*   **Session Configurator Modal**: Starting a lesson prompts a backdrop-blur modal to configure session duration (3, 5, or 10 exercises) and select a narrative adventure theme.

### 3. Mi Progreso (Progress)
A sophisticated learning analytics dashboard focusing on metacognitive self-assessment:
*   **High-Level Analytics**: Aggregates total answers, mastered skills, and average accuracy metrics.
*   **Cognitive Error Heatmap**: When algebra or rounding errors are detected, a Recharts-powered radar chart visualizes the precise mathematical taxonomy of recent misconceptions.
*   **Metacognitive Advisor**: Delivers personalized, socratic guidance and constructive recommendations written in real-time to correct recurring patterns (such as missing integration constants or decimal precision rounding errors).
*   **Skill Mastery Grid**: Breaks down individual math concepts showing their current status (Mastered, Improving, or Needs Work), absolute accuracy progress bars, and historical average solve times in seconds.
*   **Adaptive Path Recommendations**: Provides direct routing to reinforce weak skills.

### 4. Mi Perfil (Profile)
Account and tier settings management:
*   **User Details Editor**: Allows updating full name, profile credentials, and security passwords.
*   **Global Academic Level Switch**: Overrides the active grade tier. Changing the level to Primary, Secondary, or University automatically reconfigures the topic list, generative exercises, and AI tutors to match the student's new grade requirements.

---

## The 5 Active Exercise and Study Modes

To support varied learning styles, NeuralMath offers five distinct exercise modes. Several of these modes operate as self-directed practices without direct chatbot tutor dialogue:

### 1. Standard Thematic Practice (Narrative Adventure)
*   **Nature**: Self-directed thematic exercises based on chosen math areas.
*   **Adventure Themes**: Exercises are wrapped in immersive narrative plots:
    *   **Standard Practice**: Pure, direct, and focused mathematical calculations.
    *   **Space Odyssey**: Align spaceship thrusters and calculate orbital mechanics to escape wormholes.
    *   **Fantasy Realm**: Cast ancient spells and strike mythical beasts using calculated arithmetic.
    *   **Sports Championship**: Coordinate soccer passes and score goals by solving speed challenges.
*   **Dynamic**: Students solve 3, 5, or 10 progressive problems with strict algebraic checks, utilizing the interactive whiteboard.

### 2. Daily Cosmic Quest (Boss Fight)
*   **Nature**: A daily academic challenge of maximum difficulty.
*   **Dynamic**: Consists of a single, high-difficulty word problem or equation matching the user's educational tier. Completing it successfully awards +100 XP, advances the planetary calendar, and secures the daily streak.

### 3. Math Speed-Run (Contrarreloj)
*   **Nature**: Rapid-fire mental math training without assistance or dialogue.
*   **Dynamic**: Pushes students to calculate quickly under the pressure of a ticking 30-second countdown timer per question. Resolving exercises correctly scales streak multipliers.

### 4. Adaptive Review Session
*   **Nature**: Targeted remediation workout.
*   **Dynamic**: Scans recent progress records for weak skills (accuracy below 70%) and constructs a specialized 5-question review to help the student master the concept and turn red skills into green.

### 5. Teach Alby (AI Protégé / Feynman Method)
*   **Nature**: Socratic explanation and pedagogical correction.
*   **Dynamic**: Alby solves an equation but introduces a subtle algebraic misconception (e.g. omitting the integration constant "+ C", swapping signs, or rounding incorrectly). The student acts as the socratic tutor and writes a constructive text explanation pointing out the flaw. The socratic evaluator assesses the response, awarding +25 XP to Alby upon success and triggering his physical evolution.

---

## Key Interactive Learning Features

The platform integrates several interactive components designed to drive engagement and retention:

### 1. Interactive Whiteboard Sketchpad
Directly integrated into the exercise card is an HTML5 drawing canvas. Students can sketch and write out math calculations on screen without requiring physical paper.
*   **Input Handling**: Full pointer, mouse, and touch tracking with automatic scroll prevention on mobile devices.
*   **Utility Controls**: Includes an undo stroke history, a clearing function, and an alpha-blended transparent eraser that functions in both dark and light modes.
*   **Auto-Reset**: The whiteboard clears automatically when changing questions to ensure a clean workspace.

### 2. Evolving Vector Alby Avatar
Alby is a virtual peer robot companion. To represent his learning progress, Alby is rendered as a dynamic React SVG component that evolves physically based on the user's total XP:
*   **Level 1 (Rookie)**: Standard robot chassis with a classic antenna and blue eyes.
*   **Level 2 (Scholarly)**: Wears a clean vector-based graduation cap.
*   **Level 3 (Space Visor)**: Wears animated neon-orange sun shades.
*   **Level 4 (Math Wizard)**: Wears a golden wizard hat with celestial sparkles.
*   **Level 5+ (Cosmic)**: Wears a glowing, pulsing space halo with galactic colors.
*   **Visual Polish**: Alby's name tags simplify dynamically to avoid redundancy (e.g. Alby Erudito becomes Erudito), and the entire robot card incorporates custom hover scale micro-animations.

### 3. Dynamic Achievements Catalog
The gamification system is powered by an autogenerable 8-badge catalog:
*   **Math Prodigy**: 100% correct answers in a session.
*   **Daily Warrior**: Active 3-day learning streak.
*   **Grandmaster**: 500 total XP accumulated.
*   **Cosmic Conqueror**: Complete a Daily Cosmic Quest.
*   **Robot Mentor**: Help Alby evolve to Level 5.
*   **Infinite Canvas**: Use the drawing scratchpad on at least 3 problems in a single session.
*   **Steel Discipline**: Active 7-day learning streak.
*   **Polymath Scholar**: Successfully complete sessions across 3 different mathematical topics.
*   **Scalable Architecture**: All badge metadata is declared centrally in translations.ts. The Dashboard UI parses this list dynamically, ensuring new badges can be introduced with zero UI layout code changes.

---

## Strict Socratic Mathematical Rigor

To prevent leniency and guarantee that students are evaluated with academic precision, the EvaluatorAgent prompts enforce strict socratic verification guidelines across all topics:
*   **Indefinite Integrals & ODEs**: Indefinite integrals and ODE general solutions must explicitly include the constant of integration "+ C" or "+ c" in the correct mathematical position. Evaluators reject incomplete answers and explain the necessity of the constant.
*   **Hypothesis Testing (H0 vs H1)**: Null hypothesis (H0) statements must contain equality (=, <=, >=), and alternative hypothesis (H1) statements must contain strict inequalities (<, >, !=). Swapped operators are rejected immediately.
*   **Definite Integrals & Bounded Areas**: Bounded geometric areas calculated under curves must be strictly positive. If the student submits a signed negative definite integral value for a geometric area question, it is rejected.
*   **Decimal Precision & Rounding**: Probability calculations, Z-scores, and p-values are constrained to a strict rounding tolerance window of +/- 0.005 to ensure accurate statistical lookups.
*   **Geometric Units**: The system strictly validates units. Area must be represented in squared units (e.g., cm^2), volume in cubic units (e.g., cm^3), and perimeter in linear units (e.g., cm). Confusing dimensions results in an immediate correction.
*   **Polynomial Factorization**: Factoring questions require factorized notation (multiplied terms in parentheses). Expanded polynomials (e.g., x^2 - 5x + 6 instead of (x-2)(x-3)) are rejected.

---

## Session Resiliency and Axios Interceptors

To prevent users from encountering generic API error pages due to token expiration (24-hour limit) or server container restarts:
*   **Axios Interceptor**: A global response interceptor in api.ts catches any 401 Unauthorized API error.
*   **Credential Cleanup**: Upon catching a 401, the frontend securely clears expired authentication tokens and profiles from localStorage.
*   **Graceful Redirect**: Students are routed back to the login screen with a custom parameter `?expired=true`.
*   **Socratic Warning Banner**: The login page renders an amber alert card explaining exactly what occurred, prompting the student to log back in without losing active session context.

---

## Quick Start (Running Locally)

### Prerequisites
*   Ensure **Docker Desktop** is active and running.
*   Ensure **Git** is installed.

### 1. Configure Environment Variables
Copy `.env.example` into a new file named `.env` at the root of the project:
```bash
cp .env.example .env
```
Open `.env` and specify your LLM API keys. If left empty, the application will degrade gracefully to mock mode:
```env
# LLM Integrations
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
```

### 2. Launch Services
Start the complete Docker container stack in detached mode:
```bash
docker-compose up --build -d
```

### 3. Service Endpoints
*   **Frontend Client**: http://localhost:5173
*   **FastAPI Interactive Swagger Docs**: http://localhost:8000/docs
*   **PostgreSQL Port**: 5432

---

## Demo Credentials

To bypass registrations and log into a pre-populated workspace with **230 XP**, an active **3-day streak**, and filled progress metrics:
*   **Email**: `estudiante@neuralmath.edu`
*   **Password**: `Matematicas123`
*   *Alternatively, click the "Acceso Rápido de Demostración" button on the Login page.*

> These are read-only demo credentials for evaluation purposes only.

---

## Technical Stack Details

*   **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL, Pydantic v2, JWT Security, LangGraph, Gemini, Groq, Langchain.
*   **Frontend**: React, TypeScript, Vite, Recharts, Framer Motion, KaTeX (LaTeX typesetting).
*   **Deployment**: Vercel, Render, Neon.
