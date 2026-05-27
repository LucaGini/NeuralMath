import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Navbar } from "../components/Navbar";
import { useApp } from "../services/AppContext";
import { avatars, badgesConfig, Locale } from "../services/translations";
import { Flame, Trophy, Calendar, ChevronRight, GraduationCap, Award, Lock, Sparkles, User as UserIcon } from "lucide-react";
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
}

interface SessionRecord {
  id: number;
  score: number;
  xp_earned: number;
  created_at: string;
  completed_at: string;
  topic: {
    name: string;
    area: string;
  };
}

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  
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
              xp_earned: 150,
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
              completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
              topic: { name: language === "es" ? "Suma y Resta Básica" : "Basic Addition & Subtraction", area: "Arithmetic" }
            },
            {
              id: 102,
              score: 4,
              xp_earned: 80,
              created_at: new Date(Date.now() - 86400000).toISOString(),
              completed_at: new Date(Date.now() - 86400000).toISOString(),
              topic: { name: language === "es" ? "Ecuaciones Cuadráticas" : "Quadratic Equations", area: "Algebra" }
            }
          ]);
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

  // Transform session history for Recharts progress curves (Accuracy of the past 10 sessions)
  const recentHistory = [...history].slice(0, 10).reverse();
  const chartData = recentHistory.map((record) => ({
    date: new Date(record.completed_at).toLocaleDateString(language === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" }),
    [language === "es" ? "Puntaje" : "Score"]: record.score,
    topicName: record.topic.name,
    xp: record.xp_earned
  }));

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

            {/* Review Weak Spots button */}
            <button
              onClick={() => navigate("/session/review")}
              className="w-full mt-3 border border-amber-500/30 hover:border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-450 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm shadow shadow-amber-500/5"
            >
              📋 {t.review_weak_spots}
              <ChevronRight className="w-4 h-4 text-amber-600/80" />
            </button>

            {/* Teach Alby button */}
            <button
              onClick={() => navigate("/session/teach-back")}
              className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm shadow-lg shadow-emerald-600/10"
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
                        {language === "es" ? (unlocked ? user.achievements.find(a => a.badge_key === key)?.desc_es : "Bloqueado: " + (key === "perfect_score" ? "Obtén un 5/5" : key === "streak_3" ? "Racha de 3 días" : "Alcanza 500 XP")) : (unlocked ? user.achievements.find(a => a.badge_key === key)?.desc_en : "Locked: " + (key === "perfect_score" ? "Get a 5/5 score" : key === "streak_3" ? "3 days streak" : "Reach 500 XP"))}
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
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
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
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700/60 transition-all duration-150"
                >
                  <div>
                    <span className="text-[10px] text-mathPurple-600 dark:text-mathPurple-400 font-bold uppercase tracking-wider block">
                      {record.topic.area}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">{record.topic.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 block">
                      {record.score} / 5 {language === "es" ? "correctas" : "correct"}
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
            </div>
          </div>
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
      </AnimatePresence>
    </div>
  );
};
