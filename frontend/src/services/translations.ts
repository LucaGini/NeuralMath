export type Locale = "es" | "en";

export interface TranslationDict {
  dashboard: string;
  topics: string;
  logout: string;
  streak: string;
  xp: string;
  streak_days: string;
  welcome: string;
  welcome_sub: string;
  history: string;
  history_empty: string;
  topic: string;
  score: string;
  xp_earned: string;
  date: string;
  active_streak: string;
  level: string;
  change_avatar: string;
  select_avatar: string;
  achievements: string;
  achievements_sub: string;
  new_badge: string;

  login: string;
  register: string;
  email: string;
  password: string;
  name: string;
  academic_level: string;
  primary: string;
  secondary: string;
  university: string;
  quick_demo: string;
  no_account: string;
  have_account: string;
  signing_in: string;
  registering: string;

  select_topic: string;
  start_practice: string;
  back: string;
  explanation: string;
  exercises: string;
  submit: string;
  skip: string;
  next: string;
  submitting: string;
  correct: string;
  incorrect: string;
  completed: string;
  perfect: string;
  session_score: string;
  xp_received: string;
  finish: string;
  loading: string;
  error_loading: string;
  select_answer: string;
  fill_missing: string;
  progress: string;
  skill_map: string;
  mastered: string;
  improving: string;
  needs_work: string;
  continue_path: string;
  your_weakest_skill: string;
  skill_map_empty: string;
  review_weak_spots: string;
  weak_spots: string;
}

export const translations: Record<Locale, TranslationDict> = {
  es: {
    dashboard: "Panel",
    topics: "Temas",
    logout: "Cerrar Sesión",
    streak: "Racha",
    xp: "XP Total",
    streak_days: "días",
    welcome: "¡Hola, {name}!",
    welcome_sub: "Continúa tu aventura matemática. ¡La constancia hace al maestro!",
    history: "Historial de Práctica",
    history_empty: "Aún no has completado ninguna sesión. ¡Comienza hoy!",
    topic: "Tema",
    score: "Puntaje",
    xp_earned: "XP Ganada",
    date: "Fecha",
    active_streak: "Racha Activa",
    level: "Nivel",
    change_avatar: "Cambiar Avatar",
    select_avatar: "Selecciona tu Avatar Matemático",
    achievements: "Logros Desbloqueados",
    achievements_sub: "Desbloquea insignias resolviendo ejercicios y completando rachas.",
    new_badge: "¡Logro Desbloqueado!",

    login: "Iniciar Sesión",
    register: "Registrarse",
    email: "Correo Electrónico",
    password: "Contraseña",
    name: "Nombre Completo",
    academic_level: "Nivel Académico",
    primary: "Primaria",
    secondary: "Secundaria",
    university: "Universidad",
    quick_demo: "Acceso Rápido de Demostración",
    no_account: "¿No tienes una cuenta?",
    have_account: "¿Ya tienes una cuenta?",
    signing_in: "Iniciando sesión...",
    registering: "Registrando...",

    select_topic: "Elige un Tema para Practicar",
    start_practice: "Comenzar Práctica",
    back: "Volver",
    explanation: "Explicación Interactiva",
    exercises: "Ejercicios",
    submit: "Comprobar",
    skip: "Saltar",
    next: "Siguiente",
    submitting: "Comprobando...",
    correct: "¡Excelente!",
    incorrect: "No es correcto",
    completed: "¡Entrenamiento Completado!",
    perfect: "¡Puntaje Perfecto!",
    session_score: "Resolviste {score} de {total} preguntas correctamente.",
    xp_received: "Has ganado +{xp} XP",
    finish: "Finalizar Sesión",
    loading: "Cargando...",
    error_loading: "Error al cargar los datos.",
    select_answer: "Selecciona una respuesta",
    fill_missing: "Escribe el valor que falta...",
    progress: "Progreso",
    skill_map: "Mapa de Habilidades",
    mastered: "Dominado",
    improving: "Mejorando",
    needs_work: "Necesita Práctica",
    continue_path: "Continuar tu Ruta",
    your_weakest_skill: "Tu punto más débil",
    skill_map_empty: "¡Completa algunas sesiones para ver crecer tu mapa de habilidades!",
    review_weak_spots: "Repasar Puntos Débiles",
    weak_spots: "Puntos Débiles",
  },
  en: {
    dashboard: "Dashboard",
    topics: "Topics",
    logout: "Log Out",
    streak: "Streak",
    xp: "Total XP",
    streak_days: "days",
    welcome: "Hello, {name}!",
    welcome_sub: "Continue your math adventure. Practice makes perfect!",
    history: "Practice History",
    history_empty: "No sessions completed yet. Start today!",
    topic: "Topic",
    score: "Score",
    xp_earned: "XP Earned",
    date: "Date",
    active_streak: "Active Streak",
    level: "Level",
    change_avatar: "Change Avatar",
    select_avatar: "Select Your Mathematical Avatar",
    achievements: "Unlocked Achievements",
    achievements_sub: "Unlock badges by solving exercises and completing streaks.",
    new_badge: "Achievement Unlocked!",

    login: "Log In",
    register: "Register",
    email: "Email Address",
    password: "Password",
    name: "Full Name",
    academic_level: "Academic Level",
    primary: "Primary",
    secondary: "Secondary",
    university: "University",
    quick_demo: "Quick Demo Access",
    no_account: "Don't have an account?",
    have_account: "Already have an account?",
    signing_in: "Logging in...",
    registering: "Registering...",

    select_topic: "Choose a Topic to Practice",
    start_practice: "Start Practice",
    back: "Go Back",
    explanation: "Interactive Explanation",
    exercises: "Exercises",
    submit: "Check Answer",
    skip: "Skip",
    next: "Next",
    submitting: "Checking...",
    correct: "Excellent!",
    incorrect: "Not quite correct",
    completed: "Training Completed!",
    perfect: "Perfect Score!",
    session_score: "You solved {score} of {total} questions correctly.",
    xp_received: "You earned +{xp} XP",
    finish: "Finish Session",
    loading: "Loading...",
    error_loading: "Error loading data.",
    select_answer: "Select an answer",
    fill_missing: "Type the missing value...",
    progress: "Progress",
    skill_map: "Skill Map",
    mastered: "Mastered",
    improving: "Improving",
    needs_work: "Needs Work",
    continue_path: "Continue Your Path",
    your_weakest_skill: "Your weakest skill",
    skill_map_empty: "Complete a few sessions to see your skill map grow!",
    review_weak_spots: "Review Weak Spots",
    weak_spots: "Weak Spots",
  }
};

export interface AvatarItem {
  id: string;
  name: string;
  desc_es: string;
  desc_en: string;
  emoji: string;
}

export const avatars: AvatarItem[] = [
  { id: "newton", name: "Isaac Newton", desc_es: "Cálculo y Gravedad", desc_en: "Calculus & Gravity", emoji: "🍎" },
  { id: "curie", name: "Marie Curie", desc_es: "Física y Química", desc_en: "Physics & Chemistry", emoji: "🧪" },
  { id: "einstein", name: "Albert Einstein", desc_es: "Relatividad", desc_en: "Relativity", emoji: "🌌" },
  { id: "hypatia", name: "Hypatia", desc_es: "Álgebra y Filosofía", desc_en: "Algebra & Philosophy", emoji: "📜" },
  { id: "pythagoras", name: "Pythagoras", desc_es: "Geometría", desc_en: "Geometry", emoji: "📐" },
  { id: "lovelace", name: "Ada Lovelace", desc_es: "Computación", desc_en: "Computing", emoji: "💻" },
  { id: "default_student", name: "Estudiante", desc_es: "Explorador Matemático", desc_en: "Math Explorer", emoji: "✏️" }
];

export interface BadgeConfig {
  emoji: string;
  color: string;
  title_es: string;
  title_en: string;
  desc_es: string;
  desc_en: string;
}

export const badgesConfig: Record<string, BadgeConfig> = {
  perfect_score: { 
    emoji: "🏆", 
    color: "from-yellow-400 to-amber-600 border-amber-400 shadow-amber-500/20", 
    title_es: "Prodigio Matemático", 
    title_en: "Math Prodigy",
    desc_es: "Resolviste correctamente todos los ejercicios de una sesión.",
    desc_en: "Solved all exercises correctly in a single session."
  },
  streak_3: { 
    emoji: "🔥", 
    color: "from-orange-500 to-red-600 border-red-500 shadow-red-500/20", 
    title_es: "Guerrero Diario", 
    title_en: "Daily Warrior",
    desc_es: "Mantuviste una racha de aprendizaje de 3 días consecutivos.",
    desc_en: "Maintained an active learning streak of 3 consecutive days."
  },
  xp_500: { 
    emoji: "👑", 
    color: "from-purple-500 to-indigo-600 border-indigo-500 shadow-indigo-500/20", 
    title_es: "Gran Maestro", 
    title_en: "Grandmaster",
    desc_es: "Alcanzaste un total acumulado de 500 XP.",
    desc_en: "Accumulated a lifetime total of 500 XP."
  },
  cosmic_conqueror: { 
    emoji: "🌌", 
    color: "from-blue-600 to-indigo-850 border-indigo-600 shadow-indigo-500/20", 
    title_es: "Cazador del Cosmos", 
    title_en: "Cosmic Conqueror",
    desc_es: "Completaste una Misión Cósmica Diaria en el mapa planetario.",
    desc_en: "Completed a Daily Cosmic Quest on the planetary map."
  },
  robot_mentor: { 
    emoji: "⚙️", 
    color: "from-slate-400 to-cyan-600 border-cyan-400 shadow-cyan-500/20", 
    title_es: "Mentor de Acero", 
    title_en: "Robot Mentor",
    desc_es: "Lograste que Alby evolucione y alcance el Nivel 5.",
    desc_en: "Helped Alby evolve and reach Level 5."
  },
  master_sketcher: { 
    emoji: "🎨", 
    color: "from-pink-500 to-orange-500 border-pink-400 shadow-pink-500/20", 
    title_es: "Lienzo Infinito", 
    title_en: "Infinite Canvas",
    desc_es: "Utilizaste la pizarra de dibujo interactiva en al menos 3 ejercicios de una sesión.",
    desc_en: "Used the interactive sketchpad on at least 3 exercises in a single session."
  },
  streak_7: { 
    emoji: "💎", 
    color: "from-cyan-450 to-blue-600 border-blue-500 shadow-cyan-500/20", 
    title_es: "Disciplina de Acero", 
    title_en: "Steel Discipline",
    desc_es: "Mantuviste una racha de aprendizaje de 7 días consecutivos.",
    desc_en: "Maintained an active learning streak of 7 consecutive days."
  },
  polymath_scholar: { 
    emoji: "📖", 
    color: "from-emerald-400 to-teal-650 border-emerald-500 shadow-emerald-500/20", 
    title_es: "Erudito Polimático", 
    title_en: "Polymath Scholar",
    desc_es: "Completaste al menos una sesión de estudio en 3 temas matemáticos diferentes.",
    desc_en: "Completed at least one study session in 3 different math topics."
  }
};
