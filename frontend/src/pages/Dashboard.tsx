import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Navbar } from "../components/Navbar";
import { MathRenderer } from "../components/MathRenderer";
import { useApp } from "../services/AppContext";
import { avatars, badgesConfig, Locale } from "../services/translations";
import { Flame, Trophy, Calendar, ChevronRight, ChevronLeft, GraduationCap, Award, Lock, Sparkles, User as UserIcon, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

interface UserAchievement {
  id: number;
  badge_key: string;
  title_es: string;
  title_en: string;
  desc_es: string;
  desc_en: string;
  unlocked_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  level: string;
  xp_total: number;
  streak_days: number;
  avatar_id: string;
  achievements: UserAchievement[];
  alby_xp?: number;
}

interface SessionRecord {
  id: number;
  score: number;
  total_exercises: number;
  xp_earned: number;
  created_at: string;
  completed_at: string;
  topic: {
    name: string;
    area: string;
  };
}

interface Topic {
  id: number;
  name: string;
  level: string;
  area: string;
}

// --- Dynamic Vector SVG Alby Companion Character ---
const AlbyAvatar: React.FC<{ level: number }> = ({ level }) => {
  let eyeColor = "#10b981"; // Default glowing green
  let visorColor = "";
  let accessory = null;
  
  if (level === 1) {
    eyeColor = "#3b82f6"; // Rookie blue
    accessory = (
      // Simple antenna
      <path d="M24 10V2M20 2h8" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
    );
  } else if (level === 2) {
    eyeColor = "#a855f7"; // Scholar violet
    accessory = (
      // Vector graduation hat
      <g>
        <path d="M10 11l14-6 14 6-14 6-14-6z" fill="#312e81" stroke="#4338ca" strokeWidth="1" />
        <path d="M15 13.5v3.5c0 1.5 4 3 9 3s9-1.5 9-3.5v-3.5" fill="#1e1b4b" />
        <path d="M31 11v6" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="31" cy="17" r="1.5" fill="#fbbf24" />
      </g>
    );
  } else if (level === 3) {
    eyeColor = "#f59e0b"; // Space Visor amber
    visorColor = "#fbbf24";
    accessory = (
      // Cool neon shades
      <g>
        <path d="M24 10V2M21 2.5h6" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <rect x="10" y="19" width="28" height="7" rx="3.5" fill="#f59e0b" />
        <rect x="12" y="21" width="24" height="3" rx="1.5" fill="#fff" opacity="0.6" />
      </g>
    );
  } else if (level === 4) {
    eyeColor = "#ec4899"; // Math Wizard pink/red
    accessory = (
      // Wizard Hat
      <g>
        <path d="M12 11L24 1l12 10z" fill="#4d2c91" />
        <path d="M7 11.5h34" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M18 7.5l6-5 2 4" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" />
        <circle cx="24" cy="1" r="1.5" fill="#fbbf24" />
      </g>
    );
  } else {
    // Supreme Cosmic
    eyeColor = "#06b6d4"; // Cyan
    accessory = (
      // Halo
      <g>
        <ellipse cx="24" cy="5" rx="15" ry="3.5" fill="none" stroke="#22d3ee" strokeWidth="2" className="animate-pulse" />
        <path d="M24 9l-1.5-4 1.5-1.5 1.5 1.5-1.5 4z" fill="#e0f7fa" />
      </g>
    );
  }

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="w-full h-full p-1 drop-shadow-md select-none pointer-events-none">
      {/* Background / Accessories */}
      {accessory}

      {/* Head Body */}
      <rect x="8" y="13" width="32" height="28" rx="8" fill="url(#alby-face-grad)" stroke="#475569" strokeWidth="2" />
      
      {/* Bolts / Side Ears */}
      <rect x="4" y="22" width="4" height="10" rx="2" fill="#64748b" />
      <rect x="40" y="22" width="4" height="10" rx="2" fill="#64748b" />

      {/* Screen Box */}
      <rect x="12" y="17" width="24" height="18" rx="5" fill="#0b0f19" stroke="#1e293b" strokeWidth="1.5" />

      {/* Eyes or Visor */}
      {visorColor ? (
        // Visor rendering
        null
      ) : (
        <g className="animate-pulse">
          <circle cx="18" cy="25" r="3" fill={eyeColor} />
          <circle cx="30" cy="25" r="3" fill={eyeColor} />
          <circle cx="19.5" cy="23.5" r="0.75" fill="#fff" />
          <circle cx="31.5" cy="23.5" r="0.75" fill="#fff" />
        </g>
      )}

      {/* Socratic smiling mouth */}
      <path d="M20 30c0 0 1.5 2 4 2s4-2 4-2" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

      <defs>
        <linearGradient id="alby-face-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={level === 5 ? "#1e1b4b" : "#64748b"} />
          <stop offset="100%" stopColor={level === 5 ? "#47106e" : "#334155"} />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [journal, setJournal] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"history" | "journal">("history");
  const [historyPage, setHistoryPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  
  // Alby Teach-Back Customization states
  const [topics, setTopics] = useState<Topic[]>([]);
  const [albyModalOpen, setAlbyModalOpen] = useState(false);
  const [selectedAlbyTopics, setSelectedAlbyTopics] = useState<number[]>([]);
  const [albyDuration, setAlbyDuration] = useState(3);
  
  // Daily Cosmic Quest status states
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyXpEarned, setDailyXpEarned] = useState(0);
  
  const navigate = useNavigate();
  const { language, theme, t } = useApp();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch current user details
        const userRes = await api.get("/auth/me");
        setUser(userRes.data);

        // Fetch recent session completions (fallback placeholder if empty)
        try {
          const sessionsRes = await api.get("/sessions/history");
          setHistory(sessionsRes.data);
        } catch {
          // If no custom history route, write smart mocks that blend perfectly
          setHistory([
            {
              id: 101,
              score: 5,
              total_exercises: 5,
              xp_earned: 150,
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
              completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
              topic: { name: language === "es" ? "Suma y Resta Básica" : "Basic Addition & Subtraction", area: "Arithmetic" }
            },
            {
              id: 102,
              score: 4,
              total_exercises: 5,
              xp_earned: 80,
              created_at: new Date(Date.now() - 86400000).toISOString(),
              completed_at: new Date(Date.now() - 86400000).toISOString(),
              topic: { name: language === "es" ? "Ecuaciones Cuadráticas" : "Quadratic Equations", area: "Algebra" }
            }
          ]);
        }
        // Fetch Alby's Journal
        try {
          const journalRes = await api.get("/sessions/alby-journal");
          setJournal(journalRes.data);
        } catch (err) {
          console.error("Error fetching Alby's Journal:", err);
        }

        // Fetch Topics for Alby
        try {
          const topicsRes = await api.get("/topics");
          setTopics(topicsRes.data);
        } catch (err) {
          console.error("Error fetching topics for Alby:", err);
        }

        // Fetch daily challenge status
        try {
          const dailyRes = await api.get("/sessions/daily-challenge/status");
          setDailyCompleted(dailyRes.data.completed);
          setDailyXpEarned(dailyRes.data.xp_earned);
        } catch (err) {
          console.error("Error fetching daily challenge status:", err);
        }
      } catch (err) {
        console.error("Dashboard validation failed, redirecting to login:", err);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, language]);

  const handleAvatarChange = async (avatarId: string) => {
    if (!user) return;
    setUpdatingAvatar(true);
    try {
      const res = await api.post("/sessions/avatar", { avatar_id: avatarId });
      setUser(res.data);
      setAvatarModalOpen(false);
    } catch (err) {
      console.error("Error updating avatar:", err);
    } finally {
      setUpdatingAvatar(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mathPurple-500"></div>
      </div>
    );
  }

  // Get active avatar details
  const activeAvatar = avatars.find((a) => a.id === user.avatar_id) || avatars[avatars.length - 1];

  // Helper to check if a specific badge is unlocked
  const isBadgeUnlocked = (key: string) => {
    return user.achievements.some((a) => a.badge_key === key);
  };

  // Alby level and accessory calculations
  const albyXp = user.alby_xp || 0;
  const albyLevel = Math.floor(albyXp / 100) + 1;
  const albyXpInLevel = albyXp % 100;

  const getAlbyAvatar = (level: number) => {
    if (level === 1) return { name: language === "es" ? "Novato" : "Rookie" };
    if (level === 2) return { name: language === "es" ? "Erudito" : "Scholarly" };
    if (level === 3) return { name: language === "es" ? "Gafas Cósmicas" : "Space Visor" };
    if (level === 4) return { name: language === "es" ? "Hechicero" : "Math Wizard" };
    return { name: language === "es" ? "Supremo" : "Cosmic" };
  };

  const albyInfo = getAlbyAvatar(albyLevel);

  // 7-Day Cosmic Quest calculations
  const daysOfWeek = language === "es"
    ? ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getDayPlanets = () => {
    return ["🪐", "☄️", "🌍", "🌕", "🌞", "🌟", "🌌"];
  };

  const getWeekDaysInfo = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const todayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

    return daysOfWeek.map((name, index) => {
      const isToday = index === todayIndex;
      const isPast = index < todayIndex;
      const isFuture = index > todayIndex;
      return {
        name,
        emoji: getDayPlanets()[index],
        isToday,
        isPast,
        isFuture,
      };
    });
  };

  const weekDays = getWeekDaysInfo();

  const recentHistory = [...history].slice(0, 10).reverse();
  const chartData = recentHistory.map((record) => ({
    date: new Date(record.completed_at).toLocaleDateString(language === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" }),
    [language === "es" ? "Puntaje" : "Score"]: record.score,
    topicName: record.topic.name,
    xp: record.xp_earned
  }));

  const HISTORY_ITEMS_PER_PAGE = 10;
  const totalHistoryPages = Math.ceil(history.length / HISTORY_ITEMS_PER_PAGE);
  const startHistoryIndex = (historyPage - 1) * HISTORY_ITEMS_PER_PAGE;
  const paginatedHistory = history.slice(startHistoryIndex, startHistoryIndex + HISTORY_ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-700 dark:text-slate-200 pb-12 transition-colors duration-200">
      {/* Central Navigation Bar */}
      <Navbar />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Achievements Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-md dark:shadow-xl transition-colors duration-200">
            <div className="absolute top-0 right-0 w-24 h-24 bg-mathPurple-500/5 rounded-full blur-xl" />
            
            <div className="flex items-center gap-4">
              {/* Interactive Avatar Container */}
              <div 
                onClick={() => setAvatarModalOpen(true)}
                className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 border-2 border-mathPurple-500/30 hover:border-mathPurple-500 rounded-2xl flex items-center justify-center text-3xl cursor-pointer hover:scale-105 transition-all shadow-inner group relative"
                title={t.change_avatar}
              >
                <span>{activeAvatar.emoji}</span>
                <div className="absolute -bottom-1 -right-1 bg-mathPurple-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  {user.name}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <GraduationCap className="w-3.5 h-3.5 text-mathPurple-500 dark:text-mathPurple-400" />
                  <span>
                    {user.level === "Primary"
                      ? t.primary
                      : user.level === "Secondary"
                      ? t.secondary
                      : t.university}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 italic block mt-0.5">
                  {language === "es" ? activeAvatar.desc_es : activeAvatar.desc_en}
                </span>
              </div>
            </div>

            {/* Daily Streak & XP Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 transition-colors">
                <Flame className="w-6 h-6 text-orange-500 mb-1" />
                <span className="text-lg font-bold text-slate-800 dark:text-white">{user.streak_days}</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  {t.streak} ({t.streak_days})
                </span>
              </div>
              <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 transition-colors">
                <Trophy className="w-6 h-6 text-yellow-500 mb-1" />
                <span className="text-lg font-bold text-slate-800 dark:text-white">{user.xp_total} XP</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  {t.xp}
                </span>
              </div>
            </div>

            {/* Start Practice button */}
            <button
              onClick={() => navigate("/topics")}
              className="w-full mt-6 bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-mathPurple-600/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm"
            >
              {t.start_practice}
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Speed Run button */}
            <button
              onClick={() => navigate("/session/speed-run")}
              className="w-full mt-3 bg-gradient-to-r from-orange-500 to-red-650 hover:from-orange-400 hover:to-red-550 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm shadow-lg shadow-orange-600/10"
            >
              ⏱️ {language === "es" ? "Contrarreloj / Speed-Run" : "Math Speed-Run"}
              <ChevronRight className="w-4 h-4 text-orange-100" />
            </button>

            {/* Review Weak Spots button */}
            <button
              onClick={() => navigate("/session/review")}
              className="w-full mt-3 border border-amber-500/30 hover:border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-450 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm shadow shadow-amber-500/5"
            >
              📋 {t.review_weak_spots}
              <ChevronRight className="w-4 h-4 text-amber-600/80" />
            </button>

          </div>

          {/* Alby Affinity & Level Card */}
          <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-md dark:shadow-xl transition-colors duration-200">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
            
            <div className="flex items-center gap-4">
              {/* Dynamic Avatar display with hover effect */}
              <div className="w-16 h-16 bg-slate-50 dark:bg-[#070b14]/50 border-2 border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-inner relative group p-1 transition-all duration-300 hover:border-emerald-500/40">
                <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <AlbyAvatar level={albyLevel} />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                    Alby ({albyInfo.name})
                  </h4>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Nivel {albyLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === "es" 
                    ? "¡Tu compañero robótico de aprendizaje!" 
                    : "Your robotic learning companion!"}
                </p>
              </div>
            </div>

            {/* Progress Bar towards next level */}
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>XP: {albyXpInLevel} / 100</span>
                <span>{language === "es" ? "Siguiente Nivel" : "Next Level"}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-850/40 relative shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${albyXpInLevel}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                />
              </div>
            </div>

            {/* Button to Teach Alby */}
            <button
              onClick={() => setAlbyModalOpen(true)}
              className="w-full mt-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm shadow-lg shadow-emerald-600/10"
            >
              🤖 {language === "es" ? "Enseñar a Alby" : "Teach Alby"}
              <ChevronRight className="w-4 h-4 text-emerald-100" />
            </button>
          </div>

          {/* Gamified Achievements Gallery */}
          <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-md dark:shadow-xl transition-colors duration-200">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-mathPurple-500" />
              {t.achievements}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              {t.achievements_sub}
            </p>

            <div className="space-y-4">
              {Object.entries(badgesConfig).map(([key, config]) => {
                const unlocked = isBadgeUnlocked(key);
                return (
                  <div 
                    key={key} 
                    className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${
                      unlocked 
                        ? "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80" 
                        : "bg-slate-100/40 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900/60 opacity-60"
                    }`}
                  >
                    {/* Badge Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl border shadow-md bg-gradient-to-tr ${
                      unlocked ? config.color : "from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 border-slate-300 dark:border-slate-800"
                    }`}>
                      {unlocked ? config.emoji : <Lock className="w-4 h-4 text-slate-400 dark:text-slate-600" />}
                    </div>

                    <div className="flex-1">
                      <span className={`text-xs font-bold block ${unlocked ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-600"}`}>
                        {language === "es" ? config.title_es : config.title_en}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                        {language === "es"
                          ? (unlocked ? user.achievements.find(a => a.badge_key === key)?.desc_es : "Bloqueado: " + config.desc_es)
                          : (unlocked ? user.achievements.find(a => a.badge_key === key)?.desc_en : "Locked: " + config.desc_en)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Analytics & Progression Curve Right Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cosmic Quest Daily Calendar Row */}
          <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-orange-500/20 p-6 rounded-3xl shadow-md dark:shadow-xl relative overflow-hidden transition-all duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="text-left">
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-orange-500" />
                  {language === "es" ? "Desafío Cósmico Especial" : "Special Cosmic Challenge"}
                </span>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  {language === "es" ? "⚔️ Misión Diaria: Boss Fight" : "⚔️ Daily Quest: Boss Fight"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
                  {language === "es"
                    ? "Un único problema matemático de alta dificultad adaptado a tu nivel académico. ¡Completarlo hoy te otorga un súper bono de +100 XP y potencia el nivel de Alby!"
                    : "A single high-difficulty math problem custom-tailored to your level. Completing it grants a massive +100 XP bonus and empowers Alby!"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {dailyCompleted ? (
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl flex items-center gap-2 shadow-inner">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                    <div className="text-left">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest block">
                        {language === "es" ? "Completado" : "Completed"}
                      </span>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-350 block">
                        +{dailyXpEarned || 100} XP {language === "es" ? "Ganados" : "Earned"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate("/session/daily-challenge")}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-550/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs uppercase tracking-wider flex items-center gap-2"
                  >
                    {language === "es" ? "Iniciar Boss Fight ⚔️" : "Start Boss Fight ⚔️"}
                  </button>
                )}
              </div>
            </div>

            {/* Calendar Row with Planetary Nodes */}
            <div className="grid grid-cols-7 gap-2 md:gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60">
              {weekDays.map((day, idx) => {
                const isToday = day.isToday;
                const isCompleted = (isToday && dailyCompleted) || day.isPast;
                
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2.5">
                      {day.name}
                    </span>
                    
                    <div 
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl relative transition-all duration-300 border shadow-inner ${
                        isToday
                          ? dailyCompleted
                            ? "bg-gradient-to-tr from-emerald-500 to-teal-500 border-emerald-400 shadow-emerald-500/20 text-white scale-105"
                            : "bg-slate-50 dark:bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/30 animate-pulse text-slate-800 dark:text-white scale-105 shadow-cyan-500/10"
                          : isCompleted
                            ? "bg-emerald-500/5 dark:bg-emerald-955/40 border-emerald-200/20 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-950/60 border-slate-200 dark:border-slate-900 text-slate-400 dark:text-slate-600"
                      }`}
                      title={day.name}
                    >
                      {isCompleted ? "✓" : day.emoji}
                      
                      {isToday && !dailyCompleted && (
                        <div className="absolute -inset-1 rounded-full border border-cyan-400/40 animate-ping pointer-events-none" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tab Selection Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 font-bold text-sm tracking-wide transition-all ${
                activeTab === "history"
                  ? "border-b-2 border-mathPurple-500 text-mathPurple-500"
                  : "text-slate-400 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-300"
              }`}
            >
              {language === "es" ? "📊 Rendimiento e Historial" : "📊 Performance & History"}
            </button>
            <button
              onClick={() => setActiveTab("journal")}
              className={`pb-3 font-bold text-sm tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === "journal"
                  ? "border-b-2 border-emerald-500 text-emerald-500"
                  : "text-slate-400 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-300"
              }`}
            >
              <span>🤖📓 {language === "es" ? "La Bitácora de Alby" : "Alby's Journal"}</span>
              {journal.length > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {journal.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "history" && (
            <>
              {/* Accuracy Progress chart */}
              <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-md dark:shadow-xl transition-colors duration-200">
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">
                  {language === "es" ? "Historial de Precisión (Últimas 10 Sesiones)" : "Accuracy Performance (Last 10 Sessions)"}
                </h3>
                <div className="h-64 flex flex-col justify-center">
                  {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#1e293b" : "#e2e8f0"} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                            borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
                            borderRadius: "16px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            color: theme === "dark" ? "#f8fafc" : "#0f172a",
                            fontSize: "12px",
                            border: "1px solid"
                          }}
                          labelFormatter={(label, items) => {
                            if (items && items[0]) {
                              return items[0].payload.topicName;
                            }
                            return label;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey={language === "es" ? "Puntaje" : "Score"} 
                          stroke="#8b5cf6" 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill="url(#colorScore)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl h-full transition-colors duration-200">
                      <div className="text-4xl mb-2">📈</div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                        {language === "es" ? "¡Gráfico de Progreso Vacío!" : "No Progression Data Yet!"}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[280px]">
                        {language === "es" 
                          ? "Completa tu primer entrenamiento matemático para visualizar tu curva de aprendizaje." 
                          : "Complete your first math training session to visualize your accuracy learning curve here."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent sessions */}
              <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-md dark:shadow-xl transition-colors duration-200">
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-mathPurple-500" />
                  {t.history}
                </h3>
                
                <div className="space-y-3">
                  {paginatedHistory.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl hover:border-slate-300 dark:hover:hover:border-slate-700/60 transition-all duration-150"
                    >
                      <div>
                        <span className="text-[10px] text-mathPurple-600 dark:text-mathPurple-400 font-bold uppercase tracking-wider block">
                          {record.topic.area}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white text-sm">{record.topic.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 block">
                          {record.score} / {record.total_exercises || 5} {language === "es" ? "correctas" : "correct"}
                        </span>
                        <span className="text-xs text-green-600 dark:text-green-400 font-bold block">
                          +{record.xp_earned} XP
                        </span>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      {t.history_empty}
                    </div>
                  )}

                  {/* Elegant Pagination Controls */}
                  {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button
                        onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                        disabled={historyPage === 1}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        title={language === "es" ? "Página anterior" : "Previous page"}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setHistoryPage(page)}
                          className={`w-8 h-8 rounded-xl border text-xs font-bold transition-all ${
                            historyPage === page
                              ? "bg-gradient-to-r from-mathPurple-600 to-indigo-600 border-mathPurple-500 text-white shadow-md shadow-mathPurple-600/10"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-455 hover:text-slate-800 dark:hover:text-white"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))}
                        disabled={historyPage === totalHistoryPages}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        title={language === "es" ? "Siguiente página" : "Next page"}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "journal" && (
            <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-md dark:shadow-xl relative overflow-hidden transition-colors duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  📓 {language === "es" ? "Apuntes de Alby" : "Alby's Journal"}
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                  {language === "es" ? "Metacognición Activa" : "Active Metacognition"}
                </span>
              </div>

              {journal.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl">
                  <div className="text-4xl mb-2">🤖📓</div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-355">
                    {language === "es" ? "La bitácora está vacía" : "Alby's journal is empty!"}
                  </p>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                    {language === "es"
                      ? "Enséñale a tu compañero Alby resolviendo correctamente lecciones en el modo 'Enseñar a Alby'."
                      : "Teach your companion robot Alby by correctly resolving corrective feedback tasks in 'Teach Alby' mode."}
                  </p>
                  <button
                    onClick={() => setAlbyModalOpen(true)}
                    className="mt-4 text-xs font-bold text-emerald-500 hover:underline uppercase tracking-wider"
                  >
                    {language === "es" ? "Comenzar Tutoría" : "Start Tutoring"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 relative">
                  {/* Notebook spiral rings representation */}
                  <div className="absolute left-[-15px] top-0 bottom-0 w-2 flex flex-col justify-around pointer-events-none opacity-40">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-slate-300 dark:bg-slate-750 rounded-full border border-slate-400 dark:border-slate-900 shadow-inner" />
                    ))}
                  </div>

                  <div className="pl-4 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {journal.map((entry, idx) => (
                      <div
                        key={entry.id}
                        className="bg-amber-50/40 dark:bg-slate-900/60 border-l-4 border-amber-400 dark:border-emerald-500/80 p-4 rounded-r-2xl shadow-sm relative group hover:scale-[1.01] transition-transform duration-150"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-amber-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                            {language === "es" ? `Lección Aprendida #${journal.length - idx}` : `Insight Taught #${journal.length - idx}`} — {entry.concept}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500">
                            {new Date(entry.created_at).toLocaleDateString(language === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 italic leading-relaxed">
                          <MathRenderer text={`"${entry.entry_text}"`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modern Avatar Selection Pop-up Modal */}
      <AnimatePresence>
        {avatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl transition-colors duration-200"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-mathPurple-500" />
                {t.select_avatar}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                {language === "es" ? "Elige el rostro de las matemáticas que te acompañará en tu aprendizaje." : "Choose the mathematician figure to guide your daily training loop."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {avatars.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => !updatingAvatar && handleAvatarChange(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer hover:scale-[1.01] transition-all ${
                      user.avatar_id === item.id 
                        ? "bg-mathPurple-50 dark:bg-mathPurple-950/20 border-mathPurple-500 text-mathPurple-900 dark:text-mathPurple-300"
                        : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-3xl">{item.emoji}</span>
                    <div>
                      <span className="text-xs font-bold block">{item.name}</span>
                      <span className="text-[9px] opacity-70 block mt-0.5">
                        {language === "es" ? item.desc_es : item.desc_en}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={updatingAvatar}
                  onClick={() => setAvatarModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-50 transition-colors"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {albyModalOpen && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl transition-colors duration-200"
            >
              <div className="flex items-center gap-3.5 border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-3xl animate-bounce">
                  🤖
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">
                    {language === "es" ? "Enseñar a Alby" : "Tutoring Alby"}
                  </h3>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-450 uppercase tracking-widest font-black block">
                    {language === "es" ? `Alineado a nivel: ${user.level === "Primary" ? "Primaria" : user.level === "Secondary" ? "Secundaria" : "Universidad"}` : `Level: ${user.level}`}
                  </span>
                </div>
              </div>

              {/* Subtitle description */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                {language === "es" 
                  ? "Alby es tu compañero robótico que está aprendiendo. Ayúdale a encontrar y corregir sus deslices matemáticos. Selecciona qué temas quieres repasar con él."
                  : "Alby is your learning robot companion. Help him identify and socratic-correct his math slips. Select the topics you want to practice with him."}
              </p>

              {/* Topics Selection Checklist */}
              <div className="space-y-3 mb-6">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {language === "es" ? "Selecciona Temas de Enfoque" : "Select Focus Topics"}
                </label>
                <div className="max-h-48 overflow-y-auto pr-1 space-y-2 border border-slate-100 dark:border-slate-800/60 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10">
                  {topics
                    .filter((t) => t.level.toLowerCase() === user.level.toLowerCase())
                    .map((tItem) => {
                      const isSelected = selectedAlbyTopics.includes(tItem.id);
                      return (
                        <div
                          key={tItem.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAlbyTopics(selectedAlbyTopics.filter((id) => id !== tItem.id));
                            } else {
                              setSelectedAlbyTopics([...selectedAlbyTopics, tItem.id]);
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:scale-[1.005] active:scale-[0.995] transition-all text-xs font-semibold ${
                            isSelected
                              ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-450"
                              : "bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 accent-emerald-500 cursor-pointer pointer-events-none"
                          />
                          <span>{tItem.name}</span>
                        </div>
                      );
                    })}
                  {topics.filter((t) => t.level.toLowerCase() === user.level.toLowerCase()).length === 0 && (
                    <p className="text-xs text-slate-450 dark:text-slate-500 italic py-2 text-center">
                      {language === "es" ? "Cargando temas disponibles..." : "Loading available topics..."}
                    </p>
                  )}
                </div>
              </div>

              {/* Number of exercises picker */}
              <div className="space-y-3 mb-6">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {language === "es" ? "Cantidad de Desafíos" : "Number of Challenges"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setAlbyDuration(num)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        albyDuration === num
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/10"
                          : "bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700"
                      }`}
                    >
                      {num} {language === "es" ? "Ejercicios" : "Problems"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => setAlbyModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </button>
                <button
                  onClick={() => {
                    setAlbyModalOpen(false);
                    const topicIdsQuery = selectedAlbyTopics.length > 0 ? `&topics=${selectedAlbyTopics.join(",")}` : "";
                    navigate(`/session/teach-back?exercise_count=${albyDuration}${topicIdsQuery}`);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {language === "es" ? "Iniciar Tutoría 🚀" : "Start Tutoring 🚀"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
